const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://pixelcraft.fmdumair07.workers.dev';
const ROOT = path.resolve(__dirname, '..');

const engineCode = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'tools-engine.js'), 'utf8');
const match = engineCode.match(/window\.PIXELCRAFT_TOOLS\s*=\s*\[([\s\S]*?)\];/);
const tools = eval('[' + match[1] + ']');

const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/tools.html', priority: '0.9', changefreq: 'daily' },
  { path: '/templates.html', priority: '0.9', changefreq: 'weekly' },
  { path: '/pricing.html', priority: '0.8', changefreq: 'weekly' },
  { path: '/community.html', priority: '0.8', changefreq: 'daily' },
  { path: '/workspace.html', priority: '0.7', changefreq: 'weekly' },
  { path: '/projects.html', priority: '0.7', changefreq: 'weekly' },
  { path: '/about.html', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact.html', priority: '0.6', changefreq: 'monthly' },
  { path: '/help.html', priority: '0.7', changefreq: 'weekly' },
  { path: '/status.html', priority: '0.7', changefreq: 'always' },
  { path: '/privacy.html', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms.html', priority: '0.5', changefreq: 'monthly' },
  { path: '/referral.html', priority: '0.6', changefreq: 'weekly' },
  { path: '/login.html', priority: '0.5', changefreq: 'monthly' },
  { path: '/signup.html', priority: '0.6', changefreq: 'monthly' }
];

const today = new Date().toISOString().split('T')[0];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// 1. Static Pages
staticPages.forEach(p => {
  xml += `  <url>
    <loc>${BASE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>\n`;
});

// 2. Studio Suites
const studioCats = ['image', 'pdf', 'creator', 'business', 'qr', 'invitation', 'text', 'developer'];
studioCats.forEach(cat => {
  xml += `  <url>
    <loc>${BASE_URL}/category.html?cat=${cat}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
});

// 3. All 30 Tools
tools.forEach(t => {
  xml += `  <url>
    <loc>${BASE_URL}/tool.html?id=${t.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
});

xml += `</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`Generated complete sitemap.xml with ${staticPages.length + studioCats.length + tools.length} URLs (including all 30 tools and 8 studios).`);
