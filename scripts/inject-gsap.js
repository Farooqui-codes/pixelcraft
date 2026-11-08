const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== 'offline.html');

const gsapTags = [
  '  <script src="/assets/vendor/gsap/gsap.min.js"></script>',
  '  <script src="/assets/vendor/gsap/ScrollTrigger.min.js"></script>',
  '  <script src="/assets/js/gsap-animations.js"></script>'
].join('\n');

let updated = 0;

files.forEach(file => {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already injected
  if (content.includes('gsap-animations.js')) {
    console.log(`[SKIP] ${file} already contains gsap-animations.js`);
    return;
  }

  // Insert right before <script src="/assets/js/theme.js"></script>
  const target = '<script src="/assets/js/theme.js"></script>';
  if (content.includes(target)) {
    content = content.replace(target, `${gsapTags}\n  ${target}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[UPDATED] ${file}`);
    updated++;
  } else {
    console.warn(`[WARN] ${file} does not contain theme.js script tag`);
  }
});

console.log(`\nSuccessfully injected GSAP scripts into ${updated} HTML pages.`);

