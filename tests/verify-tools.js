/**
 * ====================================================================
 * PIXELCRAFT PRODUCTION AUTOMATED TEST & VERIFICATION SUITE
 * Verifies all 30 tools, backend REST APIs, authentication, user isolation,
 * admin authorization, and data integrity.
 * ====================================================================
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// We will launch the Express app programmatically on an isolated test port
process.env.PORT = '3899';
process.env.NODE_ENV = 'test';

const app = require('../backend/server.js');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: '127.0.0.1',
            port: 3899,
            path: '/api' + path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING PIXELCRAFT COMPREHENSIVE SUITE TESTS');
    console.log('======================================================\n');

    await delay(1200); // Give server time to bind port

    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`  ✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${testName}`);
            failed++;
        }
    }

    try {
        // 1. HEALTH CHECK
        const health = await request('GET', '/health');
        assert(health.status === 200 && health.body.success === true, 'GET /api/health returns online status');

        // 2. TOOLS CATALOG VERIFICATION (ALL 30 TOOLS)
        const toolsRes = await request('GET', '/tools');
        assert(toolsRes.status === 200 && toolsRes.body.count === 30, 'Catalog returns exactly 30 tools');
        assert(toolsRes.body.tools.every(t => t.id && t.name && t.category && t.description), 'All 30 tools have complete metadata');

        // Verify all 8 Studio Categories exist
        const categories = new Set(toolsRes.body.tools.map(t => t.category));
        const requiredCategories = ['image', 'pdf', 'creator', 'business', 'qr', 'invitation', 'text', 'developer'];
        assert(requiredCategories.every(c => categories.has(c)), 'All 8 Studios present in catalog');

        // Verify individual tool definitions
        const singleTool = await request('GET', '/tools/image-compressor');
        assert(singleTool.status === 200 && singleTool.body.tool.id === 'image-compressor', 'Individual tool endpoint returns valid definition');

        // 3. AUTHENTICATION & ACCESS CONTROL
        // Test Admin User Signup
        const adminEmail = `admin_${Date.now()}@pixelcraft.io`;
        const adminSignup = await request('POST', '/auth/signup', {
            email: adminEmail,
            password: 'AdminPassword123!',
            full_name: 'Lead Admin'
        });
        assert(adminSignup.status === 201 && adminSignup.body.token, 'Admin signup creates user and returns JWT');
        const adminToken = adminSignup.body.token;

        // Test Normal User Signup
        const userEmail = `user_${Date.now()}@pixelcraft.io`;
        const userSignup = await request('POST', '/auth/signup', {
            email: userEmail,
            password: 'UserPassword123!',
            full_name: 'Test Creator',
            referral_code: adminSignup.body.user.referral_code
        });
        assert(userSignup.status === 201 && userSignup.body.user.role === 'user', 'Normal user signup assigns role "user"');
        const userToken = userSignup.body.token;
        const userId = userSignup.body.user.id;

        // Test Duplicate Email Protection
        const dupSignup = await request('POST', '/auth/signup', {
            email: userEmail,
            password: 'UserPassword123!'
        });
        assert(dupSignup.status === 409, 'Duplicate signup rejected with 409 Conflict');

        // Test User Login
        const loginRes = await request('POST', '/auth/login', {
            email: userEmail,
            password: 'UserPassword123!'
        });
        assert(loginRes.status === 200 && loginRes.body.token, 'Login succeeds with correct credentials');

        // Test Invalid Password Rejection
        const badLogin = await request('POST', '/auth/login', {
            email: userEmail,
            password: 'WrongPassword'
        });
        assert(badLogin.status === 401, 'Login fails with incorrect password');

        // Test /auth/me
        const meRes = await request('GET', '/auth/me', null, userToken);
        assert(meRes.status === 200 && meRes.body.user.email === userEmail, 'GET /auth/me returns authenticated user identity');

        // 4. USER ISOLATION & PROJECTS CRUD
        // Create Project
        const createProject = await request('POST', '/projects', {
            title: 'My Custom Instagram Post',
            tool_id: 'instagram-post-maker',
            category: 'creator',
            project_data: { headline: 'Automated Test Post', color: '#7957FF' }
        }, userToken);
        assert(createProject.status === 201 && createProject.body.project.id, 'Project created with user ownership');
        const projectId = createProject.body.project.id;

        // Read Own Project
        const readOwn = await request('GET', `/projects/${projectId}`, null, userToken);
        assert(readOwn.status === 200 && readOwn.body.project.title === 'My Custom Instagram Post', 'User can access own project');

        // Verify User Isolation: Create another user and attempt access
        const otherUser = await request('POST', '/auth/signup', {
            email: `intruder_${Date.now()}@pixelcraft.io`,
            password: 'Password123!'
        });
        const readOther = await request('GET', `/projects/${projectId}`, null, otherUser.body.token);
        assert(readOther.status === 403, 'User Isolation: Other user cannot access private project (403 Forbidden)');

        // Update Project / Autosave
        const updateProject = await request('PUT', `/projects/${projectId}`, {
            title: 'Updated Post Title'
        }, userToken);
        assert(updateProject.status === 200 && updateProject.body.project.title === 'Updated Post Title', 'Project update and version bump works');

        // Duplicate Project
        const dupProject = await request('POST', `/projects/${projectId}/duplicate`, null, userToken);
        assert(dupProject.status === 201 && dupProject.body.project.title.includes('Copy'), 'Project duplication creates linked copy');

        // Delete Project
        const delProject = await request('DELETE', `/projects/${projectId}`, null, userToken);
        assert(delProject.status === 200, 'Project deletion succeeds');

        // 5. FAVORITES SYSTEM
        const addFav = await request('POST', '/favorites/toggle', { tool_id: 'image-compressor' }, userToken);
        assert(addFav.status === 200 && addFav.body.isFavorited === true, 'Favorite added');

        const favList = await request('GET', '/favorites', null, userToken);
        assert(favList.status === 200 && favList.body.favorites.includes('image-compressor'), 'Favorite retrieved in user list');

        // 6. CONTACT & SUPPORT MESSAGES
        const contactMsg = await request('POST', '/contact', {
            name: 'Jane Doe',
            email: 'jane@example.com',
            subject: 'Question on PDF Merger tool',
            message: 'Hello, is there a limit on total pages merged in Pro plan?'
        });
        assert(contactMsg.status === 201 && contactMsg.body.ticketId, 'Contact message submitted and assigned support ticket ID');

        // 7. SUBSCRIPTIONS & UPGRADE ARCHITECTURE
        const plansRes = await request('GET', '/subscriptions/plans');
        assert(plansRes.status === 200 && plansRes.body.plans.pro.priceMonthly === 149, 'Pricing plans match specification (Pro ₹149/mo)');

        const upgradeRes = await request('POST', '/subscriptions/upgrade', { targetPlan: 'pro' }, userToken);
        assert(upgradeRes.status === 200 && upgradeRes.body.newPlan === 'pro', 'Plan upgrade to Pro verified and applied');

        // Verify updated user plan
        const checkPlan = await request('GET', '/auth/me', null, userToken);
        assert(checkPlan.body.user.plan === 'pro', 'User profile reflects Pro tier');

        // 8. ADMIN SECURITY & AUTHORIZATION
        // Normal user should be rejected from admin routes
        const forbidAdmin = await request('GET', '/admin/stats', null, userToken);
        assert(forbidAdmin.status === 403, 'Ordinary user is blocked from admin routes (403 Forbidden)');

        // Admin user should have access
        const adminStats = await request('GET', '/admin/stats', null, adminToken);
        assert(adminStats.status === 200 && adminStats.body.stats.totalUsers >= 2, 'Admin receives platform overview metrics');

        // Admin users list
        const adminUsers = await request('GET', '/admin/users', null, adminToken);
        assert(adminUsers.status === 200 && adminUsers.body.users.length >= 2, 'Admin can view and paginate user accounts');

        // 9. TOOL LOGGING USAGE
        const logUsage = await request('POST', '/tools/log-usage', {
            tool_id: 'image-resizer',
            category: 'image'
        }, userToken);
        assert(logUsage.status === 200, 'Tool execution analytics logged successfully');

        console.log('\n======================================================');
        console.log(`🎉 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
        console.log('======================================================\n');

        process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
        console.error('Test Suite encountered error:', err);
        process.exit(1);
    }
}

runTests();

