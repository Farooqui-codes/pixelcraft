const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields (name, email, subject, message) are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        if (message.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Message must be at least 10 characters long.' });
        }

        const supportMsg = await db.insert('support_messages', {
            user_id: req.user ? req.user.id : null,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            status: 'open'
        });

        return res.status(201).json({
            success: true,
            message: 'Thank you! Your message has been received by our support team. Ticket #' + supportMsg.id.substring(0, 8),
            ticketId: supportMsg.id
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit support request. Please try again later.' });
    }
});

module.exports = router;

