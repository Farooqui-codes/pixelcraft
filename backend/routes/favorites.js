const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET USER'S FAVORITES
router.get('/', authenticate, async (req, res) => {
    try {
        const favorites = await db.find('favorites', { user_id: req.user.id });
        const toolIds = favorites.map(f => f.tool_id);
        return res.json({ success: true, favorites: toolIds });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve favorites.' });
    }
});

// TOGGLE FAVORITE
router.post('/toggle', authenticate, async (req, res) => {
    try {
        const { tool_id } = req.body;
        if (!tool_id) {
            return res.status(400).json({ success: false, message: 'Tool identifier is required.' });
        }

        const existing = await db.findOne('favorites', { user_id: req.user.id, tool_id });
        let isFavorited = false;

        if (existing) {
            await db.delete('favorites', { user_id: req.user.id, tool_id });
            isFavorited = false;
        } else {
            await db.insert('favorites', { user_id: req.user.id, tool_id });
            isFavorited = true;
        }

        return res.json({
            success: true,
            isFavorited,
            tool_id,
            message: isFavorited ? 'Added to favorites.' : 'Removed from favorites.'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to toggle favorite.' });
    }
});

module.exports = router;

