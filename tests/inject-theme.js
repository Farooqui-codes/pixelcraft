const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
const snippet = `<script>
  (function() {
    try {
      var saved = localStorage.getItem('pixelcraft_theme');
      var theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    } catch(e) {}
  })();
</script>`;

let modified = [];
for (const file of files) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('pixelcraft_theme')) {
    content = content.replace('<head>', '<head>\n' + snippet);
    fs.writeFileSync(filePath, content, 'utf8');
    modified.push(file);
  }
}
console.log('Injected theme script into ' + modified.length + ' files:', modified);

