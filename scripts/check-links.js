const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const validFiles = new Set(htmlFiles.map(f => '/' + f));
validFiles.add('/');

let broken = [];
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const regex = /href=["'](\/[^"'#? ]+)(?:[?#][^"']*)?["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let linkPath = match[1];
    if (linkPath.endsWith('.html') || linkPath === '/') {
      if (!validFiles.has(linkPath)) {
        broken.push({ file, link: match[0], path: linkPath });
      }
    }
  }
});

console.log('Total HTML files checked:', htmlFiles.length);
console.log('Broken links found:', broken.length);
if (broken.length) {
  console.log('Details:', broken);
} else {
  console.log('✅ ALL internal links resolve to valid existing HTML routes!');
}
