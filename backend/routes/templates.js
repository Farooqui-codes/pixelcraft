/**
 * PixelCraft Template Marketplace Router
 * Searchable, categorizable template library across Social Media, Business,
 * Invitations, Documents, and Marketing with 1-click project copying.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getPlansConfig } = require('../config/plans');

// 1. GET ALL TEMPLATES (With filters for category, format, search, and tier)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, format, search, tier } = req.query;
        let templates = await db.find('templates');

        // Filter active only (unless admin)
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAdmin) {
            templates = templates.filter(t => t.is_active !== false);
        }

        if (category && category !== 'all') {
            templates = templates.filter(t => t.category && t.category.toLowerCase() === category.toLowerCase());
        }

        if (format && format !== 'all') {
            templates = templates.filter(t => t.format && t.format.toLowerCase().includes(format.toLowerCase()));
        }

        if (tier && tier !== 'all') {
            templates = templates.filter(t => t.tier && t.tier.toLowerCase() === tier.toLowerCase());
        }

        if (search) {
            const str = search.toLowerCase();
            templates = templates.filter(t => 
                (t.title && t.title.toLowerCase().includes(str)) ||
                (t.tool_id && t.tool_id.toLowerCase().includes(str)) ||
                (t.category && t.category.toLowerCase().includes(str)) ||
                (t.format && t.format.toLowerCase().includes(str))
            );
        }

        const userPlan = req.user ? (req.user.plan || 'free') : 'free';
        const enriched = templates.map(t => ({
            ...t,
            isLocked: t.tier === 'pro' && userPlan === 'free'
        }));

        return res.json({
            success: true,
            count: enriched.length,
            templates: enriched
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch templates: ' + err.message });
    }
});

// 2. GET SINGLE TEMPLATE
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const template = await db.findOne('templates', { id: req.params.id });
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        const userPlan = req.user ? (req.user.plan || 'free') : 'free';
        const isLocked = template.tier === 'pro' && userPlan === 'free';

        return res.json({
            success: true,
            template: {
                ...template,
                isLocked
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch template.' });
    }
});

// 3. 1-CLICK SAVE TEMPLATE TO USER'S "MY PROJECTS"
router.post('/:id/save-project', authenticate, async (req, res) => {
    try {
        const template = await db.findOne('templates', { id: req.params.id });
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        // Validate plan access if template is premium
        const userPlan = req.user.plan || 'free';
        if (template.tier === 'pro' && userPlan === 'free') {
            return res.status(403).json({
                success: false,
                requiresUpgrade: true,
                requiredPlan: 'pro',
                message: `Template "${template.title}" is a PRO design. Please upgrade to Pro to save and customize it.`
            });
        }

        // Project limit check
        const plans = await getPlansConfig(db);
        const planConfig = plans[userPlan] || plans.free;
        const currentCount = await db.count('projects', { user_id: req.user.id });

        if (currentCount >= planConfig.maxProjects) {
            return res.status(403).json({
                success: false,
                requiresUpgrade: true,
                code: 'PROJECT_LIMIT_EXCEEDED',
                requiredPlan: userPlan === 'free' ? 'pro' : 'business',
                message: `Project storage limit reached (${currentCount}/${planConfig.maxProjects}). Upgrade to save more projects.`
            });
        }

        // Create user project clone of template
        const newProject = await db.insert('projects', {
            user_id: req.user.id,
            title: `${template.title}`,
            tool_id: template.tool_id,
            category: template.category,
            thumbnail_data: template.thumbnail_url || null,
            project_data: {
                ...template.config,
                fromTemplateId: template.id
            },
            is_public: false,
            version: 1
        });

        // Track notification
        await db.insert('notifications', {
            user_id: req.user.id,
            title: 'Template Added to Projects',
            message: `"${template.title}" has been saved to your workspace.`,
            type: 'success',
            link_url: `/tool.html?id=${template.tool_id}&projectId=${newProject.id}`
        });

        return res.status(201).json({
            success: true,
            message: `Template "${template.title}" saved to your workspace!`,
            project: newProject
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to save template to projects: ' + err.message });
    }
});

module.exports = router;

