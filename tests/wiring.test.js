const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

test('index.html loads csv.js before app.js and includes safety-risk controls', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const csvIdx = html.indexOf('<script src="./csv.js" defer></script>');
  const appIdx = html.indexOf('<script src="./app.js" defer></script>');
  assert.ok(csvIdx !== -1, 'index.html must reference ./csv.js');
  assert.ok(appIdx !== -1, 'index.html must reference ./app.js');
  assert.ok(csvIdx < appIdx, 'csv.js must be loaded before app.js');
  assert.match(html, /id="triage-safety-risk"/);
  assert.match(html, /id="report-safety-risk"/);
  assert.match(html, /<option value="reopened">Reopened<\/option>/);
});

test('all static DOM IDs referenced by app.js exist in index.html or dynamic templates', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const dynamicIds = new Set([
    'create-ticket-from-triage',
    'triage-retry',
    'verification-note',
    'resolution-note-input',
    'reopen-reason',
  ]);
  const matches = [...appJs.matchAll(/\$\('([a-z0-9-]+)'\)/g)].map((m) => m[1]);
  assert.ok(matches.length > 20);
  for (const id of matches) {
    if (dynamicIds.has(id)) continue;
    assert.match(html, new RegExp(`id="${id}"`), `Missing id="${id}" in index.html`);
  }
});

test('vercel.json defines triage function maxDuration and Content-Security-Policy header', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(vercel.functions['api/triage.js'].maxDuration, 15);
  const rootHeaders = vercel.headers.find((h) => h.source === '/(.*)');
  assert.ok(rootHeaders, 'Expected catch-all security headers in vercel.json');
  const csp = rootHeaders.headers.find((h) => h.key === 'Content-Security-Policy');
  assert.ok(csp && csp.value.includes("default-src 'self'"));
});

test('client-side files contain no hardcoded API keys or secret tokens and client-bundle matches app.js', () => {
  for (const file of ['index.html', 'styles.css', 'app.js', 'csv.js']) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(content, /AIza[0-9A-Za-z_-]{20,}/);
    assert.doesNotMatch(content, /GEMINI_API_KEY\s*=\s*['"][^'"]+['"]/);
  }
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const clientBundle = require('../lib/client-bundle');
  assert.equal(clientBundle, appJs, 'lib/client-bundle.js must match app.js byte-for-byte');
});

