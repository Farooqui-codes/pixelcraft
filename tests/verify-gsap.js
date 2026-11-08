/**
 * ====================================================================
 * PIXELCRAFT GSAP & SCROLLTRIGGER VERIFICATION TEST SUITE
 * Validates GSAP files, animation controller methods, HTML inclusions,
 * accessibility guards, and responsive triggers.
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

console.log('\n--- 1. Testing GSAP & ScrollTrigger Vendor Assets ---');
const gsapPath = path.join(ROOT, 'assets', 'vendor', 'gsap', 'gsap.min.js');
const stPath = path.join(ROOT, 'assets', 'vendor', 'gsap', 'ScrollTrigger.min.js');
const animJsPath = path.join(ROOT, 'assets', 'js', 'gsap-animations.js');

it('assets/vendor/gsap/gsap.min.js exists and is non-empty', () => {
    assert.ok(fs.existsSync(gsapPath), 'gsap.min.js must exist');
    const stat = fs.statSync(gsapPath);
    assert.ok(stat.size > 20000, `gsap.min.js size should be > 20KB (found ${stat.size} bytes)`);
});

it('assets/vendor/gsap/ScrollTrigger.min.js exists and is non-empty', () => {
    assert.ok(fs.existsSync(stPath), 'ScrollTrigger.min.js must exist');
    const stat = fs.statSync(stPath);
    assert.ok(stat.size > 20000, `ScrollTrigger.min.js size should be > 20KB (found ${stat.size} bytes)`);
});

it('assets/js/gsap-animations.js exists and parses without syntax errors', () => {
    assert.ok(fs.existsSync(animJsPath), 'gsap-animations.js must exist');
    const content = fs.readFileSync(animJsPath, 'utf8');
    assert.doesNotThrow(() => {
        new Function(content);
    }, 'gsap-animations.js must have valid JavaScript syntax');
});

console.log('\n--- 2. Testing Animation Features & Architectures ---');
const animJsContent = fs.readFileSync(animJsPath, 'utf8');

it('Implements prefers-reduced-motion accessibility compliance', () => {
    assert.ok(animJsContent.includes('prefers-reduced-motion'), 'Must check prefers-reduced-motion');
    assert.ok(animJsContent.includes('disableAnimations'), 'Must have disableAnimations handler');
});

it('Implements responsive device detection (mobile & desktop differentiation)', () => {
    assert.ok(animJsContent.includes('isMobile'), 'Must detect mobile viewports');
    assert.ok(animJsContent.includes('innerWidth < 768'), 'Must check standard mobile breakpoint');
});

it('Implements hero timeline with professional easing', () => {
    assert.ok(animJsContent.includes('initHeroAnimation'), 'Must implement initHeroAnimation');
    assert.ok(animJsContent.includes('timeline'), 'Must use GSAP timeline');
    assert.ok(animJsContent.includes('power3.out') || animJsContent.includes('power2.out'), 'Must use professional easing');
});

it('Implements scroll-triggered section entrance animations', () => {
    assert.ok(animJsContent.includes('initSectionHeaderAnimations'), 'Must animate section headers');
    assert.ok(animJsContent.includes('scrollTrigger'), 'Must use ScrollTrigger');
});

it('Implements staggered card grids with hardware acceleration', () => {
    assert.ok(animJsContent.includes('initCardGridScrollTriggers'), 'Must animate card grids');
    assert.ok(animJsContent.includes('stagger'), 'Must stagger card entrances');
});

it('Implements button and card hover micro-interactions', () => {
    assert.ok(animJsContent.includes('initButtonMicroInteractions'), 'Must implement button interactions');
    assert.ok(animJsContent.includes('initCardHoverEffects'), 'Must implement card hover feedback');
});

it('Implements ambient floating glow orbs animation', () => {
    assert.ok(animJsContent.includes('initAmbientOrbs'), 'Must animate ambient orbs');
    assert.ok(animJsContent.includes('yoyo: true'), 'Orbs must use continuous yoyo tween');
});

it('Implements MutationObserver for dynamic content (tools/templates)', () => {
    assert.ok(animJsContent.includes('MutationObserver'), 'Must use MutationObserver');
    assert.ok(animJsContent.includes('animateNewCards'), 'Must animate dynamically added cards');
});

it('Clears transform props on complete to preserve CSS hover & layout behavior', () => {
    assert.ok(animJsContent.includes('clearProps'), 'Must clear transform properties after entrance');
});

console.log('\n--- 3. Testing GSAP Script Inclusions Across HTML Pages ---');
const targetPages = [
    'index.html', 'tools.html', 'category.html', 'tool.html', 'workspace.html',
    'projects.html', 'favorites.html', 'activity.html', 'pricing.html', 'login.html',
    'signup.html', 'forgot-password.html', 'profile.html', 'settings.html', 'about.html',
    'contact.html', 'help.html', 'referral.html', 'privacy.html', 'terms.html', '404.html',
    'templates.html', 'admin.html', 'community.html'
];

targetPages.forEach(page => {
    it(`Page "${page}" includes gsap, ScrollTrigger, and gsap-animations`, () => {
        const filePath = path.join(ROOT, page);
        assert.ok(fs.existsSync(filePath), `${page} must exist`);
        const html = fs.readFileSync(filePath, 'utf8');
        assert.ok(html.includes('gsap.min.js'), `${page} must include gsap.min.js`);
        assert.ok(html.includes('ScrollTrigger.min.js'), `${page} must include ScrollTrigger.min.js`);
        assert.ok(html.includes('gsap-animations.js'), `${page} must include gsap-animations.js`);
    });
});

console.log('\n======================================================');
console.log(`RESULTS: ${passedCount} / ${totalCount} GSAP tests passed (${Math.round(passedCount/totalCount * 100)}%)`);
console.log('======================================================\n');

if (passedCount !== totalCount) {
    process.exit(1);
}

