(() => {
  'use strict';

  const STORAGE_KEY = 'campusresolve-demo-v1';
  const AUDIT_KEY = 'campusresolve-audit-v1';
  const categoryMeta = {
    plumbing: { label: 'Plumbing', icon: '♧', color: 'plumbing' },
    electrical: { label: 'Electrical', icon: 'ϟ', color: 'electrical' },
    sanitation: { label: 'Sanitation', icon: '✳', color: 'sanitation' },
    connectivity: { label: 'Connectivity', icon: '⌁', color: 'connectivity' },
    equipment: { label: 'Equipment', icon: '▣', color: 'equipment' },
    other: { label: 'Other', icon: '◈', color: 'other' }
  };
  const statusMeta = {
    open: { label: 'Open', next: 'assigned', action: 'Assign incident' },
    assigned: { label: 'Assigned', next: 'in_progress', action: 'Start work' },
    in_progress: { label: 'In progress', next: 'awaiting_verification', action: 'Request verification' },
    awaiting_verification: { label: 'Awaiting verification', next: 'resolved', action: 'Verify resolution' },
    resolved: { label: 'Resolved', next: 'reopened', action: 'Reopen incident' },
    reopened: { label: 'Reopened', next: 'assigned', action: 'Reassign incident' },
    needs_information: { label: 'Needs information', next: 'open', action: 'Return to open' }
  };

  const now = Date.now();
  const seedTickets = [
    { id: 'CR-2048', title: 'Lights flickering in corridor', description: 'The second-floor corridor lights keep flickering. This has happened several times this month and makes the area difficult to use in the evening.', category: 'electrical', location: 'A-Wing · Corridor, Floor 2', priority: 'high', status: 'open', reporter: 'Student report', assignedTo: '', minutesAgo: 18, resolutionNote: '', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 18 }] },
    { id: 'CR-2047', title: 'Water leak near classroom B204', description: 'Water is leaking from the ceiling outside room B204. The floor is wet and people are walking through the area.', category: 'plumbing', location: 'B-Wing · Outside B204', priority: 'critical', status: 'assigned', reporter: 'Student report', assignedTo: 'Facilities team', minutesAgo: 42, resolutionNote: '', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 90 }, { action: 'Assigned to Facilities team', actor: 'Facilities lead', ago: 42 }] },
    { id: 'CR-2046', title: 'Repeated Wi-Fi dropouts in lab', description: 'The computer lab network keeps disconnecting during classes. Several students report the same problem.', category: 'connectivity', location: 'C-Block · Computer Lab 1', priority: 'medium', status: 'in_progress', reporter: 'Lab assistant', assignedTo: 'IT support', minutesAgo: 70, resolutionNote: '', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 160 }, { action: 'Assigned to IT support', actor: 'Facilities lead', ago: 120 }, { action: 'Work started', actor: 'IT support', ago: 70 }] },
    { id: 'CR-2045', title: 'Overflowing waste bins', description: 'Waste bins are full near the main canteen entrance and need collection.', category: 'sanitation', location: 'Main Building · Canteen Entrance', priority: 'medium', status: 'awaiting_verification', reporter: 'Staff report', assignedTo: 'Housekeeping', minutesAgo: 110, resolutionNote: 'Collection reported by housekeeping; verify the area is clear.', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 260 }, { action: 'Assigned to Housekeeping', actor: 'Facilities lead', ago: 180 }, { action: 'Resolution submitted for verification', actor: 'Housekeeping', ago: 110 }] },
    { id: 'CR-2044', title: 'Projector not powering on', description: 'The projector in seminar room 3 does not power on when the switch is used.', category: 'equipment', location: 'A-Wing · Seminar Room 3', priority: 'low', status: 'resolved', reporter: 'Faculty report', assignedTo: 'AV support', minutesAgo: 185, resolutionNote: 'Power cable reseated and projector tested by AV support.', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 410 }, { action: 'Assigned to AV support', actor: 'Facilities lead', ago: 300 }, { action: 'Resolution verified', actor: 'Demo Operator', ago: 185 }] },
    { id: 'CR-2043', title: 'Lights failed again near stairwell', description: 'The corridor and stairwell lights have failed again. Staff said a similar issue was reported earlier this month.', category: 'electrical', location: 'A-Wing · Corridor, Floor 2', priority: 'high', status: 'open', reporter: 'Staff report', assignedTo: '', minutesAgo: 230, resolutionNote: '', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 230 }] },
    { id: 'CR-2042', title: 'Tap leaking in washroom', description: 'A tap is leaking continuously in the first-floor washroom and water is collecting below the sink.', category: 'plumbing', location: 'B-Wing · First-floor washroom', priority: 'medium', status: 'assigned', reporter: 'Student report', assignedTo: 'Plumbing team', minutesAgo: 320, resolutionNote: '', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 440 }, { action: 'Assigned to Plumbing team', actor: 'Facilities lead', ago: 320 }] },
    { id: 'CR-2041', title: 'Lights intermittently failing', description: 'Several lights in the second-floor corridor flicker and sometimes switch off completely.', category: 'electrical', location: 'A-Wing · Corridor, Floor 2', priority: 'medium', status: 'resolved', reporter: 'Student report', assignedTo: 'Electrical team', minutesAgo: 560, resolutionNote: 'One fixture was replaced; recurrence analysis suggests checking the circuit and adjacent fixtures.', reopenReason: '', events: [{ action: 'Report submitted', actor: 'Demo Operator', ago: 900 }, { action: 'Assigned to Electrical team', actor: 'Facilities lead', ago: 720 }, { action: 'Resolution verified', actor: 'Demo Operator', ago: 560 }] }
  ];
  const seedAudit = [
    { time: now - 18 * 60000, actor: 'Demo Operator', action: 'Submitted report', target: 'CR-2048', detail: 'Lights flickering in corridor' },
    { time: now - 42 * 60000, actor: 'Facilities lead', action: 'Assigned ticket', target: 'CR-2047', detail: 'Assigned to Facilities team' },
    { time: now - 70 * 60000, actor: 'IT support', action: 'Started work', target: 'CR-2046', detail: 'Connectivity investigation started' },
    { time: now - 110 * 60000, actor: 'Housekeeping', action: 'Requested verification', target: 'CR-2045', detail: 'Resolution note added for review' }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function sanitizeTickets(rawList) {
    if (!Array.isArray(rawList) || rawList.length === 0 || rawList.length > 200) return clone(seedTickets);
    const validCategories = Object.keys(categoryMeta);
    const validStatuses = Object.keys(statusMeta);
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    const cleaned = [];
    for (const item of rawList) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const id = typeof item.id === 'string' ? item.id.trim().slice(0, 24) : '';
      const title = typeof item.title === 'string' ? item.title.trim().slice(0, 100) : '';
      const description = typeof item.description === 'string' ? item.description.trim().slice(0, 1200) : '';
      const location = typeof item.location === 'string' ? item.location.trim().slice(0, 120) : '';
      if (!id || !title || !description || !location) continue;
      cleaned.push({
        id,
        title,
        description,
        category: validCategories.includes(item.category) ? item.category : 'other',
        location,
        priority: validPriorities.includes(item.priority) ? item.priority : 'medium',
        status: validStatuses.includes(item.status) ? item.status : 'open',
        reporter: typeof item.reporter === 'string' ? item.reporter.slice(0, 60) : 'Demo Operator',
        assignedTo: typeof item.assignedTo === 'string' ? item.assignedTo.slice(0, 60) : '',
        minutesAgo: Number.isFinite(Number(item.minutesAgo)) ? Math.max(0, Math.min(525600, Number(item.minutesAgo))) : 1,
        resolutionNote: typeof item.resolutionNote === 'string' ? item.resolutionNote.slice(0, 600) : '',
        reopenReason: typeof item.reopenReason === 'string' ? item.reopenReason.slice(0, 600) : '',
        reviewNote: typeof item.reviewNote === 'string' ? item.reviewNote.slice(0, 300) : '',
        events: Array.isArray(item.events)
          ? item.events
              .filter(e => e && typeof e === 'object' && typeof e.action === 'string')
              .slice(0, 30)
              .map(e => ({
                action: e.action.slice(0, 160),
                actor: typeof e.actor === 'string' ? e.actor.slice(0, 60) : 'Demo Operator',
                ago: Number.isFinite(Number(e.ago)) ? Math.max(0, Number(e.ago)) : 0
              }))
          : []
      });
    }
    return cleaned.length > 0 ? cleaned : clone(seedTickets);
  }

  function sanitizeAudit(rawList) {
    if (!Array.isArray(rawList) || rawList.length === 0 || rawList.length > 200) return clone(seedAudit);
    const cleaned = rawList
      .filter(e => e && typeof e === 'object' && typeof e.action === 'string')
      .slice(0, 100)
      .map(e => ({
        time: Number.isFinite(Number(e.time)) ? Number(e.time) : Date.now(),
        actor: typeof e.actor === 'string' ? e.actor.slice(0, 60) : 'Demo Operator',
        action: e.action.slice(0, 120),
        target: typeof e.target === 'string' ? e.target.slice(0, 40) : 'RECORD',
        detail: typeof e.detail === 'string' ? e.detail.slice(0, 240) : ''
      }));
    return cleaned.length > 0 ? cleaned : clone(seedAudit);
  }

  function readStorage(key, sanitizer) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? sanitizer(JSON.parse(raw)) : sanitizer(null);
    } catch {
      return sanitizer(null);
    }
  }

  let tickets = readStorage(STORAGE_KEY, sanitizeTickets);
  let audit = readStorage(AUDIT_KEY, sanitizeAudit);
  let activePage = 'overview';
  let pendingReport = null;
  let lastTriage = null;
  let currentDetailId = null;
  let lastFocusedElement = null;

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const isOpen = (ticket) => ticket.status !== 'resolved';
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalizeLocation = (value) => String(value || '').toLowerCase().replace(/[.,·]/g, ' ').replace(/\s+/g, ' ').trim();
  const ageLabel = (mins) => mins < 60 ? `${Math.max(1, Math.round(mins))}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
  const relativeTime = (time) => {
    const mins = Math.max(0, Math.round((Date.now() - time) / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };
  const titleCase = (v) => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  const categoryInfo = (category) => categoryMeta[category] || categoryMeta.other;
  const statusBadge = (status) => `<span class="status-badge status-${escapeHTML(status)}">${escapeHTML((statusMeta[status] || { label: titleCase(status) }).label)}</span>`;
  const priorityBadge = (priority) => `<span class="priority-badge priority-${escapeHTML(priority)}">${escapeHTML(titleCase(priority))}</span>`;

  function updateOverviewDateHeader() {
    const eyebrow = document.querySelector('#page-overview .page-heading .eyebrow');
    if (!eyebrow) return;
    const formatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(new Date()).toUpperCase();
    eyebrow.innerHTML = `${escapeHTML(formatted)} <span class="eyebrow-line"></span> CAMPUS OPERATIONS`;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets.slice(0, 200)));
      localStorage.setItem(AUDIT_KEY, JSON.stringify(audit.slice(0, 100)));
    } catch {
      toast('Local storage unavailable', 'Your changes may not persist after reloading this page.');
    }
  }
  function addAudit(actor, action, target, detail) {
    audit.unshift({ time: Date.now(), actor, action, target, detail });
    audit = audit.slice(0, 100);
    persist();
  }
  function toast(title, message) {
    const region = $('toast-region');
    if (!region) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-mark">✳</span><div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span></div>`;
    region.appendChild(el);
    window.setTimeout(() => el.remove(), 4200);
  }

  function getRecurringGroups() {
    const groups = new Map();
    for (const t of tickets) {
      const key = `${t.category}::${normalizeLocation(t.location)}`;
      if (!groups.has(key)) groups.set(key, { key, category: t.category, location: t.location, tickets: [] });
      groups.get(key).tickets.push(t);
    }
    return [...groups.values()].filter(g => g.tickets.length >= 2).map(g => ({ ...g, openCount: g.tickets.filter(isOpen).length })).sort((a, b) => b.tickets.length - a.tickets.length);
  }
  function countCategory(category) { return tickets.filter(t => t.category === category).length; }
  function countStatus(status) { return tickets.filter(t => t.status === status).length; }
  function metricCard(label, value, icon, tone, foot, change = '') {
    return `<article class="metric-card"><div class="metric-top"><span class="metric-label">${escapeHTML(label)}</span><span class="metric-icon ${tone || ''}">${icon}</span></div><div class="metric-number">${escapeHTML(value)}</div><div class="metric-foot">${change ? `<span class="metric-change ${change === '—' ? 'neutral' : ''}">${escapeHTML(change)}</span>` : ''}<span>${escapeHTML(foot)}</span></div></article>`;
  }
  function renderMetrics() {
    const openCount = tickets.filter(isOpen).length;
    const urgentCount = tickets.filter(t => ['critical', 'high'].includes(t.priority) && isOpen(t)).length;
    const resolvedCount = countStatus('resolved');
    const recurringCount = getRecurringGroups().length;
    $('metrics-grid').innerHTML = [
      metricCard('Open incidents', openCount, '▤', '', 'Across all categories', '+2 this week'),
      metricCard('High attention', urgentCount, 'ϟ', 'amber', 'Critical or high priority', urgentCount ? 'Review' : '—'),
      metricCard('Resolved in demo', resolvedCount, '✓', 'blue', 'Seeded + local demo changes', '+1 today'),
      metricCard('Recurring patterns', recurringCount, '↻', 'red', 'Groups with 2+ reports', recurringCount ? 'Inspect' : '—')
    ].join('');
    $('nav-open-count').textContent = String(openCount);
    $('attention-count').textContent = String(urgentCount + recurringCount);
    $('all-count').textContent = String(tickets.length);
  }

  function renderActivityChart() {
    const data = [
      { day: 'Sat', reports: 5, resolved: 2 }, { day: 'Sun', reports: 3, resolved: 2 },
      { day: 'Mon', reports: 7, resolved: 4 }, { day: 'Tue', reports: 6, resolved: 4 },
      { day: 'Wed', reports: 9, resolved: 6 }, { day: 'Thu', reports: 7, resolved: 5 },
      { day: 'Fri', reports: 5, resolved: 3 }
    ];
    const max = Math.max(...data.map(d => d.reports));
    $('activity-chart').innerHTML = data.map(d => `<div class="chart-day"><div class="bars"><span class="bar bar-new" style="height:${Math.max(5, d.reports / max * 92)}%" title="${d.reports} synthetic reports"></span><span class="bar bar-resolved" style="height:${Math.max(5, d.resolved / max * 92)}%" title="${d.resolved} synthetic resolutions"></span></div><small>${d.day}</small></div>`).join('');
    $('week-total').textContent = String(data.reduce((n, d) => n + d.reports, 0));
  }

  function ticketRow(t) {
    const cat = categoryInfo(t.category);
    return `<tr><td><div class="incident-cell"><span class="category-icon ${cat.color}">${cat.icon}</span><div><div class="incident-title">${escapeHTML(t.title)}</div><div class="incident-id">${escapeHTML(t.id)}</div></div></div></td><td><span class="category-name"><i class="mini-dot"></i>${escapeHTML(cat.label)}</span></td><td class="location-cell">${escapeHTML(t.location)}</td><td>${priorityBadge(t.priority)}</td><td>${statusBadge(t.status)}</td><td>${escapeHTML(ageLabel(t.minutesAgo ?? 1))}</td><td><button class="table-more" data-open-id="${escapeHTML(t.id)}" aria-label="Open ${escapeHTML(t.id)} details">···</button></td></tr>`;
  }
  function renderRecentTable() {
    const q = ($('overview-search')?.value || '').trim().toLowerCase();
    const view = tickets.filter(t => !q || [t.id, t.title, t.location, t.description].some(v => String(v || '').toLowerCase().includes(q))).slice().sort((a, b) => (a.minutesAgo ?? 0) - (b.minutesAgo ?? 0)).slice(0, 6);
    $('recent-table-body').innerHTML = view.map(ticketRow).join('');
    $('overview-list-meta').textContent = q ? `${view.length} matching recent incidents` : 'Latest reports from your campus';
    $('table-footer-count').textContent = `Showing ${view.length} of ${tickets.length} incidents`;
  }
  function renderAllTable() {
    const q = ($('incident-search')?.value || '').trim().toLowerCase();
    const category = $('filter-category')?.value || 'all';
    const status = $('filter-status')?.value || 'all';
    const priority = $('filter-priority')?.value || 'all';
    const view = tickets.filter(t => {
      const matchText = !q || [t.id, t.title, t.location, t.description].some(v => String(v || '').toLowerCase().includes(q));
      return matchText && (category === 'all' || t.category === category) && (status === 'all' || t.status === status) && (priority === 'all' || t.priority === priority);
    }).sort((a, b) => (a.minutesAgo ?? 0) - (b.minutesAgo ?? 0));
    $('all-table-body').innerHTML = view.map(ticketRow).join('');
    $('no-incidents').classList.toggle('hidden', view.length > 0);
    $('all-table-footer').textContent = `Showing ${view.length} of ${tickets.length} incidents`;
  }
  function renderCategoryBreakdown() {
    const counts = Object.keys(categoryMeta).map(category => ({ category, count: countCategory(category) })).sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...counts.map(x => x.count));
    $('category-breakdown').innerHTML = counts.filter(x => x.count > 0).map(item => {
      const meta = categoryInfo(item.category);
      return `<div class="category-line"><div class="category-line-top"><span class="category-line-title"><span class="category-glyph">${meta.icon}</span>${escapeHTML(meta.label)}</span><span class="category-line-count">${item.count}</span></div><div class="category-progress"><span style="width:${item.count / max * 100}%"></span></div></div>`;
    }).join('');
  }
  function renderAttention() {
    const groups = getRecurringGroups();
    const urgent = tickets.filter(t => ['critical', 'high'].includes(t.priority) && isOpen(t)).sort((a, b) => (a.priority === 'critical' ? -1 : 1) - (b.priority === 'critical' ? -1 : 1)).slice(0, 2);
    const items = [];
    if (urgent.some(t => t.priority === 'critical')) {
      const t = urgent.find(x => x.priority === 'critical');
      items.push({ mark: '!', tone: '', title: `${t.title}`, desc: `${t.id} · ${t.location}`, time: 'High attention · Review first', id: t.id });
    }
    const recurring = groups[0];
    if (recurring) items.push({ mark: '↻', tone: 'amber', title: `${recurring.tickets.length} reports share a pattern`, desc: `${categoryInfo(recurring.category).label} · ${recurring.location}`, time: 'Review recurrence evidence', page: 'recurring' });
    const second = urgent.find(t => !items.some(i => i.id === t.id));
    if (second) items.push({ mark: '!', tone: 'amber', title: second.title, desc: `${second.id} · ${second.location}`, time: 'High priority · Awaiting action', id: second.id });
    if (!items.length) items.push({ mark: '✓', tone: 'green', title: 'No urgent work found', desc: 'The current demo queue has no urgent open incidents.', time: 'Keep monitoring' });
    $('attention-list').innerHTML = items.map(i => `<div class="attention-item" ${i.id ? `data-open-id="${escapeHTML(i.id)}"` : i.page ? `data-go="${i.page}"` : ''}><span class="attention-mark ${i.tone}">${i.mark}</span><div class="attention-copy"><div class="attention-title">${escapeHTML(i.title)}</div><div class="attention-desc">${escapeHTML(i.desc)}</div><div class="attention-time">${escapeHTML(i.time)}</div></div></div>`).join('');
  }
  function renderOverviewInsight() {
    const groups = getRecurringGroups();
    if (groups.length) {
      const g = groups[0];
      $('overview-insight-title').textContent = 'A repeated fault may have a shared cause.';
      $('overview-insight-copy').textContent = `There are ${g.tickets.length} ${categoryInfo(g.category).label.toLowerCase()} reports associated with ${g.location}. That pattern is worth investigating before treating each report as isolated.`;
      $('overview-insight-evidence').innerHTML = `<span class="evidence-chip">${g.tickets.length} linked demo records</span><span class="evidence-chip">${g.openCount} still open</span><span class="evidence-chip">Root cause not confirmed</span>`;
    } else {
      $('overview-insight-title').textContent = 'No repeated pattern is established yet.';
      $('overview-insight-copy').textContent = 'More related reports may be needed before a useful recurring-fault recommendation can be made.';
      $('overview-insight-evidence').innerHTML = '<span class="evidence-chip">Insufficient repeated records</span>';
    }
  }
  function renderOverview() {
    updateOverviewDateHeader();
    renderMetrics();
    renderActivityChart();
    renderRecentTable();
    renderCategoryBreakdown();
    renderAttention();
    renderOverviewInsight();
  }

  function getPreventionSuggestions(groups) {
    return groups.slice(0, 4).map(g => {
      let action = 'Review the recent incident history and inspect the shared area for a common contributing factor.';
      if (g.category === 'electrical') action = 'Have authorized electrical staff inspect the related fixtures and circuit, then record whether the issue is isolated or shared.';
      if (g.category === 'plumbing') action = 'Inspect nearby fixtures and visible leakage paths; record the verified source before scheduling any larger repair.';
      if (g.category === 'connectivity') action = 'Ask IT staff to compare access-point health, connection logs and affected devices before changing network configuration.';
      if (g.category === 'sanitation') action = 'Compare collection timing and bin capacity, then trial a more suitable schedule if staff confirm a recurring overflow.';
      if (g.category === 'equipment') action = 'Review maintenance history and recurring symptoms, then test the equipment after any authorized repair.';
      return { group: g, action };
    });
  }
  function renderRecurring() {
    const groups = getRecurringGroups();
    const repeated = groups.reduce((n, g) => n + g.tickets.length, 0);
    $('recurring-metrics').innerHTML = [
      metricCard('Repeat patterns', groups.length, '↻', '', 'Locations with 2+ reports', groups.length ? 'Observed' : '—'),
      metricCard('Reports in patterns', repeated, '▤', 'blue', 'May overlap across groups', 'Demo data'),
      metricCard('Open related work', groups.reduce((n, g) => n + g.openCount, 0), 'ϟ', 'amber', 'Requires staff review', 'Review')
    ].join('');
    if (!groups.length) $('recurring-list').innerHTML = '<div class="recurring-empty">No repeated category/location groups found in the current data.</div>';
    else $('recurring-list').innerHTML = groups.map(g => {
      const meta = categoryInfo(g.category);
      return `<div class="recurring-item"><div class="recurring-item-top"><div class="recurring-item-title">${meta.icon} &nbsp;${escapeHTML(meta.label)} near ${escapeHTML(g.location)}</div><span class="recurring-item-count">${g.tickets.length} reports</span></div><div class="recurring-item-meta"><span>⌁ ${g.openCount} open</span><span>• ${g.tickets.length - g.openCount} resolved</span><span>• Shared location/category match</span></div><div class="repeat-progress"><span style="width:${Math.min(100, g.tickets.length / Math.max(3, groups[0].tickets.length) * 100)}%"></span></div><div class="recurring-item-meta">Evidence: ${g.tickets.map(t => escapeHTML(t.id)).join(', ')}</div></div>`;
    }).join('');
    const suggestions = getPreventionSuggestions(groups);
    $('prevention-list').innerHTML = suggestions.length ? suggestions.map((s, i) => `<div class="prevention-item"><span class="prevent-num">0${i + 1}</span><div><strong>${escapeHTML(categoryInfo(s.group.category).label)} · ${escapeHTML(s.group.location)}</strong><p>${escapeHTML(s.action)}</p><span class="supporting-ids">SUPPORTING RECORDS: ${s.group.tickets.map(t => escapeHTML(t.id)).join(' · ')}</span></div></div>`).join('') : '<div class="recurring-empty">No preventive recommendations yet. Add related incident reports to explore this workflow.</div>';
  }
  function renderAudit() {
    $('audit-list').innerHTML = audit.slice(0, 30).map(e => `<div class="audit-event"><div class="audit-event-top"><strong>${escapeHTML(e.action)}</strong><time>${escapeHTML(relativeTime(e.time))}</time></div><p><strong>${escapeHTML(e.actor)}</strong> · <span class="audit-target">${escapeHTML(e.target)}</span> · ${escapeHTML(e.detail || '')}</p></div>`).join('');
  }
  function setPage(page) {
    if (!['overview', 'incidents', 'triage', 'recurring', 'audit', 'how'].includes(page)) page = 'overview';
    activePage = page;
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    $(`page-${page}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
    $('breadcrumb-current').textContent = ({ overview: 'Overview', incidents: 'Incidents', triage: 'AI triage', recurring: 'Recurring faults', audit: 'Audit trail', how: 'How it works' })[page];
    $('sidebar').classList.remove('open');
    if (page === 'overview') renderOverview();
    if (page === 'incidents') renderAllTable();
    if (page === 'recurring') renderRecurring();
    if (page === 'audit') renderAudit();
    if (typeof window.scrollTo === 'function') {
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  function openModal(id) {
    const el = $(id);
    if (!el) return;
    lastFocusedElement = document.activeElement;
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const focusTarget = el.querySelector('input, textarea, select, button');
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
  }
  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
    if ($$('.modal-backdrop:not(.hidden)').length === 0) document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }
  function openReportModal() { $('report-form').reset(); openModal('report-modal'); }

  function classifyDemo(description, userCategory, safetyRisk = false) {
    const text = String(description || '').toLowerCase();
    const checks = [
      ['plumbing', /leak|water|tap|pipe|drain|flush|wet floor|ceiling/.test(text)],
      ['electrical', /light|electric|power|socket|wire|flicker|bulb|circuit/.test(text)],
      ['sanitation', /waste|bin|garbage|toilet|clean|overflow|rubbish|hygiene/.test(text)],
      ['connectivity', /wifi|wi-fi|network|internet|disconnect|router|connection|signal/.test(text)],
      ['equipment', /projector|computer|desk|chair|equipment|keyboard|printer|fan|screen/.test(text)]
    ];
    let category = 'other';
    for (const [c, match] of checks) if (match) { category = c; break; }
    if (userCategory && userCategory !== 'auto' && categoryMeta[userCategory]) category = userCategory;
    let urgency = 'medium';
    const hasHazardKeyword = /fire|smoke|exposed wire|exposed wiring|electric shock|flood|ceiling collapse|sparking|gas leak/.test(text);
    if (safetyRisk || hasHazardKeyword) urgency = 'critical';
    else if (/wet floor|leak|failed|flicker|repeated|again|continuously|major|classroom|stairwell/.test(text)) urgency = 'high';
    else if (/minor|cosmetic|single|not urgent|small issue/.test(text)) urgency = 'low';
    const missingFields = [];
    if (!/room|floor|wing|block|corridor|canteen|lab|washroom|entrance|near|outside|building/.test(text)) missingFields.push('Exact room or nearby landmark');
    if (!/who|student|staff|class|people|several|many|affected|everyone|students|faculty/.test(text)) missingFields.push('Number or type of people affected');
    const evidence = [];
    if (safetyRisk) evidence.push('Reporter flagged a possible immediate safety risk; priority elevated for human review.');
    else if (hasHazardKeyword) evidence.push('Safety-critical hazard keywords detected in report; priority elevated for human review.');
    if (/leak|water|tap|pipe|drain|wet floor/.test(text)) evidence.push('The report mentions water or a possible plumbing issue.');
    if (/light|flicker|electric|power|socket|wire/.test(text)) evidence.push('The report mentions a lighting or electrical symptom.');
    if (/wifi|wi-fi|network|internet|disconnect/.test(text)) evidence.push('The report mentions connectivity symptoms.');
    if (/repeat|again|several times|repeated|third time/.test(text)) evidence.push('The report describes recurrence.');
    if (evidence.length === 0) evidence.push('The description provides a starting point, but details need human review.');
    return {
      title: String(description || 'Campus issue').replace(/\s+/g, ' ').slice(0, 68).replace(/[.!?]$/, '') || 'Campus issue reported',
      category,
      urgency,
      summary: 'Rule-based demo recommendation derived from report keywords. This is not a live Gemini result and is not a confirmed diagnosis.',
      evidence: evidence.slice(0, 5),
      missingFields,
      confidence: 0.62,
      requiresReview: true,
      safetyOverride: Boolean(safetyRisk || hasHazardKeyword),
      source: 'demo',
      model: null
    };
  }
  function findPotentialDuplicates(category, location, exceptId) {
    const loc = normalizeLocation(location);
    if (!loc) return [];
    return tickets.filter(t => t.id !== exceptId && t.category === category && isOpen(t) && normalizeLocation(t.location) === loc).slice(0, 4);
  }
  function renderTriageResult(result, description, location, safetyRisk) {
    lastTriage = { ...result, description, location, safetyRisk: Boolean(safetyRisk), consumed: false };
    $('triage-empty').classList.add('hidden');
    $('triage-result').classList.remove('hidden');
    $('model-status').textContent = result.source === 'gemini' ? 'GEMINI LIVE' : 'DEMO FALLBACK';
    const source = result.source === 'gemini' ? `Gemini · ${result.model || 'Configured model'}` : 'Rules-based demo fallback · Not live AI';
    const duplicateCandidates = findPotentialDuplicates(result.category, location, pendingReport?.id);
    const cat = categoryInfo(result.category);
    const missing = result.missingFields?.length ? `<ul>${result.missingFields.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ul>` : '<p>No required fields were flagged by this pass. Verify that the supplied details are accurate.</p>';
    const evidence = result.evidence?.length ? `<ul>${result.evidence.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ul>` : '<p>No evidence notes were provided. Manual review is required.</p>';
    const duplicates = duplicateCandidates.length ? `<div class="result-section"><h3>Potential duplicate candidates</h3><ul>${duplicateCandidates.map(t => `<li><button class="text-link" data-open-id="${escapeHTML(t.id)}">${escapeHTML(t.id)} · ${escapeHTML(t.title)}</button> — ${escapeHTML((statusMeta[t.status] || {}).label || t.status)}</li>`).join('')}</ul><p>These are exact category/location matches, not automatically confirmed duplicates.</p></div>` : `<div class="result-section"><h3>Similar incident check</h3><p>No exact open match for the chosen category and location was found in the available demo records.</p></div>`;
    const conf = Math.round(Math.max(0, Math.min(1, Number(result.confidence) || 0)) * 100);
    $('triage-result').innerHTML = `<div class="result-source"><span>✳</span>${escapeHTML(source)}</div><h3 class="result-title">${escapeHTML(result.title || 'Triage recommendation')}</h3><p class="result-summary">${escapeHTML(result.summary || '')}</p><div class="result-chips"><span class="result-chip">${cat.icon} ${escapeHTML(cat.label)}</span><span class="result-chip urgency-${escapeHTML(result.urgency)}">${escapeHTML(titleCase(result.urgency))} urgency suggested</span><span class="result-chip">Human review ${result.requiresReview ? 'required' : 'recommended'}</span></div><div class="result-section"><h3>Confidence signal <span class="confidence-label">${conf}% · not calibrated</span></h3><div class="result-confidence"><div class="confidence-track"><span style="width:${conf}%"></span></div></div><p>This is a model/rule output signal, not a measured probability of being correct.</p></div><div class="result-section"><h3>Evidence considered</h3>${evidence}</div><div class="result-section"><h3>Missing or uncertain details</h3>${missing}</div>${duplicates}<div class="review-note">Human review is required before accepting urgency, routing or any consequential action. The system does not confirm that a physical fix has occurred.</div><div class="result-actions"><button class="button button-primary" id="create-ticket-from-triage">Create ticket from recommendation <span>→</span></button><button class="button button-secondary" id="triage-retry">Analyze again</button></div>`;
    $('create-ticket-from-triage').addEventListener('click', () => createTicketFromTriage());
    $('triage-retry').addEventListener('click', () => runTriage($('triage-description').value, $('triage-location').value, $('triage-category').value, $('triage-safety-risk')?.checked));
  }
  async function runTriage(description, location, category, safetyRisk = false) {
    const desc = String(description || '').trim();
    const loc = String(location || '').trim();
    const isSafetyRisk = Boolean(safetyRisk);
    if (!desc || desc.length > 1200) { toast('Description required', 'Enter a description of up to 1,200 characters.'); $('triage-description').focus(); return; }
    if (!loc || loc.length > 120) { toast('Location required', 'Enter the user-provided building, room or area.'); $('triage-location').focus(); return; }
    const btn = $('run-triage');
    btn.disabled = true;
    btn.innerHTML = '<span>✳</span> Analyzing report…';
    $('triage-empty').classList.remove('hidden');
    $('triage-empty').innerHTML = '<div class="empty-orbit"><span>✳</span></div><h3>Reviewing the report</h3><p>Validating fields and checking whether a live backend is available…</p><div class="empty-checks"><span>✓ Input bounds checked</span><span>↻ Checking triage service</span></div>';
    $('triage-result').classList.add('hidden');
    let result;
    try {
      const response = await fetch('./api/triage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, location: loc, category: category || 'auto', safetyRisk: isSafetyRisk })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.source === 'gemini' && payload.triage) {
        result = { ...payload.triage, source: 'gemini', model: payload.model || 'Gemini' };
      } else {
        result = classifyDemo(desc, category, isSafetyRisk);
        result.serviceNotice = payload.message || 'Live Gemini backend is not available, so the app used its labelled rules-based fallback.';
      }
    } catch {
      result = classifyDemo(desc, category, isSafetyRisk);
      result.serviceNotice = 'The live endpoint was unreachable. The app used its labelled rules-based fallback.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>✳</span> Analyze report <span class="button-arrow">→</span>';
    }
    $('triage-empty').classList.add('hidden');
    renderTriageResult(result, desc, loc, isSafetyRisk);
    if (result.source !== 'gemini') toast('Demo triage completed', result.serviceNotice || 'This is a rules-based demo result, not live Gemini output.');
    else toast('Gemini triage completed', 'Review the evidence and recommendation before creating a ticket.');
    addAudit('Demo Operator', result.source === 'gemini' ? 'Analyzed report with Gemini' : 'Analyzed report with demo rules', 'DRAFT', `${categoryInfo(result.category).label} · ${result.urgency} urgency suggestion`);
  }
  function createTicketFromTriage() {
    if (!lastTriage) return toast('No recommendation', 'Analyze a report first.');
    if (lastTriage.consumed) {
      toast('Already created', 'A ticket was already created from this triage recommendation.');
      return;
    }
    lastTriage.consumed = true;
    const createBtn = $('create-ticket-from-triage');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = 'Ticket created ✓';
    }
    const highest = tickets.reduce((n, t) => Math.max(n, Number(String(t.id).replace(/\D/g, '')) || 2000), 2000);
    const ticket = {
      id: `CR-${highest + 1}`,
      title: String(pendingReport?.title || lastTriage.title || 'Campus issue reported').slice(0, 100),
      description: String(lastTriage.description || '').slice(0, 1200),
      category: categoryMeta[lastTriage.category] ? lastTriage.category : 'other',
      location: String(lastTriage.location || '').slice(0, 120),
      priority: ['critical', 'high', 'medium', 'low'].includes(lastTriage.urgency) ? lastTriage.urgency : 'medium',
      status: 'open',
      reporter: 'Demo Operator',
      assignedTo: '',
      minutesAgo: 1,
      resolutionNote: '',
      reopenReason: '',
      aiSource: lastTriage.source,
      aiModel: lastTriage.model || null,
      events: [{ action: 'Report created after triage review', actor: 'Demo Operator', ago: 0 }]
    };
    if (lastTriage.requiresReview !== false) {
      ticket.reviewNote = 'AI/rule recommendation requires human review. Priority and routing remain advisory.';
    }
    tickets.unshift(ticket);
    addAudit('Demo Operator', 'Created ticket after triage review', ticket.id, `${ticket.title} · ${ticket.category} · ${ticket.priority} priority`);
    pendingReport = null;
    persist();
    renderOverview();
    toast('Ticket created in demo workspace', `${ticket.id} is now in the local incident queue.`);
    setPage('incidents');
    openTicketDetail(ticket.id);
  }

  function openTicketDetail(id) {
    const t = tickets.find(t => t.id === id);
    if (!t) return;
    currentDetailId = id;
    const cat = categoryInfo(t.category);
    $('detail-eyebrow').textContent = `${t.id} · INCIDENT DETAIL`;
    $('detail-modal-title').textContent = t.title;
    $('detail-modal-subtitle').textContent = `${cat.label} · ${t.location}`;
    const timeline = (t.events || []).map(e => `<div class="detail-timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHTML(e.action)}</strong><br>${escapeHTML(e.actor)} · ${escapeHTML(e.ago === 0 ? 'Just now' : ageLabel(e.ago || 1))}</div></div>`).join('');
    const verificationField = t.status === 'awaiting_verification'
      ? `<label class="field-label" for="verification-note">Verification note <span>Required to resolve</span></label><textarea id="verification-note" rows="3" placeholder="Describe what was checked and the evidence supporting closure..."></textarea>`
      : t.status === 'in_progress'
        ? `<label class="field-label" for="resolution-note-input">Work summary <span>Recommended</span></label><textarea id="resolution-note-input" rows="3" placeholder="Describe the work completed so far..."></textarea>`
        : t.status === 'resolved'
          ? `<label class="field-label" for="reopen-reason">Reason for reopening <span>Required to reopen</span></label><textarea id="reopen-reason" rows="3" placeholder="Explain why this resolved incident needs to be reopened..."></textarea>`
          : '';
    $('detail-content').innerHTML = `<div class="detail-section"><p class="detail-description">${escapeHTML(t.description)}</p><div class="detail-meta-grid"><div class="detail-meta"><small>Priority</small>${priorityBadge(t.priority)}</div><div class="detail-meta"><small>Status</small>${statusBadge(t.status)}</div><div class="detail-meta"><small>Assigned to</small><strong>${escapeHTML(t.assignedTo || 'Not assigned')}</strong></div></div></div><div class="detail-section"><h3>Workflow activity</h3><div class="detail-timeline">${timeline || '<p>No events recorded.</p>'}</div></div>${verificationField ? `<div class="detail-section">${verificationField}</div>` : ''}${t.resolutionNote ? `<div class="detail-section"><h3>Latest resolution note</h3><p class="detail-description">${escapeHTML(t.resolutionNote)}</p></div>` : ''}${t.reopenReason ? `<div class="detail-section"><h3>Latest reopen reason</h3><p class="detail-description">${escapeHTML(t.reopenReason)}</p></div>` : ''}${t.reviewNote ? `<div class="detail-section"><div class="review-note">${escapeHTML(t.reviewNote)}</div></div>` : ''}<div class="detail-section"><h3>Current workflow action</h3><div class="detail-actions-row"><span class="status-badge status-${escapeHTML(t.status)}">${escapeHTML((statusMeta[t.status] || {}).label || t.status)}</span><span style="font-size:10px;color:#87948a;align-self:center">Next: ${escapeHTML((statusMeta[t.status] || {}).action || 'Review')}</span></div></div>`;
    $('advance-status').textContent = `${(statusMeta[t.status] || {}).action || 'Review'} →`;
    $('advance-status').disabled = false;
    openModal('detail-modal');
  }
  function updateTicketStatus() {
    const t = tickets.find(t => t.id === currentDetailId);
    if (!t) return;
    const meta = statusMeta[t.status];
    if (!meta) return toast('No workflow action', 'This status has no configured transition.');
    const previous = t.status;
    const next = meta.next;
    if (previous === 'awaiting_verification') {
      const note = ($('verification-note')?.value || '').trim();
      if (note.length < 8) { toast('Verification note required', 'Add at least 8 characters describing what was verified.'); $('verification-note')?.focus(); return; }
      t.resolutionNote = note.slice(0, 600);
      t.events.unshift({ action: 'Resolution verified', actor: 'Demo Operator', ago: 0 });
    } else if (previous === 'resolved' && next === 'reopened') {
      const reason = ($('reopen-reason')?.value || '').trim();
      if (reason.length < 8) { toast('Reopen reason required', 'Add at least 8 characters explaining why the incident is being reopened.'); $('reopen-reason')?.focus(); return; }
      t.reopenReason = reason.slice(0, 600);
      t.events.unshift({ action: `Reopened: ${t.reopenReason.slice(0, 100)}`, actor: 'Demo Operator', ago: 0 });
    } else if (previous === 'in_progress') {
      const note = ($('resolution-note-input')?.value || '').trim();
      if (note) t.resolutionNote = note.slice(0, 600);
      t.events.unshift({ action: 'Work submitted for verification', actor: 'Demo Operator', ago: 0 });
    } else if (next === 'assigned') {
      t.assignedTo = t.assignedTo || departmentFor(t.category);
      t.events.unshift({ action: `Assigned to ${t.assignedTo}`, actor: 'Demo Operator', ago: 0 });
    } else if (next === 'in_progress') {
      t.events.unshift({ action: 'Work started', actor: 'Demo Operator', ago: 0 });
    } else {
      t.events.unshift({ action: `Status changed to ${(statusMeta[next] || {}).label || titleCase(next)}`, actor: 'Demo Operator', ago: 0 });
    }
    t.status = next;
    t.minutesAgo = 0;
    addAudit('Demo Operator', meta.action, t.id, `${(statusMeta[previous] || {}).label} → ${(statusMeta[next] || {}).label}`);
    persist();
    renderOverview();
    if (activePage === 'incidents') renderAllTable();
    if (activePage === 'recurring') renderRecurring();
    renderAudit();
    toast('Workflow updated', `${t.id}: ${(statusMeta[next] || {}).label}`);
    openTicketDetail(t.id);
  }
  function departmentFor(category) {
    return ({ plumbing: 'Plumbing team', electrical: 'Electrical team', sanitation: 'Housekeeping', connectivity: 'IT support', equipment: 'AV support', other: 'Facilities team' })[category] || 'Facilities team';
  }
  function exportCSV() {
    const headers = ['id', 'title', 'category', 'location', 'priority', 'status', 'assignedTo', 'description'];
    const csvHelper = window.CampusResolveCSV;
    const csv = csvHelper && typeof csvHelper.toCSV === 'function'
      ? csvHelper.toCSV(headers, tickets)
      : [headers, ...tickets.map(t => headers.map(h => t[h] || ''))].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'campusresolve-demo-incidents.csv'; a.click(); URL.revokeObjectURL(url);
    toast('CSV exported', 'The file contains the current synthetic/demo incident records.');
  }
  function resetDemo() {
    tickets = clone(seedTickets);
    audit = clone(seedAudit);
    lastTriage = null;
    pendingReport = null;
    persist();
    renderOverview(); renderAllTable(); renderRecurring(); renderAudit();
    toast('Demo reset', 'The synthetic example records have been restored.');
  }

  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => setPage(btn.dataset.page)));
  const brandLink = document.querySelector('.brand');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      setPage('overview');
    });
  }
  document.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]');
    if (go) setPage(go.dataset.go);
    const open = event.target.closest('[data-open-id]');
    if (open) openTicketDetail(open.dataset.openId);
  });
  $('mobile-menu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  $('new-report-top').addEventListener('click', openReportModal);
  $('new-report-incident').addEventListener('click', openReportModal);
  $('help-top').addEventListener('click', () => setPage('how'));
  $('banner-dismiss').addEventListener('click', () => document.querySelector('.demo-banner').classList.add('hidden'));
  $('reset-button').addEventListener('click', resetDemo);
  $('reset-button').title = 'Reset synthetic demo data';
  $('refresh-audit').addEventListener('click', () => { renderAudit(); toast('History refreshed', 'Displayed the latest local demo events.'); });
  $('overview-search').addEventListener('input', renderRecentTable);
  ['incident-search', 'filter-category', 'filter-status', 'filter-priority'].forEach(id => $(id).addEventListener(id === 'incident-search' ? 'input' : 'change', renderAllTable));
  $('clear-filters').addEventListener('click', () => { $('incident-search').value = ''; $('filter-category').value = 'all'; $('filter-status').value = 'all'; $('filter-priority').value = 'all'; renderAllTable(); });
  $('export-csv').addEventListener('click', exportCSV);
  $('triage-description').addEventListener('input', () => $('triage-char-count').textContent = `${$('triage-description').value.length} / 1200`);
  document.querySelectorAll('.sample-prompt').forEach(btn => btn.addEventListener('click', () => {
    $('triage-description').value = btn.dataset.sample;
    $('triage-char-count').textContent = `${$('triage-description').value.length} / 1200`;
    if (!$('triage-location').value) $('triage-location').value = btn.dataset.sample.includes('corridor') ? 'A-Wing · Corridor, Floor 2' : btn.dataset.sample.includes('lab') ? 'C-Block · Computer Lab 1' : 'B-Wing · Outside B204';
    $('triage-description').focus();
  }));
  $('run-triage').addEventListener('click', () => { pendingReport = null; runTriage($('triage-description').value, $('triage-location').value, $('triage-category').value, $('triage-safety-risk')?.checked); });
  $('report-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('report-title').value.trim();
    const description = $('report-description').value.trim();
    const location = $('report-location').value.trim();
    const category = $('report-category').value;
    const safetyRisk = Boolean($('report-safety-risk')?.checked);
    if (!title || !description || !location) return toast('Complete required fields', 'Title, description and location are required.');
    pendingReport = { title, description, location, category, safetyRisk };
    $('triage-description').value = `${title}. ${description}`.slice(0, 1200);
    $('triage-location').value = location;
    $('triage-category').value = category;
    if ($('triage-safety-risk')) $('triage-safety-risk').checked = safetyRisk;
    $('triage-char-count').textContent = `${$('triage-description').value.length} / 1200`;
    closeModal('report-modal');
    setPage('triage');
    runTriage($('triage-description').value, location, category, safetyRisk);
  });
  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => closeModal('report-modal')));
  document.querySelectorAll('.close-detail').forEach(btn => btn.addEventListener('click', () => closeModal('detail-modal')));
  $('report-modal').addEventListener('click', (e) => { if (e.target === $('report-modal')) closeModal('report-modal'); });
  $('detail-modal').addEventListener('click', (e) => { if (e.target === $('detail-modal')) closeModal('detail-modal'); });
  $('advance-status').addEventListener('click', updateTicketStatus);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('report-modal').classList.contains('hidden')) closeModal('report-modal');
      if (!$('detail-modal').classList.contains('hidden')) closeModal('detail-modal');
      $('sidebar').classList.remove('open');
    }
  });

  renderOverview();
  renderAllTable();
  renderRecurring();
  renderAudit();
})();
