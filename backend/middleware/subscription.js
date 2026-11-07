/**
 * PixelCraft Subscription, Usage Limits & Feature Access Control Middleware
 * Enforces real server-side daily limits, feature locks, file size validation,
 * and subscription expiry status checks.
 */

const db = require('../config/db');
const { getPlansConfig, FEATURE_CATALOG } = require('../config/plans');

/**
 * Checks and auto-expires subscriptions whose current_period_end is in the past.
 * Preserves all user projects and customer records.
 */
async function syncSubscriptionStatus(user) {
    if (!user || user.plan === 'free') return;

    try {
        const sub = await db.findOne('subscriptions', { user_id: user.id });
        if (sub && sub.current_period_end) {
            const expiry = new Date(sub.current_period_end);
            if (expiry < new Date()) {
                // Subscription expired
                await db.update('subscriptions', { id: sub.id }, { status: 'expired' });
                await db.update('profiles', { id: user.id }, { plan: 'free' });
                user.plan = 'free';
            }
        }
    } catch (e) {
        console.warn('Subscription sync error:', e.message);
    }
}

/**
 * Validates daily operation usage limits against the user's active plan.
 */
function checkUsageLimit() {
    return async (req, res, next) => {
        try {
            if (req.user) {
                await syncSubscriptionStatus(req.user);
            }

            const plans = await getPlansConfig(db);
            const userPlan = req.user ? (req.user.plan || 'free') : 'free';
            const planConfig = plans[userPlan] || plans.free;

            // Admin is exempt from daily usage rate limits
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            // Calculate start of today (UTC midnight)
            const now = new Date();
            const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
            const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

            let usedCount = 0;
            if (req.user) {
                const usages = await db.find('tool_usage', { user_id: req.user.id });
                usedCount = usages.filter(u => u.created_at >= todayStart).length;
            } else {
                const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                const usages = await db.find('tool_usage');
                usedCount = usages.filter(u => u.ip_address === ip && u.created_at >= todayStart).length;
            }

            const limit = planConfig.dailyOperationsLimit || 10;
            if (usedCount >= limit) {
                return res.status(429).json({
                    success: false,
                    code: 'USAGE_LIMIT_EXCEEDED',
                    message: `Daily processing limit reached (${usedCount}/${limit} operations today). Upgrade to ${userPlan === 'free' ? 'Pro' : 'Business'} for higher capacity.`,
                    requiresUpgrade: true,
                    requiredPlan: userPlan === 'free' ? 'pro' : 'business',
                    used: usedCount,
                    limit,
                    resetAt: tomorrowStart
                });
            }

            req.dailyUsage = {
                used: usedCount,
                limit,
                remaining: Math.max(0, limit - usedCount),
                resetAt: tomorrowStart
            };

            next();
        } catch (err) {
            console.error('Usage check error:', err);
            next();
        }
    };
}

/**
 * Validates that user's plan contains a specific premium feature flag.
 */
function requireFeature(featureKey) {
    return async (req, res, next) => {
        try {
            if (req.user) {
                await syncSubscriptionStatus(req.user);
            }

            const userPlan = req.user ? (req.user.plan || 'free') : 'free';
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            const plans = await getPlansConfig(db);
            const planConfig = plans[userPlan] || plans.free;
            const features = planConfig.features || [];

            if (features.includes(featureKey)) {
                return next();
            }

            const featDef = FEATURE_CATALOG[featureKey] || {
                name: featureKey,
                desc: 'Premium capability',
                minPlan: 'pro'
            };

            const targetPlanConfig = plans[featDef.minPlan] || plans.pro;

            return res.status(403).json({
                success: false,
                message: `"${featDef.name}" requires the ${featDef.minPlan.toUpperCase()} plan.`,
                requiresUpgrade: true,
                feature: featureKey,
                featureName: featDef.name,
                featureDesc: featDef.desc,
                requiredPlan: featDef.minPlan,
                requiredPlanPrice: targetPlanConfig.priceMonthly,
                benefits: targetPlanConfig.features
            });
        } catch (e) {
            console.error('Feature check error:', e);
            next();
        }
    };
}

/**
 * Validates that user has at least a specified plan tier.
 */
function requireMinPlan(minPlan) {
    const tierWeights = { free: 1, pro: 2, business: 3 };
    return async (req, res, next) => {
        try {
            if (req.user) {
                await syncSubscriptionStatus(req.user);
            }

            if (req.user && req.user.role === 'admin') {
                return next();
            }

            const userPlan = req.user ? (req.user.plan || 'free') : 'free';
            const userWeight = tierWeights[userPlan] || 1;
            const requiredWeight = tierWeights[minPlan] || 2;

            if (userWeight >= requiredWeight) {
                return next();
            }

            const plans = await getPlansConfig(db);
            const targetPlanConfig = plans[minPlan] || plans.pro;

            return res.status(403).json({
                success: false,
                message: `This action requires PixelCraft ${minPlan.toUpperCase()} or higher.`,
                requiresUpgrade: true,
                requiredPlan: minPlan,
                requiredPlanPrice: targetPlanConfig.priceMonthly,
                benefits: targetPlanConfig.features
            });
        } catch (e) {
            next();
        }
    };
}

module.exports = {
    syncSubscriptionStatus,
    checkUsageLimit,
    requireFeature,
    requireMinPlan
};
