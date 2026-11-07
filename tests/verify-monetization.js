process.env.PORT = '3898';
process.env.NODE_ENV = 'test';
require('../backend/server.js');

const http = require('http');

const PORT = 3898;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const req = http.request(url, {
            method: options.method || 'GET',
            headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed, headers: res.headers });
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runMonetizationTests() {
    await delay(1200);
    console.log('================================================================');
    console.log('   PIXELCRAFT FREEMIUM SAAS MONETIZATION TEST SUITE');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(`  [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${testName} - ${details}`);
            failed++;
        }
    }

    try {
        // Setup: Create test user
        const userEmail = `monetize_${Date.now()}@test.com`;
        const userPassword = 'TestPassword123!';

        const regRes = await request('/auth/signup', {
            method: 'POST',
            body: { email: userEmail, password: userPassword, full_name: 'Monetization Tester' }
        });
        assert(regRes.status === 201, 'Test user registration succeeds', JSON.stringify(regRes.data));
        const userToken = regRes.data.token;
        const userHeaders = { 'Authorization': `Bearer ${userToken}` };

        // Setup: Create Admin user via @pixelcraft.io email domain
        const adminEmail = `admin_${Date.now()}@pixelcraft.io`;
        const adminSignupRes = await request('/auth/signup', {
            method: 'POST',
            body: { email: adminEmail, password: 'AdminPassword123!', full_name: 'Lead Admin' }
        });
        assert(adminSignupRes.status === 201 && adminSignupRes.data.user.role === 'admin', 'Admin signup succeeds with role admin');
        const adminToken = adminSignupRes.data.token;
        const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

        // TEST 1: Public Plans API
        console.log('\n--- 1. Plans & Pricing API ---');
        const plansRes = await request('/subscriptions/plans');
        assert(plansRes.status === 200, 'GET /subscriptions/plans returns 200');
        assert(plansRes.data.plans && plansRes.data.plans.free && plansRes.data.plans.pro && plansRes.data.plans.business, 'Contains free, pro, and business plan definitions');
        assert(plansRes.data.plans.free.priceMonthly === 0, 'Free plan price is ₹0');
        assert(plansRes.data.plans.pro.priceMonthly > 0, 'Pro plan has active monthly price');
        assert(plansRes.data.features && Object.keys(plansRes.data.features).length >= 8, 'Returns feature catalog with at least 8 capabilities');

        // TEST 2: Usage statistics for Free tier
        console.log('\n--- 2. Free Tier Usage Stats & Quota Enforcement ---');
        const usageRes = await request('/subscriptions/usage', { headers: userHeaders });
        assert(usageRes.status === 200, 'GET /subscriptions/usage returns 200');
        assert(usageRes.data.plan === 'free', 'User initial plan is free');
        const freeDailyLimit = plansRes.data.plans.free.dailyOperationsLimit;
        assert(usageRes.data.dailyOperations.limit === freeDailyLimit, 'Daily ops limit matches Free plan config');
        assert(usageRes.data.dailyOperations.remaining > 0, 'User has remaining daily quota');

        // Log usage until limit is exhausted
        console.log(`  Executing ${freeDailyLimit} tool operations to reach daily limit...`);
        for (let i = 0; i < freeDailyLimit; i++) {
            await request('/tools/log-usage', {
                method: 'POST',
                headers: userHeaders,
                body: { tool_id: 'word-counter', category: 'text' }
            });
        }

        // The (limit + 1)th call must be blocked with HTTP 429
        const blockedRes = await request('/tools/log-usage', {
            method: 'POST',
            headers: userHeaders,
            body: { tool_id: 'word-counter', category: 'text' }
        });
        assert(blockedRes.status === 429, 'Excess tool operation blocked with HTTP 429 Too Many Requests');
        assert(blockedRes.data.requiresUpgrade === true, 'Response contains requiresUpgrade: true');
        assert(blockedRes.data.code === 'USAGE_LIMIT_EXCEEDED', 'Response code is USAGE_LIMIT_EXCEEDED');

        // TEST 3: Saved Projects Limit on Free tier
        console.log('\n--- 3. Project Storage Limit Enforcement ---');
        const maxProjects = plansRes.data.plans.free.maxProjects;
        console.log(`  Creating ${maxProjects} projects (Free limit)...`);
        for (let i = 1; i <= maxProjects; i++) {
            const pRes = await request('/projects', {
                method: 'POST',
                headers: userHeaders,
                body: { title: `Test Free Project ${i}`, tool_id: 'word-counter', category: 'text', project_data: { test: i } }
            });
            assert(pRes.status === 201, `Project ${i}/${maxProjects} created successfully`);
        }

        // Creating project (maxProjects + 1) must be blocked with HTTP 403
        const blockedProjRes = await request('/projects', {
            method: 'POST',
            headers: userHeaders,
            body: { title: `Excess Project`, tool_id: 'word-counter', category: 'text', project_data: {} }
        });
        assert(blockedProjRes.status === 403, 'Excess project creation blocked with HTTP 403 Forbidden');
        assert(blockedProjRes.data.requiresUpgrade === true, 'Project block contains requiresUpgrade: true');
        assert(blockedProjRes.data.code === 'PROJECT_LIMIT_EXCEEDED', 'Response code is PROJECT_LIMIT_EXCEEDED');

        // TEST 4: Feature Access Control (Free user blocked from Pro/Business endpoints)
        console.log('\n--- 4. Feature-Level Access Control ---');
        // Vector SVG export is a Pro feature
        const svgRes = await request('/tools/process/svg-export', {
            method: 'POST',
            headers: userHeaders,
            body: { text: 'https://pixelcraft.io' }
        });
        assert(svgRes.status === 403, 'Free user blocked from Vector SVG Export with HTTP 403');
        assert(svgRes.data.requiresUpgrade === true && svgRes.data.requiredPlan === 'pro', 'Requires upgrade to Pro plan');

        // Bulk invoicing is a Business feature
        const bulkRes = await request('/tools/process/bulk-invoice', {
            method: 'POST',
            headers: userHeaders,
            body: { invoices: [{ id: 1 }, { id: 2 }] }
        });
        assert(bulkRes.status === 403, 'Free user blocked from Bulk Invoicing with HTTP 403');
        assert(bulkRes.data.requiresUpgrade === true && bulkRes.data.requiredPlan === 'business', 'Bulk invoicing requires upgrade to Business');

        // TEST 5: Coupon Discount Engine
        console.log('\n--- 5. Coupon & Promo Code Validation ---');
        const validCoupon = await request('/subscriptions/apply-coupon', {
            method: 'POST',
            headers: userHeaders,
            body: { code: 'LAUNCH50', plan: 'pro' }
        });
        assert(validCoupon.status === 200, 'Valid coupon LAUNCH50 applied successfully');
        assert(validCoupon.data.discountPercent === 50, 'LAUNCH50 gives 50% discount');
        assert(validCoupon.data.discountAmount > 0, 'Discount amount correctly calculated');
        assert(validCoupon.data.finalPrice < validCoupon.data.originalPrice, 'Final price reflects discount');

        const invalidCoupon = await request('/subscriptions/apply-coupon', {
            method: 'POST',
            headers: userHeaders,
            body: { code: 'FAKECODE99', plan: 'pro' }
        });
        assert(invalidCoupon.status === 400, 'Invalid coupon code rejected with HTTP 400');

        // TEST 6: Upgrade Account to Pro
        console.log('\n--- 6. Subscription Upgrade & Payment Processing ---');
        const upgradeRes = await request('/subscriptions/upgrade', {
            method: 'POST',
            headers: userHeaders,
            body: { plan: 'pro', couponCode: 'LAUNCH50', paymentMethod: 'card' }
        });
        assert(upgradeRes.status === 200, 'Upgrade to Pro returns 200 OK');
        assert(upgradeRes.data.subscription.plan === 'pro', 'User subscription upgraded to pro');
        assert(upgradeRes.data.subscription.status === 'active', 'Subscription is active');
        assert(upgradeRes.data.transaction && upgradeRes.data.transaction.invoice_num, 'Payment transaction created with invoice number');

        // Check user profile plan updated
        const currSubRes = await request('/subscriptions/current', { headers: userHeaders });
        assert(currSubRes.status === 200 && currSubRes.data.plan === 'pro', 'Current subscription verified as Pro');

        // TEST 7: Pro Tier Capabilities Verified
        console.log('\n--- 7. Pro Tier Capabilities & Quotas ---');
        // SVG export now succeeds
        const proSvgRes = await request('/tools/process/svg-export', {
            method: 'POST',
            headers: userHeaders,
            body: { text: 'https://pixelcraft.io', size: 300 }
        });
        if (proSvgRes.status !== 200) console.log('proSvgRes debug:', proSvgRes.status, proSvgRes.data);
        assert(proSvgRes.status === 200, 'Pro user successfully executes Vector SVG Export');
        assert(proSvgRes.data.svg && proSvgRes.data.svg.includes('<svg'), 'Returns valid SVG payload');

        // Project creation beyond Free limit now succeeds
        const proProjRes = await request('/projects', {
            method: 'POST',
            headers: userHeaders,
            body: { title: 'Pro Project 6', tool_id: 'url-qr-generator', category: 'qr', project_data: {} }
        });
        assert(proProjRes.status === 201, 'Pro user can create beyond 5 projects (Pro limit is 50)');

        // TEST 8: Upgrade to Business & Verify Team/Bulk Features
        console.log('\n--- 8. Business Tier Upgrade & Bulk Operations ---');
        const bizUpgrade = await request('/subscriptions/upgrade', {
            method: 'POST',
            headers: userHeaders,
            body: { plan: 'business', paymentMethod: 'upi' }
        });
        assert(bizUpgrade.status === 200, 'Upgrade to Business tier returns 200');
        assert(bizUpgrade.data.subscription.plan === 'business', 'Plan tier is business');

        const bizBulkRes = await request('/tools/process/bulk-invoice', {
            method: 'POST',
            headers: userHeaders,
            body: { invoices: [{ id: 101, client: 'Alpha' }, { id: 102, client: 'Beta' }] }
        });
        if (bizBulkRes.status !== 200) console.log('bizBulkRes debug:', bizBulkRes.status, bizBulkRes.data);
        assert(bizBulkRes.status === 200, 'Business user successfully executes Bulk Invoicing');
        assert(bizBulkRes.data.count === 2, 'Correct bulk count processed');

        // TEST 9: Invoices & Tax Receipts
        console.log('\n--- 9. Invoices & Tax Receipt Generation ---');
        const invoicesRes = await request('/subscriptions/invoices', { headers: userHeaders });
        assert(invoicesRes.status === 200, 'GET /subscriptions/invoices returns 200');
        assert(invoicesRes.data.invoices.length >= 2, 'Customer billing ledger contains invoices for Pro and Business');

        const orderId = invoicesRes.data.invoices[0].orderId || invoicesRes.data.invoices[0].order_id;
        const receiptRes = await request(`/subscriptions/invoices/${orderId}/receipt`, { headers: userHeaders });
        assert(receiptRes.status === 200, 'GET receipt returns 200');
        assert(receiptRes.data.receipt && receiptRes.data.receipt.seller && receiptRes.data.receipt.seller.name.includes('PixelCraft'), 'Receipt contains official company name');
        assert(parseFloat(receiptRes.data.receipt.taxAmount) > 0, 'Receipt contains GST (18%) itemization');

        // TEST 10: Admin Monetization & Plan Engine Controls
        console.log('\n--- 10. Admin Monetization Controls ---');
        const adminPlansRes = await request('/admin/plans', { headers: adminHeaders });
        assert(adminPlansRes.status === 200, 'Admin can fetch live plans configuration');

        // Update Pro price and daily limit live
        const updatedPlans = JSON.parse(JSON.stringify(adminPlansRes.data.plans));
        updatedPlans.pro.priceMonthly = 179;
        updatedPlans.pro.dailyOperationsLimit = 150;
        const updatePlanRes = await request('/admin/plans', {
            method: 'PUT',
            headers: adminHeaders,
            body: { plans: updatedPlans }
        });
        assert(updatePlanRes.status === 200, 'Admin successfully updates Pro price and daily quota');

        // Verify live plans immediately reflect update
        const verifyPlans = await request('/subscriptions/plans');
        assert(verifyPlans.data.plans.pro.priceMonthly === 179, 'Public plans immediately reflect updated price ₹179');
        assert(verifyPlans.data.plans.pro.dailyOperationsLimit === 150, 'Public plans immediately reflect updated daily ops 150');

        // Restore canonical default plan prices for other test suites
        updatedPlans.pro.priceMonthly = 149;
        updatedPlans.pro.dailyOperationsLimit = 100;
        await request('/admin/plans', {
            method: 'PUT',
            headers: adminHeaders,
            body: { plans: updatedPlans }
        });

        // Admin Subscriptions & Transactions Audit
        const adminSubs = await request('/admin/subscriptions', { headers: adminHeaders });
        assert(adminSubs.status === 200 && adminSubs.data.subscriptions.length > 0, 'Admin retrieves customer subscriptions list');

        const adminTxs = await request('/admin/transactions', { headers: adminHeaders });
        assert(adminTxs.status === 200 && adminTxs.data.transactions.length > 0, 'Admin retrieves payment audit ledger');

        // Admin Coupon Creation & Management
        const newCouponCode = `TESTPROMO_${Date.now()}`;
        const addCouponRes = await request('/admin/coupons', {
            method: 'POST',
            headers: adminHeaders,
            body: { code: newCouponCode, discountPercent: 35, validUntil: '2028-12-31', maxUses: 200, description: 'Test Promo' }
        });
        assert(addCouponRes.status === 200, 'Admin creates new promotional discount coupon');

        const testCouponRes = await request('/subscriptions/apply-coupon', {
            method: 'POST',
            headers: userHeaders,
            body: { code: newCouponCode, plan: 'pro' }
        });
        assert(testCouponRes.status === 200 && testCouponRes.data.discountPercent === 35, 'User can successfully redeem newly created admin coupon');

        const delCouponRes = await request(`/admin/coupons/${newCouponCode}`, {
            method: 'DELETE',
            headers: adminHeaders
        });
        assert(delCouponRes.status === 200, 'Admin can remove promotional coupon');

        // TEST 11: Subscription Expiry & Data Preservation
        console.log('\n--- 11. Subscription Expiry & Customer Data Preservation ---');
        // Cancellation flow
        const cancelRes = await request('/subscriptions/cancel', {
            method: 'POST',
            headers: userHeaders
        });
        assert(cancelRes.status === 200, 'Customer cancels subscription with cancel_at_period_end: true');
        assert(cancelRes.data.subscription.cancel_at_period_end === true, 'Auto-renewal set to cancel');

        // Simulate plan expiration via Admin API
        const currentSub = await request('/subscriptions/current', { headers: userHeaders });
        const subId = (currentSub.data.subscription && currentSub.data.subscription.id) || (bizUpgrade.data.subscription && bizUpgrade.data.subscription.id);
        const expireRes = await request(`/admin/subscriptions/${subId}`, {
            method: 'PUT',
            headers: adminHeaders,
            body: { status: 'expired' }
        });
        assert(expireRes.status === 200, 'Subscription expired by lifecycle manager');

        // Verify user account moved to Free tier
        const postExpiryRes = await request('/subscriptions/current', { headers: userHeaders });
        assert(postExpiryRes.data.plan === 'free', 'Expired user account moves gracefully to Free tier');

        // Critical Requirement: Verify ALL existing projects are fully preserved
        const preservedProjects = await request('/projects', { headers: userHeaders });
        assert(preservedProjects.status === 200, 'Projects list accessible after plan expiry');
        assert(preservedProjects.data.projects.length >= 6, `Customer data preserved: all ${preservedProjects.data.projects.length} saved projects intact`);

    } catch (e) {
        console.error('Test execution fatal exception:', e);
        failed++;
    }

    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runMonetizationTests();
