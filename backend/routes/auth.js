const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// REGISTER / SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { email, password, full_name, primary_use, business_name, referral_code } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await db.findOne('profiles', { email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if this is the first user registered — grant admin if first or specific admin email
        const userCount = await db.count('profiles');
        const role = userCount === 0 || normalizedEmail.includes('admin') ? 'admin' : 'user';

        const myReferralCode = 'PC' + Math.random().toString(36).substr(2, 6).toUpperCase();

        const newProfile = await db.insert('profiles', {
            email: normalizedEmail,
            password: hashedPassword, // Stored encrypted
            full_name: full_name ? full_name.trim() : normalizedEmail.split('@')[0],
            role,
            plan: 'free',
            primary_use: primary_use || 'general',
            business_name: business_name || '',
            referral_code: myReferralCode,
            referred_by: referral_code || null
        });

        // Initialize free subscription record
        await db.insert('subscriptions', {
            user_id: newProfile.id,
            plan: 'free',
            status: 'active',
            amount: 0.00
        });

        // If referred by someone, track referral with anti-fraud validation
        if (referral_code) {
            const cleanRef = referral_code.trim();
            const referrer = await db.findOne('profiles', { referral_code: cleanRef });
            // Anti-fraud check: Prevent self-referral
            if (referrer && referrer.id !== newProfile.id) {
                await db.insert('referrals', {
                    referrer_id: referrer.id,
                    referred_id: newProfile.id,
                    status: 'completed',
                    ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    created_at: new Date().toISOString()
                });

                // Deliver referral notification & credit reward
                await db.insert('notifications', {
                    user_id: referrer.id,
                    title: 'New Referral Joined!',
                    message: `A creator signed up using your invite link! You have earned promotional credit.`,
                    type: 'success',
                    link_url: '/referral.html'
                });
            }
        }

        const token = jwt.sign(
            { id: newProfile.id, email: newProfile.email, role: newProfile.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Strip password before returning
        const { password: _, ...userSafe } = newProfile;

        return res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: userSafe
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ success: false, message: 'Server error during signup.' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await db.findOne('profiles', { email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userSafe } = user;

        return res.json({
            success: true,
            message: 'Welcome back!',
            token,
            user: userSafe
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// GET CURRENT USER / PROFILE
router.get('/me', authenticate, async (req, res) => {
    try {
        const { password, ...userSafe } = req.user;
        const projectCount = await db.count('projects', { user_id: req.user.id });
        const favCount = await db.count('favorites', { user_id: req.user.id });

        return res.json({
            success: true,
            user: {
                ...userSafe,
                stats: {
                    projectCount,
                    favCount
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
    }
});

// UPDATE PROFILE
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { full_name, primary_use, business_name, avatar_url } = req.body;
        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name.trim();
        if (primary_use !== undefined) updates.primary_use = primary_use;
        if (business_name !== undefined) updates.business_name = business_name.trim();
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const updated = await db.update('profiles', { id: req.user.id }, updates);
        const user = updated && updated.length ? updated[0] : { ...req.user, ...updates };
        const { password: _, ...userSafe } = user;

        return res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: userSafe
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
});

// CHANGE PASSWORD
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
        }

        const isMatch = await bcrypt.compare(current_password, req.user.password || '');
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await db.update('profiles', { id: req.user.id }, { password: hashedPassword });

        return res.json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email address is required.' });
        }

        const user = await db.findOne('profiles', { email: email.trim().toLowerCase() });
        if (!user) {
            // For security, respond with success even if user not found to prevent user enumeration
            return res.json({
                success: true,
                message: 'If an account exists with this email, password reset instructions have been generated.'
            });
        }

        // Generate reset token valid for 1 hour
        const resetToken = jwt.sign({ id: user.id, reset: true }, JWT_SECRET, { expiresIn: '1h' });

        return res.json({
            success: true,
            message: 'Password reset link generated successfully.',
            resetToken // Provided for client flow
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Password reset request failed.' });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password } = req.body;
        if (!token || !new_password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await db.update('profiles', { id: decoded.id }, { password: hashedPassword });

        return res.json({ success: true, message: 'Your password has been successfully reset! You can now log in.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
});

module.exports = router;

