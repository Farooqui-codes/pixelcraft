const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== 'index.html');

const correctStudiosBlock = `        <!-- Studio Suites -->
        <div>
          <h4 class="footer-heading">Studio Suites</h4>
          <ul class="footer-links">
            <li><a href="/category.html?cat=image"><i class="fa-solid fa-image" style="width: 18px; color: var(--accent-image);"></i> Image Studio (5)</a></li>
            <li><a href="/category.html?cat=pdf"><i class="fa-solid fa-file-pdf" style="width: 18px; color: var(--accent-pdf);"></i> PDF Studio (5)</a></li>
            <li><a href="/category.html?cat=creator"><i class="fa-solid fa-wand-magic-sparkles" style="width: 18px; color: var(--accent-creator);"></i> Creator Studio (4)</a></li>
            <li><a href="/category.html?cat=business"><i class="fa-solid fa-briefcase" style="width: 18px; color: var(--accent-business);"></i> Business Studio (4)</a></li>
            <li><a href="/category.html?cat=qr"><i class="fa-solid fa-qrcode" style="width: 18px; color: var(--accent-qr);"></i> QR Studio (4)</a></li>
            <li><a href="/category.html?cat=invitation"><i class="fa-solid fa-envelope-open-text" style="width: 18px; color: var(--accent-invitation);"></i> Invitation Studio (3)</a></li>
            <li><a href="/category.html?cat=text"><i class="fa-solid fa-font" style="width: 18px; color: var(--accent-text);"></i> Text Studio (3)</a></li>
            <li><a href="/category.html?cat=developer"><i class="fa-solid fa-code" style="width: 18px; color: var(--accent-developer);"></i> Developer Studio (2)</a></li>
          </ul>
        </div>`;

let count = 0;
htmlFiles.forEach(file => {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace System Status fake link if exists
  if (content.includes('href="/404.html">System Status') || content.includes('href="/404.html" style="color: #10B981;"><i class="fa-solid fa-circle-check"></i> System Status')) {
    content = content.replace(/href="\/404\.html"[^>]*>(\s*<i[^>]*><\/i>\s*)?System Status<\/a>/g, 'href="/status.html" style="color: #10B981;"><i class="fa-solid fa-circle-check"></i> System Status</a>');
    modified = true;
  }

  // Replace old Studio Suites section in footer
  const suiteMatch = content.match(/<!-- Studio Suites -->[\s\S]*?<\/div>/);
  if (suiteMatch) {
    content = content.replace(suiteMatch[0], correctStudiosBlock);
    modified = true;
  }

  // Add platform-data.js script if not present
  if (!content.includes('platform-data.js') && content.includes('tools-engine.js')) {
    content = content.replace('<script src="/assets/js/tools-engine.js"></script>', '<script src="/assets/js/platform-data.js"></script>\n  <script src="/assets/js/tools-engine.js"></script>');
    modified = true;
  }

  // Replace social links if dummy
  if (content.includes('href="https://github.com"') || content.includes('href="https://twitter.com"')) {
    content = content.replace(/<a href="https:\/\/github\.com"[^>]*><i class="fa-brands fa-github"><\/i><\/a>/g, '<a href="https://github.com/Farooqui-codes/pixelcraft" target="_blank" rel="noopener noreferrer" class="btn-icon" title="GitHub Repository"><i class="fa-brands fa-github"></i></a>');
    content = content.replace(/<a href="https:\/\/twitter\.com"[^>]*><i class="fa-brands fa-x-twitter"><\/i><\/a>/g, '<a href="https://github.com/Farooqui-codes/pixelcraft/releases" target="_blank" rel="noopener noreferrer" class="btn-icon" title="Releases & Updates"><i class="fa-solid fa-code-branch"></i></a>');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`Synced footer & studio links in: ${file}`);
  }
});

console.log(`\nSuccessfully updated ${count} HTML files.`);
