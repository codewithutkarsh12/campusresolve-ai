const CATEGORIES = Object.freeze(['plumbing', 'electrical', 'sanitation', 'connectivity', 'equipment', 'other']);
const PRIORITIES = Object.freeze(['critical', 'high', 'medium', 'low']);
const STATUSES = Object.freeze(['open', 'assigned', 'in_progress', 'awaiting_verification', 'resolved', 'reopened', 'needs_information']);

const SAFETY_HAZARD_PATTERN = /\b(fire|smoke|exposed\s+wires?|exposed\s+wiring|electric\s+shock|electrocut|sparking|live\s+wires?|gas\s+leak|flood|ceiling\s+collapse|structural\s+collapse|chemical\s+spill)\b/i;

function normalizeCategory(value) {
  const clean = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return CATEGORIES.includes(clean) ? clean : 'other';
}

function normalizePriority(value) {
  const clean = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return PRIORITIES.includes(clean) ? clean : 'medium';
}

function detectSafetyHazard(description, safetyRiskFlag = false) {
  if (safetyRiskFlag === true) return true;
  return SAFETY_HAZARD_PATTERN.test(String(description || ''));
}

function applySafetyOverride(triage, context = {}) {
  const base = validateTriage(triage);
  const hasHazard = detectSafetyHazard(context.description, Boolean(context.safetyRisk));
  if (!hasHazard) {
    return { ...base, safetyOverride: false };
  }
  const elevatedUrgency = base.urgency === 'critical' ? 'critical' : 'critical';
  const evidence = [...base.evidence];
  const note = context.safetyRisk
    ? 'Reporter flagged a possible immediate safety risk; priority elevated for human review.'
    : 'Safety-critical hazard keywords detected in report; priority elevated for human review.';
  if (!evidence.includes(note) && evidence.length < 5) {
    evidence.unshift(note);
  }
  return {
    ...base,
    urgency: elevatedUrgency,
    evidence: evidence.slice(0, 5),
    requiresReview: true,
    safetyOverride: true,
  };
}

function validateTriage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Triage response must be an object');
  }
  const category = normalizeCategory(value.category);
  const urgency = normalizePriority(value.urgency || value.suggestedUrgency);
  const summary = typeof value.summary === 'string' ? value.summary.trim().slice(0, 500) : '';
  const title = typeof value.title === 'string' ? value.title.trim().slice(0, 100) : '';
  const rawEvidence = Array.isArray(value.evidence)
    ? value.evidence
    : typeof value.evidence === 'string' && value.evidence.trim()
      ? [value.evidence]
      : [];
  const rawMissing = Array.isArray(value.missingFields)
    ? value.missingFields
    : typeof value.missingFields === 'string' && value.missingFields.trim()
      ? [value.missingFields]
      : [];
  const evidence = rawEvidence
    .filter((v) => typeof v === 'string' && v.trim())
    .slice(0, 5)
    .map((v) => v.trim().slice(0, 240));
  const missingFields = rawMissing
    .filter((v) => typeof v === 'string' && v.trim())
    .slice(0, 8)
    .map((v) => v.trim().slice(0, 100));
  const rawConfidence = Number(value.confidence);
  const confidence = Number.isFinite(rawConfidence) ? Math.max(0, Math.min(1, rawConfidence)) : 0.5;
  return {
    title: title || 'Campus issue reported',
    category,
    urgency,
    summary: summary || 'The report requires review before the next action is confirmed.',
    evidence,
    missingFields,
    confidence,
    requiresReview: value.requiresReview !== false && value.needsHumanReview !== false,
  };
}

function validateStoredTickets(records, fallback = []) {
  if (!Array.isArray(records) || records.length === 0 || records.length > 200) {
    return JSON.parse(JSON.stringify(fallback));
  }
  const valid = [];
  for (const item of records) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const id = typeof item.id === 'string' ? item.id.trim().slice(0, 24) : '';
    const title = typeof item.title === 'string' ? item.title.trim().slice(0, 100) : '';
    const description = typeof item.description === 'string' ? item.description.trim().slice(0, 1200) : '';
    const location = typeof item.location === 'string' ? item.location.trim().slice(0, 120) : '';
    if (!id || !title || !description || !location) continue;
    valid.push({
      id,
      title,
      description,
      category: normalizeCategory(item.category),
      location,
      priority: normalizePriority(item.priority),
      status: STATUSES.includes(item.status) ? item.status : 'open',
      reporter: typeof item.reporter === 'string' ? item.reporter.slice(0, 60) : 'Demo Operator',
      assignedTo: typeof item.assignedTo === 'string' ? item.assignedTo.slice(0, 60) : '',
      minutesAgo: Number.isFinite(Number(item.minutesAgo)) ? Math.max(0, Math.min(525600, Number(item.minutesAgo))) : 1,
      resolutionNote: typeof item.resolutionNote === 'string' ? item.resolutionNote.slice(0, 600) : '',
      reopenReason: typeof item.reopenReason === 'string' ? item.reopenReason.slice(0, 600) : '',
      reviewNote: typeof item.reviewNote === 'string' ? item.reviewNote.slice(0, 300) : '',
      events: Array.isArray(item.events)
        ? item.events
            .filter((e) => e && typeof e === 'object' && typeof e.action === 'string')
            .slice(0, 30)
            .map((e) => ({
              action: e.action.slice(0, 160),
              actor: typeof e.actor === 'string' ? e.actor.slice(0, 60) : 'Demo Operator',
              ago: Number.isFinite(Number(e.ago)) ? Math.max(0, Number(e.ago)) : 0,
            }))
        : [],
    });
  }
  return valid.length > 0 ? valid : JSON.parse(JSON.stringify(fallback));
}

function validateStoredAudit(records, fallback = []) {
  if (!Array.isArray(records) || records.length === 0 || records.length > 200) {
    return JSON.parse(JSON.stringify(fallback));
  }
  const valid = records
    .filter((e) => e && typeof e === 'object' && typeof e.action === 'string')
    .slice(0, 100)
    .map((e) => ({
      time: Number.isFinite(Number(e.time)) ? Number(e.time) : Date.now(),
      actor: typeof e.actor === 'string' ? e.actor.slice(0, 60) : 'Demo Operator',
      action: e.action.slice(0, 120),
      target: typeof e.target === 'string' ? e.target.slice(0, 40) : 'RECORD',
      detail: typeof e.detail === 'string' ? e.detail.slice(0, 240) : '',
    }));
  return valid.length > 0 ? valid : JSON.parse(JSON.stringify(fallback));
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  normalizeCategory,
  normalizePriority,
  detectSafetyHazard,
  applySafetyOverride,
  validateTriage,
  validateStoredTickets,
  validateStoredAudit,
};
