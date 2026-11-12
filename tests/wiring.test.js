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

test('incident table rows expose semantic labels for the mobile card layout', () => {
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const rowStart = appJs.indexOf('function ticketRow(t) {');
  const rowEnd = appJs.indexOf('function renderRecentTable()', rowStart);
  assert.ok(rowStart >= 0 && rowEnd > rowStart, 'ticketRow renderer must exist');
  const rowRenderer = appJs.slice(rowStart, rowEnd);
  for (const label of ['Incident', 'Category', 'Location', 'Priority', 'Status', 'Updated', 'Actions']) {
    assert.ok(rowRenderer.includes(`data-label="${label}"`), `Missing mobile data label: ${label}`);
  }
  assert.ok(css.includes('.incident-table td[data-label]::before'), 'Mobile table cells must show their semantic labels');
  assert.ok(css.includes('@media (max-width: 600px)'), 'Mobile table layout must be breakpoint-scoped');
  assert.ok(css.includes('.incident-table {'), 'Mobile table styles must target the incident table');
});

test('app shell provides keyboard skip navigation and accessible controls', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main class="main-area" id="main-content">/);
  assert.match(html, /id="mobile-menu" class="mobile-menu"[^>]*aria-expanded="false"/);
  assert.match(html, /<button type="button" class="small-select"[^>]*aria-label="Change activity timeframe"/);
  assert.match(html, /id="triage-result" class="triage-result hidden" aria-live="polite"/);
});

test('resource navigation has matching About, FAQ, Help, Contact, Privacy and Terms views', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  for (const page of ['about', 'faq', 'help', 'contact', 'privacy', 'terms']) {
    assert.match(html, new RegExp('data-page="' + page + '"'));
    assert.match(html, new RegExp('id="page-' + page + '"'));
    assert.ok(appJs.includes("'" + page + "'"), 'setPage must allow ' + page);
  }
  assert.match(html, /<details class="panel faq-item">/);
  assert.match(html, /does not have a connected support inbox or message-submission backend/);
  assert.match(html, /do not enter real student records/i);
});

test('appearance control supports system, light and dark preferences with persistent theme state', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.match(html, /id="theme-select" aria-label="Choose appearance"/);
  for (const value of ['system', 'light', 'dark']) assert.match(html, new RegExp('<option value="' + value + '">'));
  assert.match(appJs, /campusresolve-theme-v1/);
  assert.match(appJs, /prefers-color-scheme: dark/);
  assert.match(appJs, /help-top.*setPage\('help'\)/);
  assert.match(css, /:root\[data-theme="dark"\]/);
});


test('FAQ is part of Workspace navigation and explains the real product purpose', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const workspaceMatch = html.match(/<div class="nav-label">WORKSPACE<\/div>\s*<nav class="nav-list" aria-label="Main navigation">([\s\S]*?)<\/nav>/);
  assert.ok(workspaceMatch, 'Workspace navigation must exist');
  assert.match(workspaceMatch[1], /data-page="faq"/, 'FAQ must be reachable from Workspace');
  const faqStart = html.indexOf('<section id="page-faq"');
  const faqEnd = html.indexOf('<section id="page-help"', faqStart);
  const faq = html.slice(faqStart, faqEnd);
  assert.match(faq, /Why was CampusResolve AI created\?/);
  assert.match(faq, /What does each Workspace section do\?/);
  assert.match(faq, /Why does the workspace say NMIET Campus\?/);
  assert.match(faq, /synthetic examples only/i);
  assert.ok((faq.match(/<details class="panel faq-item"/g) || []).length >= 16, 'FAQ should contain complete, answered product guidance');
});

test('dark theme uses a neutral near-black palette across primary interface surfaces', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.match(css, /--bg:#08090B/i);
  assert.match(css, /--paper:#101216/i);
  assert.match(css, /--nav:#050607/i);
  for (const selector of ['.topbar', '.sidebar', '.metric-card', '.incident-table', '.faq-item', '.modal-card', '.resource-hero']) {
    assert.ok(css.includes(selector), 'Expected dark-theme coverage for ' + selector);
  }
});
