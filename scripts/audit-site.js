const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

console.log('Auditing pages for images, alts, links, and layout...\n');

let missingAlts = [];
let deadLinks = [];
let missingStudiosInNav = [];
let missingStudiosInFooter = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');

  // Check <img> tags for alt
  const imgMatches = content.matchAll(/<img\s+[^>]*>/g);
  for (const match of imgMatches) {
    const tag = match[0];
    if (!tag.includes('alt=') || tag.includes('alt=""')) {
      missingAlts.push({ file, tag });
    }
  }

  // Check social links & system status
  if (content.includes('href="/404.html"') && content.includes('System Status')) {
    deadLinks.push({ file, text: 'System Status pointing to /404.html' });
  }

  // Check studio links in nav dropdown
  const hasNavDropdown = content.includes('class="nav-dropdown-menu"');
  if (hasNavDropdown) {
    const hasInvitation = content.includes('cat=invitation');
    const hasText = content.includes('cat=text');
    if (!hasInvitation || !hasText) {
      missingStudiosInNav.push({ file, hasInvitation, hasText });
    }
  }

  // Check studio links in footer
  const hasFooter = content.includes('class="site-footer"');
  if (hasFooter) {
    const hasFooterInvitation = content.includes('cat=invitation');
    const hasFooterText = content.includes('cat=text');
    if (!hasFooterInvitation || !hasFooterText) {
      missingStudiosInFooter.push({ file, hasFooterInvitation, hasFooterText });
    }
  }
});

console.log('--- Missing Alt Text ---');
console.log(`Found ${missingAlts.length} images with missing/empty alt.`);
if (missingAlts.length) console.log(missingAlts);

console.log('\n--- Fake or Dead Status Links ---');
console.log(`Found ${deadLinks.length} occurrences:`);
deadLinks.forEach(d => console.log(`  - [${d.file}] ${d.text}`));

console.log('\n--- Missing Studios in Nav Dropdown ---');
console.log(`Pages with incomplete dropdown: ${missingStudiosInNav.length}`);
missingStudiosInNav.forEach(m => console.log(`  - [${m.file}] invitation:${m.hasInvitation}, text:${m.hasText}`));

console.log('\n--- Missing Studios in Footer ---');
console.log(`Pages with incomplete footer studios: ${missingStudiosInFooter.length}`);
missingStudiosInFooter.forEach(m => console.log(`  - [${m.file}] invitation:${m.hasFooterInvitation}, text:${m.hasFooterText}`));
