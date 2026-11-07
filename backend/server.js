const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { router: toolsRoutes } = require('./routes/tools');
const projectsRoutes = require('./routes/projects');
const favoritesRoutes = require('./routes/favorites');
const contactRoutes = require('./routes/contact');
const subscriptionsRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const templatesRoutes = require('./routes/templates');
const brandkitRoutes = require('./routes/brandkit');
const notificationsRoutes = require('./routes/notifications');
const communityRoutes = require('./routes/community');
const workflowsRoutes = require('./routes/workflows');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate Limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'PixelCraft Production Server Online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/brand-kit', brandkitRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/workflows', workflowsRoutes);

// Serve Frontend Static Files
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// SPA / Dedicated fallback for tools or HTML pages
app.get('/tool/:toolId', (req, res) => {
    res.sendFile(path.join(rootDir, 'tool.html'));
});

app.get('/category/:categoryId', (req, res) => {
    res.sendFile(path.join(rootDir, 'category.html'));
});

// 404 for unknown API endpoints
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Requested API endpoint does not exist.' });
});

// Custom 404 Page for web routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(rootDir, '404.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'An unexpected internal server error occurred.'
    });
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 PixelCraft Full-Stack SaaS running on http://localhost:${PORT}`);
    console.log(`✨ Brand: PixelCraft — Create. Convert. Design. Simplify.`);
    console.log(`====================================================`);
});
