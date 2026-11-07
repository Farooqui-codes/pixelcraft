const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'pixelcraft_jwt_super_secret_production_key_2026';

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
        }

        const user = await db.findOne('profiles', { id: decoded.id });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User account not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({ success: false, message: 'Internal authentication error.' });
    }
}

// Optional Auth (For tracking logged-in user in guest-accessible tools)
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await db.findOne('profiles', { id: decoded.id });
                if (user) req.user = user;
            } catch (err) {
                // Ignore invalid token for optional auth
            }
        }
        next();
    } catch (e) {
        next();
    }
}

// Role-based Admin check
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required.' });
    }
    next();
}

module.exports = {
    authenticate,
    optionalAuth,
    requireAdmin,
    JWT_SECRET
};

