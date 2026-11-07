/**
 * ====================================================================
 * PIXELCRAFT UI/UX & INTERACTION VERIFICATION TEST SUITE
 * Validates animations, interactive patterns, responsive design,
 * accessibility compliance, theme persistence, and tool integrations.
 * ====================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
let passedCount = 0;
let totalCount = 0;

function it(desc, fn) {
    totalCount++;
    try {
        fn();
        passedCount++;
        console.log(`  [PASS] ${desc}`);
    } catch (err) {
        console.error(`  [FAIL] ${desc}\n         Error: ${err.message}`);
    }
}

console.log('\n--- 1. Testing Zero-Flash Theme Script Across All 21 HTML Pages ---');
const expectedPages = [
    'index.html', 'tools.html', 'category.html', 'tool.html', 'workspace.html',
    'projects.html', 'favorites.html', 'activity.html', 'pricing.html', 'login.html',
    'signup.html', 'forgot-password.html', 'profile.html', 'settings.html', 'about.html',
    'contact.html', 'help.html', 'referral.html', 'privacy.html', 'terms.html', '404.html'
];

expectedPages.forEach(page => {
    it(`Page "${page}" exists and includes inline theme script before render`, () => {
        const filePath = path.join(ROOT, page);
        assert.ok(fs.existsSync(filePath), `File ${page} must exist`);
        const content = fs.readFileSync(filePath, 'utf8');
        assert.ok(content.includes('pixelcraft_theme'), `Page ${page} must check pixelcraft_theme`);
        assert.ok(content.includes('data-theme'), `Page ${page} must set data-theme attribute`);
    });
});

console.log('\n--- 2. Testing Animations & Design System CSS ---');
const animCssPath = path.join(ROOT, 'assets', 'css', 'animations.css');
const animCss = fs.readFileSync(animCssPath, 'utf8');
const styleCssPath = path.join(ROOT, 'assets', 'css', 'style.css');
const styleCss = fs.readFileSync(styleCssPath, 'utf8');

it('style.css imports animations.css so all pages inherit animation rules', () => {
    assert.ok(styleCss.includes('@import url("./animations.css")') || styleCss.includes("@import url('./animations.css')"), 'style.css must import animations.css');
});

it('animations.css includes keyframe animations', () => {
    assert.ok(animCss.includes('@keyframes pcFadeUp'), 'pcFadeUp keyframes defined');
    assert.ok(animCss.includes('@keyframes pcFadeIn'), 'pcFadeIn keyframes defined');
    assert.ok(animCss.includes('@keyframes pcGlowPulse'), 'pcGlowPulse keyframes defined');
    assert.ok(animCss.includes('@keyframes pcSpin'), 'pcSpin keyframes defined');
});

it('animations.css implements scroll reveal classes with staggered delays', () => {
    assert.ok(animCss.includes('.reveal-on-scroll'), '.reveal-on-scroll defined');
    assert.ok(animCss.includes('.reveal-on-scroll.revealed'), '.reveal-on-scroll.revealed defined');
    assert.ok(animCss.includes('.reveal-delay-1'), '.reveal-delay-1 defined');
    assert.ok(animCss.includes('.reveal-delay-4'), '.reveal-delay-4 defined');
});

it('animations.css implements category accent glow hover for all 8 studios', () => {
    const studios = ['image', 'pdf', 'creator', 'business', 'qr', 'invitation', 'text', 'developer'];
    studios.forEach(s => {
        assert.ok(animCss.includes(`data-category="${s}"`), `Hover glow defined for category: ${s}`);
    });
});

it('animations.css implements button hover lift, press active state, and loading spinner', () => {
    assert.ok(animCss.includes('.btn:hover'), '.btn:hover lift defined');
    assert.ok(animCss.includes('.btn:active'), '.btn:active press effect defined');
    assert.ok(animCss.includes('.btn-loading'), '.btn-loading defined');
    assert.ok(animCss.includes('.btn-loading::after'), '.btn-loading spinner defined');
});

it('animations.css implements tap-to-top button styles (desktop & mobile offset)', () => {
    assert.ok(animCss.includes('.tap-to-top-btn'), '.tap-to-top-btn defined');
    assert.ok(animCss.includes('.tap-to-top-btn.visible'), '.tap-to-top-btn.visible defined');
    assert.ok(animCss.includes('bottom: 84px'), 'Mobile tap-to-top bottom offset for nav clearance');
});

it('animations.css implements mobile bottom navigation bar', () => {
    assert.ok(animCss.includes('.mobile-bottom-nav'), '.mobile-bottom-nav defined');
    assert.ok(animCss.includes('.mobile-nav-item'), '.mobile-nav-item defined');
    assert.ok(animCss.includes('padding-bottom: 74px'), 'Mobile body bottom padding for content clearance');
});

it('animations.css implements interactive comparison slider styles', () => {
    assert.ok(animCss.includes('.pc-comparison-slider'), '.pc-comparison-slider defined');
    assert.ok(animCss.includes('.pc-slider-handle'), '.pc-slider-handle defined');
    assert.ok(animCss.includes('.pc-comparison-overlay'), '.pc-comparison-overlay defined');
});

it('animations.css implements drag-and-drop file upload active state', () => {
    assert.ok(animCss.includes('.file-dropzone.drag-active'), '.file-dropzone.drag-active defined');
});

it('animations.css implements prefers-reduced-motion accessibility media query', () => {
    assert.ok(animCss.includes('@media (prefers-reduced-motion: reduce)'), '@media (prefers-reduced-motion: reduce) block defined');
    assert.ok(animCss.includes('animation-duration: 0.001ms'), 'Animations disabled for reduced motion');
});

console.log('\n--- 3. Testing JavaScript UX Engine & Patterns (ux-patterns.js) ---');
const uxJsPath = path.join(ROOT, 'assets', 'js', 'ux-patterns.js');
const uxJs = fs.readFileSync(uxJsPath, 'utf8');

it('ux-patterns.js implements initTapToTop with smooth scroll and visibility toggle', () => {
    assert.ok(uxJs.includes('initTapToTop'), 'initTapToTop defined');
    assert.ok(uxJs.includes('tap-to-top-btn'), 'Injects tap-to-top button');
    assert.ok(uxJs.includes('scrollTo'), 'Uses smooth window.scrollTo');
});

it('ux-patterns.js implements initScrollReveal using IntersectionObserver', () => {
    assert.ok(uxJs.includes('initScrollReveal'), 'initScrollReveal defined');
    assert.ok(uxJs.includes('IntersectionObserver'), 'Uses IntersectionObserver');
    assert.ok(uxJs.includes('.reveal-on-scroll'), 'Targets .reveal-on-scroll elements');
});

it('ux-patterns.js implements initNavbarScroll with sticky header blur', () => {
    assert.ok(uxJs.includes('initNavbarScroll'), 'initNavbarScroll defined');
    assert.ok(uxJs.includes('classList.add(\'scrolled\')'), 'Adds scrolled class on scroll');
});

it('ux-patterns.js implements initMobileBottomNav with active tab highlights', () => {
    assert.ok(uxJs.includes('initMobileBottomNav'), 'initMobileBottomNav defined');
    assert.ok(uxJs.includes('mobile-bottom-nav'), 'Injects mobile-bottom-nav HTML');
});

it('ux-patterns.js implements copyToClipboard with visual checkmark icon swap', () => {
    assert.ok(uxJs.includes('copyToClipboard'), 'copyToClipboard defined');
    assert.ok(uxJs.includes('fa-check'), 'Swaps icon to fa-check');
    assert.ok(uxJs.includes('showToast'), 'Dispatches toast notification');
});

it('ux-patterns.js implements setupDropzone with drag/drop, keyboard and size validation', () => {
    assert.ok(uxJs.includes('setupDropzone'), 'setupDropzone defined');
    assert.ok(uxJs.includes('drag-active'), 'Toggles drag-active CSS class');
    assert.ok(uxJs.includes('maxSizeMB') || uxJs.includes('maxBytes'), 'Validates max file size');
});

it('ux-patterns.js implements createComparisonSlider with touch and mouse dragging', () => {
    assert.ok(uxJs.includes('createComparisonSlider'), 'createComparisonSlider defined');
    assert.ok(uxJs.includes('touchstart'), 'Handles touch events');
    assert.ok(uxJs.includes('mousemove'), 'Handles mouse dragging');
});

it('ux-patterns.js implements createHistoryManager for undo/redo stacks', () => {
    assert.ok(uxJs.includes('createHistoryManager'), 'createHistoryManager defined');
    assert.ok(uxJs.includes('undo()'), 'Implements undo method');
    assert.ok(uxJs.includes('redo()'), 'Implements redo method');
    assert.ok(uxJs.includes('pushState'), 'Implements pushState method');
});

console.log('\n--- 4. Testing Global Search & Command Palette (command-palette.js) ---');
const cmdJsPath = path.join(ROOT, 'assets', 'js', 'command-palette.js');
const cmdJs = fs.readFileSync(cmdJsPath, 'utf8');

it('command-palette.js handles Ctrl+K and Cmd+K keyboard triggers', () => {
    assert.ok(cmdJs.includes("e.key.toLowerCase() === 'k'") || cmdJs.includes("e.key === 'k'"), 'Listens for k keydown');
    assert.ok(cmdJs.includes('e.ctrlKey || e.metaKey'), 'Checks Ctrl or Meta modifier');
});

it('command-palette.js indexes all 30 tools and studio categories', () => {
    assert.ok(cmdJs.includes('PIXELCRAFT_TOOLS'), 'Indexes PIXELCRAFT_TOOLS');
    assert.ok(cmdJs.includes('category:'), 'Stores category mappings');
});

it('command-palette.js highlights search matches with <mark>', () => {
    assert.ok(cmdJs.includes('highlightMatch'), 'highlightMatch method exists');
    assert.ok(cmdJs.includes('<mark'), 'Wraps matching substrings with <mark>');
});

it('command-palette.js supports quick actions for theme toggling and navigation', () => {
    assert.ok(cmdJs.includes('Toggle Theme'), 'Quick action for theme toggle');
});

console.log('\n--- 5. Testing Tools Engine UI Integrations (tools-engine.js) ---');
const toolsJsPath = path.join(ROOT, 'assets', 'js', 'tools-engine.js');
const toolsJs = fs.readFileSync(toolsJsPath, 'utf8');

it('Image Compressor integrates createComparisonSlider and setupDropzone', () => {
    assert.ok(toolsJs.includes('createComparisonSlider'), 'Uses createComparisonSlider in Image Compressor');
    assert.ok(toolsJs.includes('setupDropzone'), 'Uses setupDropzone for file upload');
    assert.ok(toolsJs.includes('btn-mode-split'), 'Supports split slider view mode toggle');
});

it('Instagram Post Maker integrates Undo/Redo history and Ctrl+Z keyboard shortcuts', () => {
    assert.ok(toolsJs.includes('btn-undo'), 'Has Undo button');
    assert.ok(toolsJs.includes('btn-redo'), 'Has Redo button');
    assert.ok(toolsJs.includes('createHistoryManager'), 'Integrates createHistoryManager');
    assert.ok(toolsJs.includes("e.key === 'z'"), 'Handles Ctrl+Z shortcut');
});

it('Business Card Maker integrates Undo/Redo history', () => {
    assert.ok(toolsJs.includes('btn-bc-undo'), 'Has Business Card Undo button');
    assert.ok(toolsJs.includes('btn-bc-redo'), 'Has Business Card Redo button');
});

it('Copy buttons in tools use copyToClipboard with checkmark feedback', () => {
    assert.ok(toolsJs.includes('PixelCraftUX.copyToClipboard'), 'Uses PixelCraftUX.copyToClipboard in tools');
});

console.log('\n======================================================');
console.log(`RESULTS: ${passedCount} / ${totalCount} UI/UX tests passed (${Math.round((passedCount/totalCount)*100)}%)`);
console.log('======================================================\n');

if (passedCount !== totalCount) {
    process.exit(1);
}
