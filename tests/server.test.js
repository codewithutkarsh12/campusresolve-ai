const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');
const triageHandler = require('../api/triage');

async function withServer(run) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('server serves index.html with security headers and Content-Security-Policy', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.match(res.headers.get('content-security-policy') || '', /default-src 'self'/);
    const html = await res.text();
    assert.match(html, /CampusResolve AI/);
  });
});

test('server serves approved static assets (styles.css, app.js, csv.js, favicon.svg)', async () => {
  await withServer(async (baseUrl) => {
    for (const path of ['/styles.css', '/app.js', '/csv.js', '/favicon.svg']) {
      const res = await fetch(`${baseUrl}${path}`);
      assert.equal(res.status, 200, `Expected 200 for ${path}`);
    }
  });
});

test('server blocks dotfiles, package.json and server source files', async () => {
  await withServer(async (baseUrl) => {
    for (const forbidden of ['/.env', '/.env.example', '/package.json', '/server.js', '/api/triage.js']) {
      const res = await fetch(`${baseUrl}${forbidden}`);
      assert.equal(res.status, 404, `Expected 404 for ${forbidden}`);
    }
  });
});

test('server rejects unsupported HTTP methods on static assets with 405', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/index.html`, { method: 'DELETE' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET, HEAD');
  });
});

test('server routes POST /api/triage and handles invalid JSON safely', async () => {
  triageHandler.resetRateLimit();
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await withServer(async (baseUrl) => {
      const badJson = await fetch(`${baseUrl}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid',
      });
      assert.equal(badJson.status, 400);
      const badBody = await badJson.json();
      assert.equal(badBody.error, 'INVALID_JSON');

      const fallbackRes = await fetch(`${baseUrl}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Water leaking near B204', location: 'B-Wing' }),
      });
      assert.equal(fallbackRes.status, 503);
      const fallbackBody = await fallbackRes.json();
      assert.equal(fallbackBody.error, 'AI_NOT_CONFIGURED');
    });
  } finally {
    if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
  }
});
