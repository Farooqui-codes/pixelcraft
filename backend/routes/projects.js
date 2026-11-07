const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { syncSubscriptionStatus } = require('../middleware/subscription');
const { getPlansConfig } = require('../config/plans');

// GET USER'S PROJECTS
router.get('/', authenticate, async (req, res) => {
    try {
        await syncSubscriptionStatus(req.user);
        const { category, search, tool_id, sort = 'updated_at', order = 'desc', page = 1, limit = 20 } = req.query;

        let projects = await db.find('projects', { user_id: req.user.id });

        if (category && category !== 'all') {
            projects = projects.filter(p => p.category === category);
        }
        if (tool_id) {
            projects = projects.filter(p => p.tool_id === tool_id);
        }
        if (search) {
            const s = search.toLowerCase();
            projects = projects.filter(p => p.title.toLowerCase().includes(s) || (p.tool_id && p.tool_id.toLowerCase().includes(s)));
        }

        // Sorting
        projects.sort((a, b) => {
            const valA = a[sort] || '';
            const valB = b[sort] || '';
            if (order === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        const total = projects.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const startIndex = (pageNum - 1) * limitNum;
        const paginated = projects.slice(startIndex, startIndex + limitNum);

        const plans = await getPlansConfig(db);
        const userPlan = req.user.plan || 'free';
        const planConfig = plans[userPlan] || plans.free;
        const maxLimit = planConfig.maxProjects || 5;

        return res.json({
            success: true,
            projects: paginated,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            limits: {
                used: total,
                max: maxLimit,
                plan: userPlan
            }
        });
    } catch (error) {
        console.error('Projects fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve projects.' });
    }
});

// GET PUBLIC SHAREABLE PROJECT (Open to public when marked is_public)
router.get('/public/:id', async (req, res) => {
    try {
        const project = await db.findOne('projects', { id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        if (!project.is_public) {
            return res.status(403).json({ success: false, message: 'This project is private and has not been shared publicly by its creator.' });
        }
        const author = await db.findOne('profiles', { id: project.user_id });
        return res.json({
            success: true,
            project: {
                ...project,
                author_name: author ? author.full_name : 'PixelCraft Creator'
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Error retrieving public project.' });
    }
});

// GET SINGLE PROJECT
router.get('/:id', authenticate, async (req, res) => {
    try {
        const project = await db.findOne('projects', { id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        // Enforce user isolation
        if (project.user_id !== req.user.id && !project.is_public && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied to this private project.' });
        }

        return res.json({ success: true, project });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching project.' });
    }
});

// CREATE / SAVE PROJECT
router.post('/', authenticate, async (req, res) => {
    try {
        await syncSubscriptionStatus(req.user);
        const { title, tool_id, category, thumbnail_data, project_data, is_public } = req.body;

        if (!title || !tool_id) {
            return res.status(400).json({ success: false, message: 'Title and tool identifier are required.' });
        }

        // Check plan limits
        const existingCount = await db.count('projects', { user_id: req.user.id });
        const plans = await getPlansConfig(db);
        const userPlan = req.user.plan || 'free';
        const planConfig = plans[userPlan] || plans.free;
        const limit = planConfig.maxProjects || 5;

        if (existingCount >= limit) {
            return res.status(403).json({
                success: false,
                code: 'PROJECT_LIMIT_EXCEEDED',
                message: `Project storage limit reached (${existingCount}/${limit} projects). Please upgrade to Pro or Business to save more projects.`,
                requiresUpgrade: true,
                requiredPlan: userPlan === 'free' ? 'pro' : 'business',
                currentCount: existingCount,
                limit
            });
        }

        const newProject = await db.insert('projects', {
            user_id: req.user.id,
            title: title.trim(),
            tool_id,
            category: category || 'general',
            thumbnail_data: thumbnail_data || null,
            project_data: project_data || {},
            is_public: !!is_public,
            version: 1
        });

        return res.status(201).json({
            success: true,
            message: 'Project saved successfully!',
            project: newProject
        });
    } catch (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ success: false, message: 'Failed to save project.' });
    }
});

// UPDATE / AUTOSAVE PROJECT
router.put('/:id', authenticate, async (req, res) => {
    try {
        const project = await db.findOne('projects', { id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        if (project.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const { title, thumbnail_data, project_data, is_public } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title.trim();
        if (thumbnail_data !== undefined) updates.thumbnail_data = thumbnail_data;
        if (project_data !== undefined) updates.project_data = project_data;
        if (is_public !== undefined) updates.is_public = !!is_public;
        updates.version = (project.version || 1) + 1;

        const updated = await db.update('projects', { id: project.id }, updates);
        const result = updated && updated.length ? updated[0] : { ...project, ...updates };

        return res.json({
            success: true,
            message: 'Project updated successfully.',
            project: result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update project.' });
    }
});

// DUPLICATE PROJECT
router.post('/:id/duplicate', authenticate, async (req, res) => {
    try {
        const project = await db.findOne('projects', { id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        if (project.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Limit check
        const existingCount = await db.count('projects', { user_id: req.user.id });
        const plans = await getPlansConfig(db);
        const userPlan = req.user.plan || 'free';
        const planConfig = plans[userPlan] || plans.free;
        const limit = planConfig.maxProjects || 5;

        if (existingCount >= limit) {
            return res.status(403).json({
                success: false,
                message: `Project storage limit reached (${existingCount}/${limit}). Upgrade to duplicate more projects.`,
                requiresUpgrade: true
            });
        }

        const duplicated = await db.insert('projects', {
            user_id: req.user.id,
            title: `${project.title} (Copy)`,
            tool_id: project.tool_id,
            category: project.category,
            thumbnail_data: project.thumbnail_data,
            project_data: project.project_data,
            is_public: false,
            version: 1
        });

        return res.status(201).json({
            success: true,
            message: 'Project duplicated successfully!',
            project: duplicated
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to duplicate project.' });
    }
});

// DELETE PROJECT
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const project = await db.findOne('projects', { id: req.params.id });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        if (project.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        await db.delete('projects', { id: project.id });
        return res.json({ success: true, message: 'Project deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete project.' });
    }
});

// BULK DELETE PROJECTS
router.post('/bulk-delete', authenticate, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of project IDs to delete.' });
        }

        let deletedCount = 0;
        for (const id of ids) {
            const project = await db.findOne('projects', { id });
            if (project && (project.user_id === req.user.id || req.user.role === 'admin')) {
                await db.delete('projects', { id });
                deletedCount++;
            }
        }

        return res.json({
            success: true,
            message: `Successfully deleted ${deletedCount} project(s).`,
            deletedCount
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Bulk delete failed.' });
    }
});

module.exports = router;

