const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const { getPlansConfig, getCouponsConfig, FEATURE_CATALOG } = require('../config/plans');

// Protect all admin endpoints
router.use(authenticate, requireAdmin);

// ADMIN OVERVIEW METRICS
router.get('/stats', async (req, res) => {
    try {
        const users = await db.find('profiles');
        const projects = await db.find('projects');
        const toolUsages = await db.find('tool_usage');
        const supportMessages = await db.find('support_messages');
        const transactions = await db.find('payment_transactions');

        // Plan breakdown
        const plans = { free: 0, pro: 0, business: 0 };
        users.forEach(u => {
            const p = u.plan || 'free';
            if (plans[p] !== undefined) plans[p]++;
        });

        // Most popular tools
        const toolCounts = {};
        toolUsages.forEach(u => {
            toolCounts[u.tool_id] = (toolCounts[u.tool_id] || 0) + 1;
        });
        const popularTools = Object.entries(toolCounts)
            .map(([tool_id, count]) => ({ tool_id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // Revenue calculation
        const totalRevenue = transactions
            .filter(t => t.status === 'captured')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        return res.json({
            success: true,
            stats: {
                totalUsers: users.length,
                totalProjects: projects.length,
                totalToolRuns: toolUsages.length,
                openSupportTickets: supportMessages.filter(m => m.status === 'open').length,
                totalRevenue,
                planBreakdown: plans,
                popularTools
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load admin stats.' });
    }
});

// USERS MANAGEMENT
router.get('/users', async (req, res) => {
    try {
        const { search, plan, role, page = 1, limit = 15 } = req.query;
        let users = await db.find('profiles');

        if (search) {
            const s = search.toLowerCase();
            users = users.filter(u => 
                (u.email && u.email.toLowerCase().includes(s)) ||
                (u.full_name && u.full_name.toLowerCase().includes(s))
            );
        }
        if (plan && plan !== 'all') {
            users = users.filter(u => u.plan === plan);
        }
        if (role && role !== 'all') {
            users = users.filter(u => u.role === role);
        }

        const total = users.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 15;
        const paginated = users.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        // Strip passwords
        const safeUsers = paginated.map(({ password, ...u }) => u);

        return res.json({
            success: true,
            users: safeUsers,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
});

// UPDATE USER (Role or Plan)
router.put('/users/:id', async (req, res) => {
    try {
        const { role, plan } = req.body;
        const updates = {};
        if (role && ['user', 'admin'].includes(role)) updates.role = role;
        if (plan && ['free', 'pro', 'business'].includes(plan)) updates.plan = plan;

        await db.update('profiles', { id: req.params.id }, updates);
        return res.json({ success: true, message: 'User updated successfully.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
});

// DELETE USER
router.delete('/users/:id', async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
        }
        await db.delete('profiles', { id: req.params.id });
        await db.delete('projects', { user_id: req.params.id });
        await db.delete('subscriptions', { user_id: req.params.id });
        return res.json({ success: true, message: 'User and associated data deleted.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
});

// ADMIN PROJECTS LIST
router.get('/projects', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;
        let projects = await db.find('projects');

        if (category && category !== 'all') {
            projects = projects.filter(p => p.category === category);
        }
        if (search) {
            const s = search.toLowerCase();
            projects = projects.filter(p => p.title.toLowerCase().includes(s) || p.tool_id.toLowerCase().includes(s));
        }

        projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const total = projects.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const paginated = projects.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return res.json({
            success: true,
            projects: paginated,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
    }
});

// SUPPORT MESSAGES MANAGEMENT
router.get('/support', async (req, res) => {
    try {
        let messages = await db.find('support_messages');
        messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return res.json({ success: true, messages });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
    }
});

// UPDATE SUPPORT MESSAGE STATUS
router.put('/support/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }
        await db.update('support_messages', { id: req.params.id }, { status });
        return res.json({ success: true, message: 'Ticket status updated.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update ticket.' });
    }
});

// GET / UPDATE PLATFORM SETTINGS
router.get('/settings', async (req, res) => {
    try {
        const settings = await db.find('platform_settings');
        return res.json({ success: true, settings });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
});

router.put('/settings/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const existing = await db.findOne('platform_settings', { key: req.params.key });
        if (existing) {
            await db.update('platform_settings', { key: req.params.key }, { value, updated_at: new Date().toISOString() });
        } else {
            await db.insert('platform_settings', { key: req.params.key, value, updated_at: new Date().toISOString() });
        }
        return res.json({ success: true, message: `Setting "${req.params.key}" updated successfully.` });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update setting.' });
    }
});

// MONETIZATION: GET PLANS CONFIG
router.get('/plans', async (req, res) => {
    try {
        const plans = await getPlansConfig(db);
        return res.json({ success: true, plans, features: FEATURE_CATALOG });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to load plans config.' });
    }
});

// MONETIZATION: UPDATE PLANS CONFIG
router.put('/plans', async (req, res) => {
    try {
        const { plans } = req.body;
        if (!plans || !plans.free || !plans.pro || !plans.business) {
            return res.status(400).json({ success: false, message: 'Invalid plans payload. Free, Pro, and Business must be provided.' });
        }

        const existing = await db.findOne('platform_settings', { key: 'plans_config' });
        if (existing) {
            await db.update('platform_settings', { key: 'plans_config' }, { value: plans, updated_at: new Date().toISOString() });
        } else {
            await db.insert('platform_settings', { key: 'plans_config', value: plans, updated_at: new Date().toISOString() });
        }

        // Also sync legacy pricing key for backwards compatibility
        const legacyPricing = {
            free: { name: plans.free.name, priceMonthly: plans.free.priceMonthly, maxProjects: plans.free.maxProjects, features: plans.free.features },
            pro: { name: plans.pro.name, priceMonthly: plans.pro.priceMonthly, maxProjects: plans.pro.maxProjects, features: plans.pro.features },
            business: { name: plans.business.name, priceMonthly: plans.business.priceMonthly, maxProjects: plans.business.maxProjects, features: plans.business.features }
        };
        const existingLegacy = await db.findOne('platform_settings', { key: 'pricing' });
        if (existingLegacy) {
            await db.update('platform_settings', { key: 'pricing' }, { value: legacyPricing });
        } else {
            await db.insert('platform_settings', { key: 'pricing', value: legacyPricing });
        }

        return res.json({ success: true, message: 'Subscription plans and limits updated successfully!', plans });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update plans config: ' + e.message });
    }
});

// MONETIZATION: GET ALL SUBSCRIPTIONS
router.get('/subscriptions', async (req, res) => {
    try {
        const { plan, status, search, page = 1, limit = 20 } = req.query;
        let subscriptions = await db.find('subscriptions');
        const profiles = await db.find('profiles');
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        // Enrich with user email & name
        let enriched = subscriptions.map(s => {
            const u = profileMap.get(s.user_id) || {};
            return {
                ...s,
                user_email: u.email || 'unknown',
                user_name: u.full_name || 'Customer'
            };
        });

        if (plan && plan !== 'all') enriched = enriched.filter(s => s.plan === plan);
        if (status && status !== 'all') enriched = enriched.filter(s => s.status === status);
        if (search) {
            const str = search.toLowerCase();
            enriched = enriched.filter(s => s.user_email.toLowerCase().includes(str) || s.user_name.toLowerCase().includes(str));
        }

        enriched.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const total = enriched.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return res.json({
            success: true,
            subscriptions: paginated,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions.' });
    }
});

// MONETIZATION: UPDATE SUBSCRIPTION (Extend, Change Plan, or Cancel)
router.put('/subscriptions/:id', async (req, res) => {
    try {
        const { plan, status, extendDays, cancel_at_period_end } = req.body;
        const sub = await db.findOne('subscriptions', { id: req.params.id });
        if (!sub) {
            return res.status(404).json({ success: false, message: 'Subscription record not found.' });
        }

        const updates = { updated_at: new Date().toISOString() };
        if (plan && ['free', 'pro', 'business'].includes(plan)) {
            updates.plan = plan;
            await db.update('profiles', { id: sub.user_id }, { plan });
        }
        if (status && ['active', 'past_due', 'canceled', 'expired'].includes(status)) {
            updates.status = status;
            if (status === 'expired') {
                await db.update('profiles', { id: sub.user_id }, { plan: 'free' });
            }
        }
        if (typeof cancel_at_period_end === 'boolean') {
            updates.cancel_at_period_end = cancel_at_period_end;
        }
        if (extendDays && parseInt(extendDays, 10)) {
            const currentEnd = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
            currentEnd.setDate(currentEnd.getDate() + parseInt(extendDays, 10));
            updates.current_period_end = currentEnd.toISOString();
            updates.status = 'active';
        }

        await db.update('subscriptions', { id: req.params.id }, updates);
        return res.json({ success: true, message: 'Subscription updated successfully.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update subscription.' });
    }
});

// MONETIZATION: GET PAYMENT TRANSACTIONS / AUDIT
router.get('/transactions', async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        let transactions = await db.find('payment_transactions');
        const profiles = await db.find('profiles');
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        let enriched = transactions.map(t => {
            const u = profileMap.get(t.user_id) || {};
            return {
                ...t,
                user_email: u.email || 'unknown',
                user_name: u.full_name || 'Customer'
            };
        });

        if (status && status !== 'all') enriched = enriched.filter(t => t.status === status);
        if (search) {
            const str = search.toLowerCase();
            enriched = enriched.filter(t => 
                (t.order_id && t.order_id.toLowerCase().includes(str)) ||
                (t.invoice_num && t.invoice_num.toLowerCase().includes(str)) ||
                t.user_email.toLowerCase().includes(str)
            );
        }

        enriched.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const total = enriched.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return res.json({
            success: true,
            transactions: paginated,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
    }
});

// MONETIZATION: COUPONS & DISCOUNTS MANAGEMENT
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await getCouponsConfig(db);
        return res.json({ success: true, coupons });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
    }
});

router.post('/coupons', async (req, res) => {
    try {
        const { code, discountPercent, validUntil, maxUses, description } = req.body;
        if (!code || !discountPercent) {
            return res.status(400).json({ success: false, message: 'Code and discount percentage are required.' });
        }

        const cleanCode = code.trim().toUpperCase();
        let coupons = await getCouponsConfig(db);
        const existingIdx = coupons.findIndex(c => c.code === cleanCode);

        const newCoupon = {
            code: cleanCode,
            discountPercent: Math.min(100, Math.max(1, parseInt(discountPercent, 10))),
            validUntil: validUntil || '2028-12-31',
            maxUses: parseInt(maxUses, 10) || 1000,
            uses: existingIdx >= 0 ? coupons[existingIdx].uses || 0 : 0,
            description: description || `${discountPercent}% promotional discount`
        };

        if (existingIdx >= 0) {
            coupons[existingIdx] = newCoupon;
        } else {
            coupons.push(newCoupon);
        }

        const existingSetting = await db.findOne('platform_settings', { key: 'coupons' });
        if (existingSetting) {
            await db.update('platform_settings', { key: 'coupons' }, { value: coupons });
        } else {
            await db.insert('platform_settings', { key: 'coupons', value: coupons });
        }

        return res.json({ success: true, message: `Coupon "${cleanCode}" saved successfully!`, coupon: newCoupon });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to save coupon.' });
    }
});

router.delete('/coupons/:code', async (req, res) => {
    try {
        const targetCode = req.params.code.toUpperCase();
        let coupons = await getCouponsConfig(db);
        coupons = coupons.filter(c => c.code !== targetCode);

        await db.update('platform_settings', { key: 'coupons' }, { value: coupons });
        return res.json({ success: true, message: `Coupon "${targetCode}" deleted.` });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
    }
});

// GET REAL USAGE AUDIT LOGS
router.get('/usage-logs', async (req, res) => {
    try {
        const { tool_id, page = 1, limit = 25 } = req.query;
        let usages = await db.find('tool_usage');
        if (tool_id && tool_id !== 'all') {
            usages = usages.filter(u => u.tool_id === tool_id);
        }
        usages.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const total = usages.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 25;
        const paginated = usages.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return res.json({
            success: true,
            logs: paginated,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch usage logs.' });
    }
});

// ADMIN TEMPLATES MANAGEMENT
router.post('/templates', async (req, res) => {
    try {
        const { title, tool_id, category, format, tier = 'free', config = {}, thumbnail_url } = req.body;
        if (!title || !tool_id || !category) {
            return res.status(400).json({ success: false, message: 'Title, tool_id, and category are required.' });
        }

        const newTemplate = await db.insert('templates', {
            title: title.trim(),
            tool_id: tool_id.trim(),
            category: category.toLowerCase().trim(),
            format: format || 'Standard',
            tier: tier.toLowerCase() === 'pro' ? 'pro' : 'free',
            config,
            thumbnail_url: thumbnail_url || null,
            is_active: true
        });

        return res.status(201).json({ success: true, message: 'Template published successfully!', template: newTemplate });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to create template: ' + e.message });
    }
});

router.put('/templates/:id', async (req, res) => {
    try {
        const tpl = await db.findOne('templates', { id: req.params.id });
        if (!tpl) return res.status(404).json({ success: false, message: 'Template not found.' });

        const updates = {};
        ['title', 'tool_id', 'category', 'format', 'tier', 'config', 'thumbnail_url', 'is_active'].forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        await db.update('templates', { id: req.params.id }, updates);
        return res.json({ success: true, message: 'Template updated successfully.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update template.' });
    }
});

router.delete('/templates/:id', async (req, res) => {
    try {
        await db.delete('templates', { id: req.params.id });
        return res.json({ success: true, message: 'Template deleted.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to delete template.' });
    }
});

// ADMIN FEATURE REQUEST MODERATION
router.put('/feature-requests/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['open', 'under_review', 'planned', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }
        await db.update('feature_requests', { id: req.params.id }, { status });
        return res.json({ success: true, message: `Feature request status updated to ${status}.` });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update request.' });
    }
});

router.delete('/feature-requests/:id', async (req, res) => {
    try {
        await db.delete('feature_requests', { id: req.params.id });
        return res.json({ success: true, message: 'Feature request removed.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to delete request.' });
    }
});

// ADMIN BROADCAST IN-APP NOTIFICATION
router.post('/notifications/broadcast', async (req, res) => {
    try {
        const { title, message, type = 'info', link_url, target_user_id } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required.' });
        }

        if (target_user_id) {
            await db.insert('notifications', {
                user_id: target_user_id,
                title,
                message,
                type,
                link_url: link_url || null,
                is_read: false
            });
            return res.json({ success: true, message: 'Direct notification delivered!' });
        } else {
            // Broadcast to all users
            const profiles = await db.find('profiles');
            for (const p of profiles) {
                await db.insert('notifications', {
                    user_id: p.id,
                    title,
                    message,
                    type,
                    link_url: link_url || null,
                    is_read: false
                });
            }
            return res.json({ success: true, message: `Broadcast delivered to ${profiles.length} users!` });
        }
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Broadcast delivery failed: ' + e.message });
    }
});

module.exports = router;

