const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/triage');

function fakeResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value) {
      this.body = value || '';
    },
    json() {
      return JSON.parse(this.body || '{}');
    },
  };
}

test('triage API rejects non-POST requests', async () => {
  handler.resetRateLimit();
  const req = { method: 'GET', headers: {} };
  const res = fakeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
  assert.equal(res.json().error, 'METHOD_NOT_ALLOWED');
});

test('triage API safely reports missing Gemini configuration', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const req = { method: 'POST', headers: {}, body: { description: 'Water leak', location: 'B204' } };
    const res = fakeResponse();
    await handler(req, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.json().error, 'AI_NOT_CONFIGURED');
    assert.doesNotMatch(res.body, /AIza/);
  } finally {
    if (previous !== undefined) process.env.GEMINI_API_KEY = previous;
  }
});

test('triage API validates required fields and supported categories', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  try {
    const res1 = fakeResponse();
    await handler({ method: 'POST', headers: {}, body: { description: '', location: 'B204' } }, res1);
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.json().error, 'INVALID_DESCRIPTION');

    const res2 = fakeResponse();
    await handler({ method: 'POST', headers: {}, body: { description: 'Leak', location: '' } }, res2);
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.json().error, 'INVALID_LOCATION');

    const res3 = fakeResponse();
    await handler({ method: 'POST', headers: {}, body: { description: 'Leak', location: 'B204', category: 'nuclear' } }, res3);
    assert.equal(res3.statusCode, 400);
    assert.equal(res3.json().error, 'INVALID_CATEGORY');
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('triage API rejects oversized request payloads with 413', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  try {
    const res = fakeResponse();
    const huge = 'x'.repeat(7000);
    await handler({ method: 'POST', headers: {}, body: { description: 'Leak', location: 'B204', extra: huge } }, res);
    assert.equal(res.statusCode, 413);
    assert.equal(res.json().error, 'REQUEST_TOO_LARGE');
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('triage API validates structured model output and applies deterministic safety override', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  handler._testGenerate = async () =>
    JSON.stringify({
      title: 'Exposed wiring in corridor',
      category: 'electrical',
      urgency: 'medium',
      summary: 'Report describes exposed wire near stairwell.',
      evidence: ['Exposed wire reported'],
      missingFields: ['Exact fixture number'],
      confidence: 0.84,
      requiresReview: false,
    });
  try {
    const req = {
      method: 'POST',
      headers: {},
      body: {
        description: 'Exposed wire sparking near the second-floor corridor.',
        location: 'A-Wing Corridor',
        category: 'auto',
        safetyRisk: true,
      },
    };
    const res = fakeResponse();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.source, 'gemini');
    assert.equal(body.triage.category, 'electrical');
    assert.equal(body.triage.urgency, 'critical');
    assert.equal(body.triage.requiresReview, true);
    assert.equal(body.triage.safetyOverride, true);
  } finally {
    delete handler._testGenerate;
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('triage API rejects malformed JSON or unsupported enums from model', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  try {
    handler._testGenerate = async () => 'not valid json {';
    const res1 = fakeResponse();
    await handler({ method: 'POST', headers: {}, body: { description: 'Water leak', location: 'B204' } }, res1);
    assert.equal(res1.statusCode, 502);
    assert.equal(res1.json().error, 'INVALID_MODEL_JSON');

    handler._testGenerate = async () =>
      JSON.stringify({
        title: 'Leak',
        category: 'unsupported_cat',
        urgency: 'high',
        summary: 'Summary',
        evidence: [],
        missingFields: [],
        confidence: 0.5,
        requiresReview: true,
      });
    const res2 = fakeResponse();
    await handler({ method: 'POST', headers: {}, body: { description: 'Water leak', location: 'B204' } }, res2);
    assert.equal(res2.statusCode, 502);
    assert.equal(res2.json().error, 'INVALID_MODEL_ENUM');
  } finally {
    delete handler._testGenerate;
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('triage API handles model timeout and upstream errors without leaking secrets', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'AIzaSySecretTestKey123456';
  try {
    handler._testGenerate = async () => {
      const err = new Error('Request timed out with key AIzaSySecretTestKey123456');
      err.name = 'AbortError';
      throw err;
    };
    const res = fakeResponse();
    await handler({ method: 'POST', headers: {}, body: { description: 'Water leak', location: 'B204' } }, res);
    assert.equal(res.statusCode, 504);
    assert.equal(res.json().error, 'MODEL_TIMEOUT');
    assert.doesNotMatch(res.body, /AIzaSySecretTestKey123456/);
  } finally {
    delete handler._testGenerate;
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('triage API enforces per-IP rate limiting', async () => {
  handler.resetRateLimit();
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  handler._testGenerate = async () =>
    JSON.stringify({
      title: 'Water leak',
      category: 'plumbing',
      urgency: 'high',
      summary: 'Water on floor',
      evidence: ['Wet floor'],
      missingFields: [],
      confidence: 0.7,
      requiresReview: true,
    });
  try {
    for (let i = 0; i < 8; i++) {
      const res = fakeResponse();
      await handler(
        { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.10' }, body: { description: 'Water leak', location: 'B204' } },
        res
      );
      assert.equal(res.statusCode, 200);
    }
    const blocked = fakeResponse();
    await handler(
      { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.10' }, body: { description: 'Water leak', location: 'B204' } },
      blocked
    );
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.json().error, 'RATE_LIMITED');
  } finally {
    delete handler._testGenerate;
    handler.resetRateLimit();
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});
