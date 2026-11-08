const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'tools-engine.js'), 'utf8');

// Parse tool registry
const match = code.match(/window\.PIXELCRAFT_TOOLS\s*=\s*\[([\s\S]*?)\];/);
const tools = eval('[' + match[1] + ']');

console.log(`Auditing all ${tools.length} tools in tools-engine.js...\n`);

const results = [];

tools.forEach(tool => {
  const toolId = tool.id;
  // Find tool case
  const caseRegex = new RegExp(`case\\s+['"]${toolId}['"]:\\s*return\\s+this\\.([a-zA-Z0-9_]+)\\(`);
  const caseMatch = caseRegex.exec(code);
  const methodName = caseMatch ? caseMatch[1] : null;

  let hasMethod = false;
  let methodBody = '';
  if (methodName) {
    const methodRegex = new RegExp(`${methodName}\\s*\\([a-zA-Z0-9_,\\s]*\\)\\s*\\{`, 'g');
    const mMatch = methodRegex.exec(code);
    if (mMatch) {
      hasMethod = true;
      // Get method block approx
      methodBody = code.slice(mMatch.index, mMatch.index + 4000);
    }
  }

  const hasUpload = methodBody.includes('type="file"') || methodBody.includes('setupDropzone') || methodBody.includes('input');
  const hasDownload = methodBody.includes('download') || methodBody.includes('Download') || methodBody.includes('export') || methodBody.includes('Export');
  const hasReset = methodBody.includes('reset') || methodBody.includes('Reset') || methodBody.includes('clear') || methodBody.includes('Clear');
  const hasError = methodBody.includes('error') || methodBody.includes('Error') || methodBody.includes('showToast') || methodBody.includes('catch') || methodBody.includes('alert');
  const hasPreview = methodBody.includes('preview') || methodBody.includes('canvas') || methodBody.includes('output') || methodBody.includes('display');

  let bugs = [];
  let fixes = [];

  if (!hasReset) {
    bugs.push('Missing explicit Reset button');
    fixes.push('Add dedicated Reset/Clear button');
  }
  if (!hasError) {
    bugs.push('Basic error handling only');
    fixes.push('Add comprehensive error banner and file validation');
  }

  results.push({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    method: methodName,
    hasUpload,
    hasDownload,
    hasReset,
    hasError,
    hasPreview,
    status: bugs.length === 0 ? 'Works' : 'Needs Polish',
    bugs: bugs.join('; ') || 'None',
    fixes: fixes.join('; ') || 'Fully operational'
  });
});

console.table(results.map(r => ({
  Tool: r.name,
  Category: r.category,
  Upload: r.hasUpload ? '✅' : '-',
  Preview: r.hasPreview ? '✅' : '❌',
  Download: r.hasDownload ? '✅' : '❌',
  Reset: r.hasReset ? '✅' : '❌',
  ErrorHandling: r.hasError ? '✅' : '❌',
  Status: r.status
})));

console.log('\nDetailed Issues Summary:');
results.filter(r => r.status !== 'Works').forEach(r => {
  console.log(`- [${r.id}] ${r.name}: ${r.bugs} -> Fix: ${r.fixes}`);
});
