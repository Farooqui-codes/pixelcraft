/**
 * PixelCraft In-App Notification Center Router
 * Real-time event alerts for project saves, processing completions,
 * quota threshold warnings, and account announcements.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// 1. GET ALL USER NOTIFICATIONS
router.get('/', authenticate, async (req, res) => {
    try {
        let notifications = await db.find('notifications', { user_id: req.user.id });
        notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const unreadCount = notifications.filter(n => !n.is_read).length;

        return res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
    }
});

// 2. MARK NOTIFICATION AS READ
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const notif = await db.findOne('notifications', { id: req.params.id });
        if (!notif) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        if (notif.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        await db.update('notifications', { id: notif.id }, { is_read: true });
        return res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update notification.' });
    }
});

// 3. MARK ALL NOTIFICATIONS AS READ
router.put('/read-all', authenticate, async (req, res) => {
    try {
        const notifs = await db.find('notifications', { user_id: req.user.id });
        for (const n of notifs) {
            if (!n.is_read) {
                await db.update('notifications', { id: n.id }, { is_read: true });
            }
        }
        return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
    }
});

// 4. GET NOTIFICATION PREFERENCES
router.get('/preferences', authenticate, async (req, res) => {
    try {
        const prefSetting = await db.findOne('platform_settings', { key: `notif_pref_${req.user.id}` });
        const preferences = prefSetting ? prefSetting.value : {
            emailAlerts: true,
            inAppToasts: true,
            quotaWarnings: true,
            marketingUpdates: false
        };

        return res.json({ success: true, preferences });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch preferences.' });
    }
});

// 5. UPDATE NOTIFICATION PREFERENCES
router.put('/preferences', authenticate, async (req, res) => {
    try {
        const preferences = req.body.preferences || req.body;
        if (!preferences || Object.keys(preferences).length === 0) {
            return res.status(400).json({ success: false, message: 'Preferences payload required.' });
        }

        const key = `notif_pref_${req.user.id}`;
        const existing = await db.findOne('platform_settings', { key });
        if (existing) {
            await db.update('platform_settings', { key }, { value: preferences });
        } else {
            await db.insert('platform_settings', { key, value: preferences });
        }

        return res.json({ success: true, message: 'Notification preferences updated!', preferences });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to save preferences.' });
    }
});

module.exports = router;
