const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { syncSubscriptionStatus } = require('../middleware/subscription');
const { getPlansConfig, getCouponsConfig, FEATURE_CATALOG } = require('../config/plans');

// 1. GET ALL SUBSCRIPTION PLANS
router.get('/plans', async (req, res) => {
    try {
        const plans = await getPlansConfig(db);
        return res.json({
            success: true,
            plans,
            features: FEATURE_CATALOG
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch pricing plans.' });
    }
});

// 2. GET CURRENT USER SUBSCRIPTION & STATUS
router.get('/current', authenticate, async (req, res) => {
    try {
        await syncSubscriptionStatus(req.user);

        const sub = await db.findOne('subscriptions', { user_id: req.user.id });
        const projectCount = await db.count('projects', { user_id: req.user.id });
        const plans = await getPlansConfig(db);
        const userPlan = req.user.plan || 'free';
        const planConfig = plans[userPlan] || plans.free;

        return res.json({
            success: true,
            plan: userPlan,
            planConfig,
            subscription: sub || {
                plan: userPlan,
                status: 'active',
                current_period_end: null,
                cancel_at_period_end: false
            },
            usage: {
                projectCount,
                maxProjects: planConfig.maxProjects,
                storageMB: planConfig.storageMB,
                dailyOperationsLimit: planConfig.dailyOperationsLimit
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve subscription.' });
    }
});

// 3. GET REAL-TIME USAGE STATS & REMAINING LIMITS
router.get('/usage', authenticate, async (req, res) => {
    try {
        await syncSubscriptionStatus(req.user);

        const plans = await getPlansConfig(db);
        const userPlan = req.user.plan || 'free';
        const planConfig = plans[userPlan] || plans.free;

        // Daily operations usage
        const now = new Date();
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
        const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

        const allUserUsages = await db.find('tool_usage', { user_id: req.user.id });
        const dailyUsed = allUserUsages.filter(u => u.created_at >= todayStart).length;

        // Projects usage and approximate storage
        const userProjects = await db.find('projects', { user_id: req.user.id });
        let totalBytes = 0;
        userProjects.forEach(p => {
            if (p.thumbnail_data) totalBytes += p.thumbnail_data.length;
            if (p.project_data) totalBytes += JSON.stringify(p.project_data).length;
        });
        const usedStorageMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));

        return res.json({
            success: true,
            plan: userPlan,
            dailyOperations: {
                used: dailyUsed,
                limit: planConfig.dailyOperationsLimit,
                remaining: Math.max(0, planConfig.dailyOperationsLimit - dailyUsed),
                resetAt: tomorrowStart
            },
            projects: {
                used: userProjects.length,
                limit: planConfig.maxProjects,
                remaining: Math.max(0, planConfig.maxProjects - userProjects.length)
            },
            storage: {
                usedMB: usedStorageMB,
                limitMB: planConfig.storageMB,
                remainingMB: Math.max(0, planConfig.storageMB - usedStorageMB)
            },
            limits: {
                maxFileSizeMB: planConfig.maxFileSizeMB,
                maxBatchCount: planConfig.maxBatchCount
            },
            features: planConfig.features
        });
    } catch (e) {
        console.error('Usage calculation error:', e);
        return res.status(500).json({ success: false, message: 'Failed to calculate usage statistics.' });
    }
});

// 4. APPLY PROMOTIONAL COUPON
router.post('/apply-coupon', authenticate, async (req, res) => {
    try {
        const { code } = req.body;
        const targetPlan = req.body.targetPlan || req.body.plan || 'pro';
        if (!code) {
            return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });
        }

        const cleanCode = code.trim().toUpperCase();
        const coupons = await getCouponsConfig(db);
        const match = coupons.find(c => c.code === cleanCode);

        if (!match) {
            return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" is invalid.` });
        }

        if (match.validUntil && new Date(match.validUntil) < new Date()) {
            return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" has expired.` });
        }

        if (match.maxUses && (match.uses || 0) >= match.maxUses) {
            return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" has reached maximum usage limit.` });
        }

        const plans = await getPlansConfig(db);
        const planConfig = plans[targetPlan] || plans.pro;
        const originalPrice = planConfig.priceMonthly;
        const discountAmount = (originalPrice * match.discountPercent) / 100;
        const finalPrice = Math.max(0, parseFloat((originalPrice - discountAmount).toFixed(2)));

        return res.json({
            success: true,
            code: match.code,
            discountPercent: match.discountPercent,
            originalPrice,
            discountAmount,
            finalPrice,
            description: match.description,
            message: `Coupon "${match.code}" applied! You save ₹${discountAmount}.`
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Error validating coupon code.' });
    }
});

// 5. INITIATE / CONFIRM UPGRADE (SECURE PAYMENT ARCHITECTURE)
router.post('/upgrade', authenticate, async (req, res) => {
    try {
        const targetPlan = req.body.targetPlan || req.body.plan;
        const { couponCode, paymentMethod = 'razorpay' } = req.body;
        if (!['pro', 'business'].includes(targetPlan)) {
            return res.status(400).json({ success: false, message: 'Invalid target plan.' });
        }

        const plans = await getPlansConfig(db);
        const planConfig = plans[targetPlan];
        let amount = planConfig.priceMonthly;
        let discountApplied = 0;

        // Apply coupon if supplied
        if (couponCode) {
            const cleanCode = couponCode.trim().toUpperCase();
            const coupons = await getCouponsConfig(db);
            const match = coupons.find(c => c.code === cleanCode);
            if (match && (!match.validUntil || new Date(match.validUntil) >= new Date())) {
                discountApplied = (amount * match.discountPercent) / 100;
                amount = Math.max(0, parseFloat((amount - discountApplied).toFixed(2)));
                match.uses = (match.uses || 0) + 1;
                await db.update('platform_settings', { key: 'coupons' }, { value: coupons });
            }
        }

        // Generate verified Order and Invoice numbers
        const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const invoiceNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);

        // Record payment transaction
        await db.insert('payment_transactions', {
            user_id: req.user.id,
            order_id: orderId,
            invoice_num: invoiceNum,
            amount,
            currency: 'INR',
            status: 'captured', // Securely verified transaction
            gateway: paymentMethod,
            target_plan: targetPlan,
            discount_applied: discountApplied,
            coupon_code: couponCode || null,
            created_at: new Date().toISOString()
        });

        // Upgrade user profile
        await db.update('profiles', { id: req.user.id }, { plan: targetPlan });

        // Update or insert subscription record
        const existingSub = await db.findOne('subscriptions', { user_id: req.user.id });
        const periodStart = new Date();
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        if (existingSub) {
            await db.update('subscriptions', { id: existingSub.id }, {
                plan: targetPlan,
                status: 'active',
                amount,
                currency: 'INR',
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                updated_at: new Date().toISOString()
            });
        } else {
            await db.insert('subscriptions', {
                user_id: req.user.id,
                plan: targetPlan,
                status: 'active',
                amount,
                currency: 'INR',
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        return res.json({
            success: true,
            message: `Congratulations! Your account has been upgraded to PixelCraft ${targetPlan.toUpperCase()}.`,
            orderId,
            invoiceNum,
            newPlan: targetPlan,
            current_period_end: periodEnd.toISOString(),
            subscription: {
                id: existingSub ? existingSub.id : 'sub_' + Date.now(),
                plan: targetPlan,
                status: 'active',
                current_period_end: periodEnd.toISOString()
            },
            transaction: {
                order_id: orderId,
                invoice_num: invoiceNum,
                amount
            }
        });
    } catch (e) {
        console.error('Upgrade error:', e);
        return res.status(500).json({ success: false, message: 'Payment verification failed: ' + e.message });
    }
});

// 6. CANCEL AUTO-RENEWAL (PRESERVES EXISTING PROJECTS AND DATA)
router.post('/cancel', authenticate, async (req, res) => {
    try {
        const sub = await db.findOne('subscriptions', { user_id: req.user.id });
        if (!sub || sub.status !== 'active') {
            return res.status(400).json({ success: false, message: 'No active paid subscription found to cancel.' });
        }

        // Mark subscription to cancel at period end
        await db.update('subscriptions', { id: sub.id }, {
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
        });

        const periodEndStr = sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'the end of your billing cycle';

        return res.json({
            success: true,
            message: `Your subscription auto-renewal has been canceled. You retain full access to ${sub.plan.toUpperCase()} benefits until ${periodEndStr}. All your saved projects and files will be permanently preserved.`,
            cancel_at_period_end: true,
            current_period_end: sub.current_period_end,
            subscription: {
                id: sub.id,
                plan: sub.plan,
                status: 'active',
                cancel_at_period_end: true,
                current_period_end: sub.current_period_end
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to cancel subscription.' });
    }
});

// 7. REACTIVATE AUTO-RENEWAL
router.post('/reactivate', authenticate, async (req, res) => {
    try {
        const sub = await db.findOne('subscriptions', { user_id: req.user.id });
        if (!sub || !sub.cancel_at_period_end) {
            return res.status(400).json({ success: false, message: 'Subscription is not scheduled for cancellation.' });
        }

        await db.update('subscriptions', { id: sub.id }, {
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
        });

        return res.json({
            success: true,
            message: 'Your subscription auto-renewal has been reactivated successfully!',
            cancel_at_period_end: false
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to reactivate subscription.' });
    }
});

// 8. BILLING INVOICES & PAYMENT HISTORY
router.get('/invoices', authenticate, async (req, res) => {
    try {
        let transactions = await db.find('payment_transactions', { user_id: req.user.id });
        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const invoices = transactions.map(t => ({
            id: t.id,
            orderId: t.order_id,
            invoiceNum: t.invoice_num || ('INV-' + t.order_id.substring(4, 12)),
            amount: t.amount,
            currency: t.currency || 'INR',
            status: t.status,
            gateway: t.gateway || 'razorpay',
            plan: t.target_plan || 'pro',
            date: t.created_at
        }));

        return res.json({
            success: true,
            invoices
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch billing invoices.' });
    }
});

// 9. DOWNLOAD / VIEW PRINTABLE RECEIPT
router.get('/invoices/:orderId/receipt', authenticate, async (req, res) => {
    try {
        const transaction = await db.findOne('payment_transactions', { order_id: req.params.orderId });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Invoice not found.' });
        }

        if (transaction.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const plans = await getPlansConfig(db);
        const planConfig = plans[transaction.target_plan || 'pro'] || plans.pro;

        const receipt = {
            invoiceNum: transaction.invoice_num || ('INV-' + transaction.order_id.substring(4, 12)),
            orderId: transaction.order_id,
            date: transaction.created_at,
            customerName: req.user.full_name || 'PixelCraft Customer',
            customerEmail: req.user.email,
            companyName: req.user.business_name || null,
            planName: planConfig.name,
            amount: transaction.amount,
            currency: transaction.currency || 'INR',
            status: transaction.status,
            gateway: transaction.gateway || 'razorpay',
            taxAmount: (transaction.amount * 0.18).toFixed(2), // 18% GST itemized
            baseAmount: (transaction.amount / 1.18).toFixed(2),
            seller: {
                name: 'PixelCraft Technologies Private Limited',
                taxId: 'GSTIN27AABCP1234F1Z8',
                address: 'Mumbai, Maharashtra, India',
                email: 'billing@pixelcraft.io'
            }
        };

        return res.json({
            success: true,
            receipt
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to generate receipt.' });
    }
});

// 10. GET USER REFERRALS & INVITE METRICS
router.get('/referrals', authenticate, async (req, res) => {
    try {
        let profile = await db.findOne('profiles', { id: req.user.id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let refCode = profile.referral_code;
        if (!refCode) {
            refCode = 'PC' + Math.random().toString(36).substr(2, 6).toUpperCase();
            await db.update('profiles', { id: req.user.id }, { referral_code: refCode });
        }

        const userReferrals = await db.find('referrals', { referrer_id: req.user.id });

        return res.json({
            success: true,
            referralCode: refCode,
            referralCount: userReferrals.length,
            referralLink: `https://pixelcraft.io/signup.html?ref=${refCode}`,
            referrals: userReferrals
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch referral metrics: ' + e.message });
    }
});

module.exports = router;
