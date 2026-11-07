/**
 * PixelCraft Community, Feature Requests & Public Changelog Router
 * Powers customer-driven product roadmap, voting mechanisms, and release notes.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

// 1. GET ALL FEATURE REQUESTS
router.get('/feature-requests', optionalAuth, async (req, res) => {
    try {
        const { category, search, status } = req.query;
        let requests = await db.find('feature_requests');

        if (category && category !== 'all') {
            requests = requests.filter(r => r.category === category);
        }

        if (status && status !== 'all') {
            requests = requests.filter(r => r.status === status);
        }

        if (search) {
            const str = search.toLowerCase();
            requests = requests.filter(r => 
                r.title.toLowerCase().includes(str) ||
                r.description.toLowerCase().includes(str)
            );
        }

        requests.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

        // Add hasUpvoted flag for current user
        const currentUserId = req.user ? req.user.id : null;
        const enriched = requests.map(r => ({
            ...r,
            hasUpvoted: currentUserId ? (Array.isArray(r.upvoted_by) && r.upvoted_by.includes(currentUserId)) : false
        }));

        return res.json({
            success: true,
            requests: enriched
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch feature requests.' });
    }
});

// 2. SUBMIT A FEATURE REQUEST
router.post('/feature-requests', authenticate, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required.' });
        }

        if (title.length < 5 || description.length < 10) {
            return res.status(400).json({ success: false, message: 'Please provide a descriptive feature proposal.' });
        }

        const newRequest = await db.insert('feature_requests', {
            user_id: req.user.id,
            author_name: req.user.full_name || 'Community Creator',
            title: title.trim(),
            description: description.trim(),
            category: category || 'tools',
            status: 'open',
            upvotes: 1,
            upvoted_by: [req.user.id],
            created_at: new Date().toISOString()
        });

        return res.status(201).json({
            success: true,
            message: 'Feature request submitted to the community board!',
            request: newRequest
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to submit feature request.' });
    }
});

// 3. UPVOTE OR REMOVE UPVOTE ON A FEATURE REQUEST
router.post('/feature-requests/:id/vote', authenticate, async (req, res) => {
    try {
        const requestItem = await db.findOne('feature_requests', { id: req.params.id });
        if (!requestItem) {
            return res.status(404).json({ success: false, message: 'Feature request not found.' });
        }

        let upvotedBy = Array.isArray(requestItem.upvoted_by) ? [...requestItem.upvoted_by] : [];
        let upvotes = requestItem.upvotes || 0;
        let userVoted = false;

        const userIdx = upvotedBy.indexOf(req.user.id);
        if (userIdx >= 0) {
            // Remove upvote
            upvotedBy.splice(userIdx, 1);
            upvotes = Math.max(0, upvotes - 1);
            userVoted = false;
        } else {
            // Add upvote
            upvotedBy.push(req.user.id);
            upvotes += 1;
            userVoted = true;
        }

        await db.update('feature_requests', { id: requestItem.id }, {
            upvotes,
            upvoted_by: upvotedBy
        });

        return res.json({
            success: true,
            upvotes,
            hasUpvoted: userVoted,
            hasVoted: userVoted,
            message: userVoted ? 'Upvote registered!' : 'Upvote removed.'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to register vote.' });
    }
});

// 4. GET PUBLIC CHANGELOG
router.get('/changelog', async (req, res) => {
    try {
        let changelog = await db.find('changelog');
        changelog.sort((a, b) => new Date(b.release_date || b.created_at) - new Date(a.release_date || a.created_at));

        return res.json({
            success: true,
            changelog
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load changelog.' });
    }
});

// 5. ADMIN CREATE CHANGELOG RELEASE NOTE
router.post('/changelog', authenticate, requireAdmin, async (req, res) => {
    try {
        const { version, title, release_date, badge, changes } = req.body;
        if (!version || !title) {
            return res.status(400).json({ success: false, message: 'Version and title required.' });
        }

        const newRelease = await db.insert('changelog', {
            version: version.trim(),
            title: title.trim(),
            release_date: release_date || new Date().toISOString().split('T')[0],
            badge: badge || 'Release',
            changes: Array.isArray(changes) ? changes : []
        });

        return res.status(201).json({
            success: true,
            message: 'Changelog release note published!',
            release: newRelease
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to add changelog entry.' });
    }
});

module.exports = router;
