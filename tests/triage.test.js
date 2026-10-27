const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CATEGORIES,
  PRIORITIES,
  normalizeCategory,
  normalizePriority,
  applySafetyOverride,
  validateTriage,
  validateStoredTickets,
  validateStoredAudit,
} = require('../lib/triage');

test('only approved categories survive normalization', () => {
  assert.deepEqual(CATEGORIES, ['plumbing', 'electrical', 'sanitation', 'connectivity', 'equipment', 'other']);
  assert.equal(normalizeCategory('plumbing'), 'plumbing');
  assert.equal(normalizeCategory('shell'), 'other');
  assert.equal(normalizeCategory(null), 'other');
});

test('only approved priority values survive normalization', () => {
  assert.equal(normalizePriority('critical'), 'critical');
  assert.equal(normalizePriority('urgent-now'), 'medium');
  assert.ok(PRIORITIES.includes(normalizePriority(undefined)));
});

test('triage output is bounded, typed and defaults to human review', () => {
  const result = validateTriage({
    title: '  Leak  ',
    category: 'plumbing',
    urgency: 'high',
    summary: 'Water near the entrance',
    evidence: ['The report mentions water'],
    missingFields: ['Exact room'],
    confidence: 1.4,
  });
  assert.equal(result.title, 'Leak');
  assert.equal(result.category, 'plumbing');
  assert.equal(result.urgency, 'high');
  assert.equal(result.confidence, 1);
  assert.equal(result.requiresReview, true);
  assert.deepEqual(result.missingFields, ['Exact room']);
});

test('invalid object shapes are rejected', () => {
  assert.throws(() => validateTriage(null), TypeError);
  assert.throws(() => validateTriage([]), TypeError);
});

test('deterministic safety override elevates urgency on hazard keywords', () => {
  const base = {
    title: 'Corridor socket issue',
    category: 'electrical',
    urgency: 'low',
    summary: 'Socket damaged in corridor',
    evidence: ['Socket cover loose'],
    missingFields: [],
    confidence: 0.8,
    requiresReview: false,
  };
  const overridden = applySafetyOverride(base, {
    description: 'There is an exposed wire and sparking near the corridor socket.',
    safetyRisk: false,
  });
  assert.equal(overridden.urgency, 'critical');
  assert.equal(overridden.requiresReview, true);
  assert.equal(overridden.safetyOverride, true);
});

test('deterministic safety override elevates urgency when user flags safetyRisk', () => {
  const base = {
    title: 'Ceiling panel loose',
    category: 'other',
    urgency: 'medium',
    summary: 'Panel hanging above walkway',
    evidence: ['Panel shifted'],
    missingFields: [],
    confidence: 0.75,
    requiresReview: false,
  };
  const overridden = applySafetyOverride(base, {
    description: 'Ceiling panel looks unstable above the entrance.',
    safetyRisk: true,
  });
  assert.equal(overridden.urgency, 'critical');
  assert.equal(overridden.requiresReview, true);
  assert.equal(overridden.safetyOverride, true);
});

test('stored state validators sanitize malformed records and fall back safely', () => {
  const fallbackTickets = [{ id: 'CR-1', title: 'Seed', description: 'Desc', location: 'Loc', category: 'other', priority: 'low', status: 'open' }];
  assert.deepEqual(validateStoredTickets('not-an-array', fallbackTickets), fallbackTickets);
  assert.deepEqual(validateStoredTickets([{ invalid: true }], fallbackTickets), fallbackTickets);

  const sanitized = validateStoredTickets([
    {
      id: 'CR-99',
      title: 'Valid ticket',
      description: 'Water leak',
      location: 'B204',
      category: 'invalid-cat',
      priority: 'invalid-prio',
      status: 'invalid-status',
    },
  ], fallbackTickets);
  assert.equal(sanitized.length, 1);
  assert.equal(sanitized[0].category, 'other');
  assert.equal(sanitized[0].priority, 'medium');
  assert.equal(sanitized[0].status, 'open');

  const fallbackAudit = [{ time: 1000, actor: 'System', action: 'Init', target: 'NONE', detail: '' }];
  assert.deepEqual(validateStoredAudit(null, fallbackAudit), fallbackAudit);
});
