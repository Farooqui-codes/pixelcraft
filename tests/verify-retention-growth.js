process.env.PORT = '3899';
process.env.NODE_ENV = 'test';
require('../backend/server.js');

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3899;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function request(pathStr, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + pathStr);
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

async function runRetentionAndGrowthTests() {
    await delay(1200);
    console.log('================================================================');
    console.log('   PIXELCRAFT USER RETENTION & GROWTH TEST SUITE');
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
        const testRunId = Date.now();

        // -------------------------------------------------------------
        // SETUP ACCOUNTS (Admin, Pro User, Free User)
        // -------------------------------------------------------------
        console.log('--- Phase 0: Test User Registration & Authentication ---');
        
        // 1. Admin registration via @pixelcraft.io
        const adminEmail = `growth_admin_${testRunId}@pixelcraft.io`;
        const adminSignupRes = await request('/auth/signup', {
            method: 'POST',
            body: { full_name: 'Lead Admin', email: adminEmail, password: 'AdminPassword123!' }
        });
        assert(adminSignupRes.status === 201 && adminSignupRes.data.user.role === 'admin', 'Admin signup succeeds with role admin');
        const adminToken = adminSignupRes.data.token;
        const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

        // 2. Free User registration
        const freeEmail = `growth_free_${testRunId}@example.com`;
        const freeRegRes = await request('/auth/signup', {
            method: 'POST',
            body: { full_name: 'Free Growth Tester', email: freeEmail, password: 'Password123!' }
        });
        assert(freeRegRes.status === 201 && freeRegRes.data.user.plan === 'free', 'Free User registered');
        const freeToken = freeRegRes.data.token;
        const freeHeaders = { 'Authorization': `Bearer ${freeToken}` };
        const freeUser = freeRegRes.data.user;

        // 3. Pro User registration
        const proEmail = `growth_pro_${testRunId}@example.com`;
        const proRegRes = await request('/auth/signup', {
            method: 'POST',
            body: { full_name: 'Pro Growth Tester', email: proEmail, password: 'Password123!' }
        });
        assert(proRegRes.status === 201, 'Pro User registered');
        const proToken = proRegRes.data.token;
        let proHeaders = { 'Authorization': `Bearer ${proToken}` };
        const proUser = proRegRes.data.user;

        // Upgrade Pro user to Pro plan directly via admin
        const upgradeRes = await request(`/admin/users/${proUser.id}`, {
            method: 'PUT',
            headers: adminHeaders,
            body: { plan: 'pro' }
        });
        assert(upgradeRes.status === 200, 'Upgraded Pro User account to Pro plan');

        // Re-login Pro user to refresh token/state
        const proReLogin = await request('/auth/login', {
            method: 'POST',
            body: { email: proEmail, password: 'Password123!' }
        });
        const activeProToken = proReLogin.data.token;
        proHeaders = { 'Authorization': `Bearer ${activeProToken}` };

        // -------------------------------------------------------------
        // FEATURE A: TEMPLATE MARKETPLACE
        // -------------------------------------------------------------
        console.log('\n--- Phase 1: Template Marketplace ---');
        
        // List templates (all)
        const tplListRes = await request('/templates');
        assert(tplListRes.status === 200 && Array.isArray(tplListRes.data.templates) && tplListRes.data.templates.length >= 6,
            `Template Marketplace catalog returned ${tplListRes.data?.templates?.length} templates`);

        // Filter by category
        const catRes = await request('/templates?category=business');
        assert(catRes.status === 200 && catRes.data.templates.every(t => t.category === 'business'),
            'Category filtering (business) filters correctly');

        // Filter by format
        const fmtRes = await request('/templates?format=a4');
        assert(fmtRes.status === 200 && fmtRes.data.templates.length > 0 && fmtRes.data.templates.every(t => t.format && t.format.toLowerCase().includes('a4')),
            'Format filtering (a4) filters correctly');

        // Filter by tier
        const freeTplRes = await request('/templates?tier=free');
        assert(freeTplRes.status === 200 && freeTplRes.data.templates.every(t => t.tier === 'free'),
            'Tier filtering (free) filters correctly');

        // Search filter
        const searchRes = await request('/templates?search=Minimalist');
        assert(searchRes.status === 200 && searchRes.data.templates.length > 0,
            'Template search by title works');

        // Get single template details
        const sampleTpl = tplListRes.data.templates[0];
        const singleTplRes = await request(`/templates/${sampleTpl.id}`);
        assert(singleTplRes.status === 200 && singleTplRes.data.template.id === sampleTpl.id,
            'GET /api/templates/:id returns full template details');

        // Pro user saves template to projects
        const saveTplRes = await request(`/templates/${sampleTpl.id}/save-project`, {
            method: 'POST',
            headers: proHeaders,
            body: { title: 'My Custom Template Project' }
        });
        assert(saveTplRes.status === 201 && saveTplRes.data.project && (saveTplRes.data.project.template_id === sampleTpl.id || saveTplRes.data.project.project_data?.fromTemplateId === sampleTpl.id),
            '1-Click "Save Template to My Projects" creates user project',
            JSON.stringify({ status: saveTplRes.status, data: saveTplRes.data }));

        // Free user trying to clone Pro template is blocked
        const proTemplate = tplListRes.data.templates.find(t => t.tier === 'pro');
        if (proTemplate) {
            const freeBlockRes = await request(`/templates/${proTemplate.id}/save-project`, {
                method: 'POST',
                headers: freeHeaders,
                body: { title: 'Unauthorized Pro Template Clone' }
            });
            assert(freeBlockRes.status === 403, 'Free user blocked from cloning Pro template (tier-gated)');
        }

        // -------------------------------------------------------------
        // FEATURE B: MY CREATIVE WORKSPACE
        // -------------------------------------------------------------
        console.log('\n--- Phase 2: My Creative Workspace Management ---');

        // Create initial project
        const createProjRes = await request('/projects', {
            method: 'POST',
            headers: proHeaders,
            body: {
                title: 'Original Q1 Pitch Deck',
                tool_id: 'social-creator',
                category: 'social',
                project_data: { slides: 5, theme: 'dark' }
            }
        });
        assert(createProjRes.status === 201, 'Project created in user workspace');
        const projId = createProjRes.data.project.id;

        // Rename project
        const renameRes = await request(`/projects/${projId}`, {
            method: 'PUT',
            headers: proHeaders,
            body: { title: 'Renamed Q1 Pitch Deck 2026' }
        });
        assert(renameRes.status === 200 && renameRes.data.project.title === 'Renamed Q1 Pitch Deck 2026',
            'Project rename verified');

        // Duplicate project
        const dupRes = await request(`/projects/${projId}/duplicate`, {
            method: 'POST',
            headers: proHeaders
        });
        assert(dupRes.status === 201 && dupRes.data.project.title.includes('Copy'),
            'Project duplicate created with incremented title');
        const dupProjId = dupRes.data.project.id;

        // Public Share Link Toggle (is_public: true)
        const shareRes = await request(`/projects/${projId}`, {
            method: 'PUT',
            headers: proHeaders,
            body: { is_public: true }
        });
        assert(shareRes.status === 200 && shareRes.data.project.is_public === true,
            'Public project link enabled (is_public: true)');

        // Unauthenticated Guest accesses public share link
        const publicGetRes = await request(`/projects/public/${projId}`);
        assert(publicGetRes.status === 200 && publicGetRes.data.project.title === 'Renamed Q1 Pitch Deck 2026',
            'Unauthenticated guest can view public shared project');

        // Private project blocked from guest access
        const privProjRes = await request(`/projects/${dupProjId}`, {
            method: 'PUT',
            headers: proHeaders,
            body: { is_public: false }
        });
        const guestBlockRes = await request(`/projects/public/${dupProjId}`);
        assert(guestBlockRes.status === 403, 'Unshared private project returns 403 Forbidden to guests');

        // Cross-user data isolation: Free user cannot edit Pro user project
        const crossUserRes = await request(`/projects/${projId}`, {
            method: 'PUT',
            headers: freeHeaders,
            body: { title: 'Hacked Title' }
        });
        assert(crossUserRes.status === 404 || crossUserRes.status === 403,
            'Strict user data isolation enforced across projects');

        // Delete duplicated project
        const deleteProjRes = await request(`/projects/${dupProjId}`, {
            method: 'DELETE',
            headers: proHeaders
        });
        assert(deleteProjRes.status === 200, 'Project deletion verified');

        // -------------------------------------------------------------
        // FEATURE C: MULTI-TOOL WORKFLOWS
        // -------------------------------------------------------------
        console.log('\n--- Phase 3: Multi-Tool Workflows ---');

        // List workflow presets
        const wfListRes = await request('/workflows', { headers: proHeaders });
        assert(wfListRes.status === 200 && Array.isArray(wfListRes.data.workflows) && wfListRes.data.workflows.length >= 3,
            'Workflow templates & presets list returned');

        // Execute sequential 3-step pipeline (Upload -> Resize -> Compress -> Convert)
        const wfExecRes = await request('/workflows/execute', {
            method: 'POST',
            headers: proHeaders,
            body: {
                workflow_id: 'wf-web-optimize',
                input_data: {
                    file_name: 'hero-banner.png',
                    size_bytes: 4194304,
                    data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                },
                steps: [
                    { tool_id: 'image-resizer', params: { width: 1200, height: 630 } },
                    { tool_id: 'image-compressor', params: { quality: 80 } },
                    { tool_id: 'jpg-png-converter', params: { target_format: 'webp' } }
                ]
            }
        });
        assert(wfExecRes.status === 200 && wfExecRes.data.success === true,
            'Multi-Tool Workflow executed successfully');
        assert(wfExecRes.data.trace && wfExecRes.data.trace.length === 3,
            'Workflow execution trace contains all 3 sequential steps with intermediate results');

        // -------------------------------------------------------------
        // FEATURE D: BRAND KIT
        // -------------------------------------------------------------
        console.log('\n--- Phase 4: Brand Kit ---');

        // Free user checking Brand Kit permissions (Brand Kit requires Pro/Business)
        const freeBkRes = await request('/brand-kit', { headers: freeHeaders });
        assert(freeBkRes.status === 200 && freeBkRes.data.hasBrandKitAccess === false,
            'Free user Brand Kit access status verified as false');

        // Pro user saving brand kit
        const saveBkRes = await request('/brand-kit', {
            method: 'PUT',
            headers: proHeaders,
            body: {
                brand_name: 'Apex Creative Studio',
                tagline: 'Design at Scale',
                colors: { primary: '#7957FF', secondary: '#10B981', accent: '#F59E0B' },
                fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
                contact: { phone: '+91 98765 00000', email: 'team@apex.design', website: 'https://apex.design' },
                social: { instagram: '@apexdesign', linkedin: 'apex-creative' }
            }
        });
        assert(saveBkRes.status === 200, 'Pro user successfully saved Brand Kit');

        // Pro user retrieving saved brand kit
        const getBkRes = await request('/brand-kit', { headers: proHeaders });
        assert(getBkRes.status === 200 && getBkRes.data.brandKit.brand_name === 'Apex Creative Studio',
            'Brand Kit data retrieved accurately with full palette & contact links');

        // -------------------------------------------------------------
        // FEATURE E: NOTIFICATION CENTER
        // -------------------------------------------------------------
        console.log('\n--- Phase 5: In-App Notification Center ---');

        // Fetch notifications
        const notifListRes = await request('/notifications', { headers: proHeaders });
        assert(notifListRes.status === 200 && Array.isArray(notifListRes.data.notifications),
            'In-App Notification Center returned notifications list');
        
        if (notifListRes.data.notifications.length > 0) {
            const firstNotif = notifListRes.data.notifications[0];
            // Mark single notification as read
            const readRes = await request(`/notifications/${firstNotif.id}/read`, {
                method: 'PUT',
                headers: proHeaders
            });
            assert(readRes.status === 200, 'Single notification marked as read');
        }

        // Mark all as read
        const readAllRes = await request('/notifications/read-all', {
            method: 'PUT',
            headers: proHeaders
        });
        assert(readAllRes.status === 200, 'Mark all notifications as read verified');

        // Update notification preferences
        const prefRes = await request('/notifications/preferences', {
            method: 'PUT',
            headers: proHeaders,
            body: { in_app_tips: false, email_product_updates: true }
        });
        assert(prefRes.status === 200 && prefRes.data.preferences.in_app_tips === false,
            'User notification preferences updated and persisted');

        // -------------------------------------------------------------
        // FEATURE F: COMMUNITY FEEDBACK & CHANGELOG
        // -------------------------------------------------------------
        console.log('\n--- Phase 6: Community Feedback & Roadmap ---');

        // Submit new feature request
        const frSubmitRes = await request('/community/feature-requests', {
            method: 'POST',
            headers: proHeaders,
            body: {
                title: 'Add Audio Waveform Generator Tool',
                category: 'audio',
                description: 'Enable podcasters to render animated audio waveforms into MP4 social clips.'
            }
        });
        assert(frSubmitRes.status === 201, 'User submitted community feature request');
        const frId = frSubmitRes.data.request.id;

        // Upvote feature request by second user
        const upvoteRes = await request(`/community/feature-requests/${frId}/vote`, {
            method: 'POST',
            headers: freeHeaders
        });
        assert(upvoteRes.status === 200 && upvoteRes.data.hasUpvoted === true,
            'Second user upvote registered and vote counter incremented');

        // Upvote toggle (unvote)
        const unvoteRes = await request(`/community/feature-requests/${frId}/vote`, {
            method: 'POST',
            headers: freeHeaders
        });
        assert(unvoteRes.status === 200 && unvoteRes.data.hasUpvoted === false,
            'User unvote toggled back cleanly without duplicated votes');

        // View public changelog
        const clRes = await request('/community/changelog');
        assert(clRes.status === 200 && Array.isArray(clRes.data.changelog) && clRes.data.changelog.length > 0,
            'Public changelog list returned');

        // Admin publishes new release entry to changelog
        const adminClRes = await request('/community/changelog', {
            method: 'POST',
            headers: adminHeaders,
            body: {
                version: `v2.4.${Math.floor(Math.random() * 90 + 10)}`,
                title: 'Brand Kit & Community Launch',
                added: ['Template Marketplace', 'Brand Kit Integration'],
                improved: ['Batch Processing Engine'],
                fixed: ['Project count recalculation']
            }
        });
        assert(adminClRes.status === 201, 'Admin published new version notes to public changelog');

        // -------------------------------------------------------------
        // FEATURE G: ACTIVITY & USAGE HISTORY
        // -------------------------------------------------------------
        console.log('\n--- Phase 7: Activity Analytics & History ---');

        // Log tool runs to generate activity history
        await request('/tools/log-usage', {
            method: 'POST',
            headers: proHeaders,
            body: { tool_id: 'image-compressor', category: 'image' }
        });
        await request('/tools/log-usage', {
            method: 'POST',
            headers: proHeaders,
            body: { tool_id: 'invoice-generator', category: 'business' }
        });

        // Retrieve user activity stats (30-day heatmap & breakdown)
        const statsRes = await request('/tools/user/activity-stats', { headers: proHeaders });
        assert(statsRes.status === 200 && Array.isArray(statsRes.data.heatmap30Days) && statsRes.data.heatmap30Days.length === 30,
            'Activity stats returned complete 30-day chronological heatmap');
        assert(statsRes.data.totalToolRuns >= 2,
            `Activity stats recorded actual tool executions (count: ${statsRes.data.totalToolRuns})`);

        // Clear user tool history
        const clearRes = await request('/tools/history', {
            method: 'DELETE',
            headers: proHeaders
        });
        assert(clearRes.status === 200, 'User cleared tool execution history cleanly');

        // -------------------------------------------------------------
        // FEATURE H: REFERRAL SYSTEM & ANTI-FRAUD
        // -------------------------------------------------------------
        console.log('\n--- Phase 8: Growth, Referrals & Anti-Fraud ---');

        // Pro user gets unique referral link
        const refRes = await request('/subscriptions/referrals', { headers: proHeaders });
        assert(refRes.status === 200 && refRes.data.referralCode,
            `Referral code generated: ${refRes.data.referralCode}`);
        const refCode = refRes.data.referralCode;

        // Anti-Fraud Check 1: User cannot refer themselves
        const selfReferRes = await request('/auth/signup', {
            method: 'POST',
            body: {
                full_name: 'Fraud Self Ref',
                email: proEmail, // same email as referrer
                password: 'Password123!',
                referral_code: refCode
            }
        });
        assert(selfReferRes.status === 409 || selfReferRes.status === 400, 'Anti-fraud rejected self-referral using existing email');

        // Successful legitimate referral signup
        const referredEmail = `ref_friend_${testRunId}@example.com`;
        const friendRegRes = await request('/auth/signup', {
            method: 'POST',
            body: {
                full_name: 'Referred Friend',
                email: referredEmail,
                password: 'Password123!',
                referral_code: refCode
            }
        });
        assert(friendRegRes.status === 201, 'Referred friend registered with valid referral code');

        // Verify referrer received credit & referral record
        const updatedRefRes = await request('/subscriptions/referrals', { headers: proHeaders });
        assert(updatedRefRes.status === 200 && updatedRefRes.data.referralCount >= 1,
            'Referrer referral counter successfully credited');

        // -------------------------------------------------------------
        // FEATURE I: ADMIN GROWTH MANAGEMENT & BROADCAST
        // -------------------------------------------------------------
        console.log('\n--- Phase 9: Admin Growth Management & Broadcast ---');

        // Admin creates new template in marketplace
        const adminTplRes = await request('/admin/templates', {
            method: 'POST',
            headers: adminHeaders,
            body: {
                title: 'Admin Created Pitch Template',
                tool_id: 'social-creator',
                category: 'marketing',
                format: 'landscape',
                tier: 'pro',
                config: { theme: 'cyberpunk' },
                is_active: true
            }
        });
        assert(adminTplRes.status === 201, 'Admin created new template in marketplace');
        const adminTplId = adminTplRes.data.template.id;

        // Admin updates template status
        const adminTplUpdate = await request(`/admin/templates/${adminTplId}`, {
            method: 'PUT',
            headers: adminHeaders,
            body: { is_active: false }
        });
        assert(adminTplUpdate.status === 200, 'Admin toggled template active status');

        // Admin deletes test template
        const adminTplDel = await request(`/admin/templates/${adminTplId}`, {
            method: 'DELETE',
            headers: adminHeaders
        });
        assert(adminTplDel.status === 200, 'Admin deleted marketplace template');

        // Admin moderates feature request status
        const adminFrRes = await request(`/admin/feature-requests/${frId}`, {
            method: 'PUT',
            headers: adminHeaders,
            body: { status: 'planned' }
        });
        assert(adminFrRes.status === 200, 'Admin updated community feature request status to planned');

        // Admin broadcasts in-app notification to all users
        const broadcastRes = await request('/admin/notifications/broadcast', {
            method: 'POST',
            headers: adminHeaders,
            body: {
                title: '🚀 Platform Update: Template Marketplace Live!',
                message: 'Over 15+ curated templates are now ready in the Template Marketplace.',
                type: 'announcement',
                link_url: '/templates.html'
            }
        });
        assert(broadcastRes.status === 200 && broadcastRes.data.success === true,
            'Admin broadcast notification delivered to all registered users');

        // -------------------------------------------------------------
        // FEATURE J: PWA, SERVICE WORKER & LOCALIZATION ASSETS
        // -------------------------------------------------------------
        console.log('\n--- Phase 10: PWA, Service Worker & Localization Integrity ---');

        // Check manifest.json
        const manifestPath = path.join(__dirname, '../manifest.json');
        const hasManifest = fs.existsSync(manifestPath);
        assert(hasManifest, 'manifest.json exists');
        if (hasManifest) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            assert(manifest.name.includes('PixelCraft') && manifest.display === 'standalone',
                'manifest.json has correct PWA metadata and standalone display mode');
        }

        // Check sw.js
        const swPath = path.join(__dirname, '../sw.js');
        const hasSw = fs.existsSync(swPath);
        assert(hasSw, 'sw.js service worker exists');
        if (hasSw) {
            const swContent = fs.readFileSync(swPath, 'utf8');
            assert(swContent.includes('offline.html') && swContent.includes('CACHE_NAME'),
                'sw.js contains offline fallback and caching strategies');
        }

        // Check offline.html
        const offlinePath = path.join(__dirname, '../offline.html');
        assert(fs.existsSync(offlinePath), 'offline.html fallback template exists');

        // Check i18n engine
        const i18nPath = path.join(__dirname, '../assets/js/i18n.js');
        const hasI18n = fs.existsSync(i18nPath);
        assert(hasI18n, 'assets/js/i18n.js localization engine exists');
        if (hasI18n) {
            const i18nContent = fs.readFileSync(i18nPath, 'utf8');
            assert((i18nContent.includes('hi:') || i18nContent.includes('"hi"')) &&
                   (i18nContent.includes('ur:') || i18nContent.includes('"ur"')) &&
                   i18nContent.includes('rtl'),
                'i18n supports English, Hindi, and Urdu with RTL layout switching');
        }

    } catch (err) {
        console.error('Fatal test error:', err);
        failed++;
    }

    console.log('\n================================================================');
    console.log(`RETENTION & GROWTH TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runRetentionAndGrowthTests();
