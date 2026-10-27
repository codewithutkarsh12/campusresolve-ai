const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createServer } = require('../server');

const ROOT = path.resolve(__dirname, '..');

class MiniElement {
  constructor(tagName, ownerDocument) {
    this.tagName = String(tagName || 'DIV').toUpperCase();
    this.ownerDocument = ownerDocument;
    this.id = '';
    this.className = '';
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.style = {};
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.title = '';
    this._innerHTML = '';
    this._textContent = '';
    this.listeners = new Map();
    const self = this;
    this.classList = {
      _set() {
        return new Set(String(self.className || '').split(/\s+/).filter(Boolean));
      },
      _sync(s) {
        self.className = [...s].join(' ');
      },
      add(...tokens) {
        const s = this._set();
        tokens.forEach((t) => s.add(t));
        this._sync(s);
      },
      remove(...tokens) {
        const s = this._set();
        tokens.forEach((t) => s.delete(t));
        this._sync(s);
      },
      toggle(token, force) {
        const s = this._set();
        const shouldHave = force !== undefined ? Boolean(force) : !s.has(token);
        if (shouldHave) s.add(token);
        else s.delete(token);
        this._sync(s);
        return shouldHave;
      },
      contains(token) {
        return this._set().has(token);
      },
    };
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val ?? '');
    this._textContent = this._innerHTML.replace(/<[^>]*>/g, '');
    this.ownerDocument._parseDynamicFragment(this, this._innerHTML);
  }

  get textContent() {
    return this._textContent || this._innerHTML.replace(/<[^>]*>/g, '');
  }

  set textContent(val) {
    const raw = String(val ?? '');
    this._textContent = raw;
    this._innerHTML = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    this.children = [];
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    if (child.id) this.ownerDocument.elementsById.set(child.id, child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
    this.parentElement = null;
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  dispatchEvent(event) {
    const e = {
      target: this,
      currentTarget: this,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      ...event,
    };
    const fns = this.listeners.get(e.type) || [];
    for (const fn of fns) fn(e);
    if (e.bubbles !== false && this.parentElement) {
      this.parentElement.dispatchEvent(e);
    } else if (e.bubbles !== false && this.ownerDocument) {
      this.ownerDocument._dispatchDocumentEvent(e);
    }
    return !e.defaultPrevented;
  }

  click() {
    if (this.disabled) return;
    if (this.tagName === 'INPUT' && this.attributes.get('type') === 'checkbox') {
      this.checked = !this.checked;
    }
    this.dispatchEvent({ type: 'click', bubbles: true });
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  reset() {
    for (const child of this.children) {
      if (child.tagName === 'INPUT' || child.tagName === 'TEXTAREA') {
        child.value = '';
        child.checked = false;
      } else if (child.tagName === 'SELECT') {
        child.value = 'auto';
      }
    }
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (selector === '[data-go]' && curr.dataset && curr.dataset.go) return curr;
      if (selector === '[data-open-id]' && curr.dataset && curr.dataset.openId) return curr;
      if (selector === '[data-metric-action]' && curr.dataset && curr.dataset.metricAction) return curr;
      if (selector === '[data-category-filter]' && curr.dataset && curr.dataset.categoryFilter) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    if (selector === 'input, textarea, select, button') {
      return this.children.find((c) => ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(c.tagName)) || null;
    }
    return this.children[0] || null;
  }
}

class MiniDocument {
  constructor(html) {
    this.elementsById = new Map();
    this.allElements = [];
    this.listeners = new Map();
    this.body = new MiniElement('BODY', this);
    this.activeElement = this.body;
    this._bootstrapFromHTML(html);
  }

  createElement(tag) {
    const el = new MiniElement(tag, this);
    this.allElements.push(el);
    return el;
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }

  querySelector(selector) {
    if (selector === '#page-overview .page-heading .eyebrow') {
      return this._overviewEyebrow;
    }
    if (selector === '.demo-banner') {
      return this._demoBanner;
    }
    if (selector === '.small-select') {
      return this._smallSelect;
    }
    if (selector === '.avatar-button') {
      return this._avatarButton;
    }
    if (selector === '.workspace-switch') {
      return this._workspaceSwitch;
    }
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    if (selector === '.page-section') return this._pageSections;
    if (selector === '.nav-item') return this._navItems;
    if (selector === '.sample-prompt') return this._samplePrompts;
    if (selector === '.close-modal') return this._closeModals;
    if (selector === '.close-detail') return this._closeDetails;
    if (selector === '.modal-backdrop:not(.hidden)') {
      return [this.getElementById('report-modal'), this.getElementById('detail-modal')].filter(
        (el) => el && !el.classList.contains('hidden')
      );
    }
    return [];
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  _dispatchDocumentEvent(event) {
    const fns = this.listeners.get(event.type) || [];
    for (const fn of fns) fn(event);
  }

  dispatchEvent(event) {
    this._dispatchDocumentEvent({ target: this.body, ...event });
  }

  _parseDynamicFragment(parent, html) {
    parent.children = [];
    const openTagRegex = /<([a-z0-9]+)\b([^>]*)>/gi;
    let match;
    while ((match = openTagRegex.exec(html)) !== null) {
      const tag = match[1].toUpperCase();
      const attrStr = match[2] || '';
      const idMatch = attrStr.match(/\bid="([^"]+)"/);
      const openIdMatch = attrStr.match(/\bdata-open-id="([^"]+)"/);
      const goMatch = attrStr.match(/\bdata-go="([^"]+)"/);
      if (!idMatch && !openIdMatch && !goMatch && !['BUTTON', 'TEXTAREA', 'INPUT', 'SELECT'].includes(tag)) {
        continue;
      }
      const el = this.createElement(tag);
      if (idMatch) {
        el.id = idMatch[1];
        this.elementsById.set(el.id, el);
      }
      const classMatch = attrStr.match(/\bclass="([^"]+)"/);
      if (classMatch) el.className = classMatch[1];
      if (openIdMatch) el.dataset.openId = openIdMatch[1];
      if (goMatch) el.dataset.go = goMatch[1];
      parent.appendChild(el);
    }
  }

  _bootstrapFromHTML(html) {
    this._pageSections = [];
    this._navItems = [];
    this._samplePrompts = [];
    this._closeModals = [];
    this._closeDetails = [];

    const overviewEyebrow = this.createElement('DIV');
    overviewEyebrow.className = 'eyebrow';
    this._overviewEyebrow = overviewEyebrow;

    const demoBanner = this.createElement('DIV');
    demoBanner.className = 'demo-banner';
    this._demoBanner = demoBanner;

    const tagMatches = html.matchAll(/<([a-z0-9]+)\b([^>]*)>/gi);
    for (const m of tagMatches) {
      const tag = m[1].toUpperCase();
      const attrs = m[2] || '';
      const idMatch = attrs.match(/\bid="([^"]+)"/);
      const classMatch = attrs.match(/\bclass="([^"]+)"/);
      const dataPageMatch = attrs.match(/\bdata-page="([^"]+)"/);
      const dataSampleMatch = attrs.match(/\bdata-sample="([^"]+)"/);
      const typeMatch = attrs.match(/\btype="([^"]+)"/);

      if (!idMatch && !classMatch && !dataPageMatch && !dataSampleMatch) continue;

      const el = this.createElement(tag);
      if (idMatch) {
        el.id = idMatch[1];
        this.elementsById.set(el.id, el);
      }
      if (classMatch) el.className = classMatch[1];
      if (typeMatch) el.attributes.set('type', typeMatch[1]);
      if (dataPageMatch) el.dataset.page = dataPageMatch[1];
      if (dataSampleMatch) el.dataset.sample = dataSampleMatch[1];

      if (el.classList.contains('page-section')) this._pageSections.push(el);
      if (el.classList.contains('nav-item')) this._navItems.push(el);
      if (el.classList.contains('sample-prompt')) this._samplePrompts.push(el);
      if (el.classList.contains('close-modal')) this._closeModals.push(el);
      if (el.classList.contains('close-detail')) this._closeDetails.push(el);
      if (el.classList.contains('small-select')) this._smallSelect = el;
      if (el.classList.contains('avatar-button')) this._avatarButton = el;
      if (el.classList.contains('workspace-switch')) this._workspaceSwitch = el;
    }

    const reportModal = this.getElementById('report-modal');
    const reportTitle = this.getElementById('report-title');
    const reportForm = this.getElementById('report-form');
    if (reportModal && reportTitle) reportModal.children.push(reportTitle);
    if (reportForm) {
      ['report-title', 'report-description', 'report-location', 'report-category', 'report-safety-risk'].forEach((id) => {
        const field = this.getElementById(id);
        if (field) reportForm.children.push(field);
      });
    }
    const detailModal = this.getElementById('detail-modal');
    const advanceBtn = this.getElementById('advance-status');
    if (detailModal && advanceBtn) detailModal.children.push(advanceBtn);

    ['filter-category', 'filter-status', 'filter-priority'].forEach((id) => {
      const sel = this.getElementById(id);
      if (sel) sel.value = 'all';
    });
    ['triage-category', 'report-category'].forEach((id) => {
      const sel = this.getElementById(id);
      if (sel) sel.value = 'auto';
    });
  }
}

async function runSmokeSuite() {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const htmlRes = await fetch(`${baseUrl}/`);
    assert.equal(htmlRes.status, 200, 'Expected 200 from root page');
    const html = await htmlRes.text();
    const csvCode = await (await fetch(`${baseUrl}/csv.js`)).text();
    const appCode = await (await fetch(`${baseUrl}/app.js`)).text();

    const document = new MiniDocument(html);
    const storage = new Map();
    const localStorage = {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    };

    const windowObj = {
      document,
      localStorage,
      Intl,
      Date,
      Blob,
      URL: {
        createObjectURL: () => 'blob:campusresolve-csv',
        revokeObjectURL: () => {},
      },
      matchMedia: () => ({ matches: true }),
      scrollTo: () => {},
      setTimeout: (fn) => {
        fn();
        return 1;
      },
      clearTimeout: () => {},
      fetch: (url, opts) => {
        const resolved = new URL(url, baseUrl).toString();
        return fetch(resolved, opts);
      },
    };
    windowObj.window = windowObj;
    windowObj.globalThis = windowObj;

    const context = vm.createContext({
      ...windowObj,
      console,
    });

    vm.runInContext(csvCode, context, { filename: 'csv.js' });
    vm.runInContext(appCode, context, { filename: 'app.js' });

    // 1. Dashboard initialization and dynamic date header
    assert.equal(document.getElementById('nav-open-count').textContent, '6');
    assert.equal(document.getElementById('all-count').textContent, '8');
    assert.doesNotMatch(document._overviewEyebrow.innerHTML, /FRIDAY, OCTOBER 23/);
    assert.match(document._overviewEyebrow.innerHTML, /CAMPUS OPERATIONS/);

    // 2. Dialog focus and Escape behavior
    document.getElementById('new-report-top').click();
    assert.equal(document.getElementById('report-modal').classList.contains('hidden'), false);
    assert.equal(document.activeElement, document.getElementById('report-title'));
    document.dispatchEvent({ type: 'keydown', key: 'Escape' });
    assert.equal(document.getElementById('report-modal').classList.contains('hidden'), true);

    // 3. Mobile navigation toggle and Escape close
    document.getElementById('mobile-menu').click();
    assert.equal(document.getElementById('sidebar').classList.contains('open'), true);
    document.dispatchEvent({ type: 'keydown', key: 'Escape' });
    assert.equal(document.getElementById('sidebar').classList.contains('open'), false);

    // 4. Demo triage fallback & XSS-safe handling
    const xssPayload = '<img src=x onerror=alert(1)> Water leaking near room B204 with exposed wire';
    const descInput = document.getElementById('triage-description');
    const locInput = document.getElementById('triage-location');
    const safetyCheckbox = document.getElementById('triage-safety-risk');
    descInput.value = xssPayload;
    locInput.value = 'B-Wing <script>alert(1)</script>';
    safetyCheckbox.checked = true;

    document.getElementById('run-triage').click();
    await new Promise((r) => setTimeout(r, 80));

    const triageResultHtml = document.getElementById('triage-result').innerHTML;
    assert.equal(document.getElementById('model-status').textContent, 'DEMO FALLBACK');
    assert.doesNotMatch(triageResultHtml, /<script>alert\(1\)<\/script>/);
    assert.doesNotMatch(triageResultHtml, /<img src=x/);
    assert.match(triageResultHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(triageResultHtml, /Critical urgency suggested/);

    // 5. Duplicate-result prevention when creating a ticket from triage
    const createBtn = document.getElementById('create-ticket-from-triage');
    assert.ok(createBtn, 'Expected #create-ticket-from-triage button');
    createBtn.click();
    assert.equal(document.getElementById('all-count').textContent, '9');
    assert.equal(createBtn.disabled, true);
    // Attempting to invoke a second click on the same triage recommendation does not create another ticket
    createBtn.disabled = false;
    createBtn.click();
    assert.equal(document.getElementById('all-count').textContent, '9');

    // 6. Filtering in Incident Manager
    const filterStatus = document.getElementById('filter-status');
    filterStatus.value = 'resolved';
    filterStatus.dispatchEvent({ type: 'change', bubbles: false });
    assert.match(document.getElementById('all-table-footer').textContent, /Showing 2 of 9 incidents/);
    document.getElementById('clear-filters').click();
    assert.match(document.getElementById('all-table-footer').textContent, /Showing 9 of 9 incidents/);

    // 7. Reopen-reason workflow on a resolved incident (CR-2044)
    const openBtn = document.createElement('BUTTON');
    openBtn.dataset.openId = 'CR-2044';
    document.body.appendChild(openBtn);
    openBtn.click();
    assert.equal(document.getElementById('detail-modal').classList.contains('hidden'), false);
    assert.match(document.getElementById('advance-status').textContent, /Reopen incident/);

    const reopenInput = document.getElementById('reopen-reason');
    assert.ok(reopenInput, 'Expected #reopen-reason textarea on resolved incident');
    // Short reason should be rejected
    reopenInput.value = 'short';
    document.getElementById('advance-status').click();
    assert.match(document.getElementById('detail-content').innerHTML, /status-resolved/);

    // Valid reason (>= 8 chars) transitions ticket to reopened
    reopenInput.value = 'Projector failed again during morning lecture.';
    document.getElementById('advance-status').click();
    assert.match(document.getElementById('detail-content').innerHTML, /status-reopened/);

    // 8. Activity chart range selector, profile avatar button, and workspace switch
    assert.equal(document.getElementById('week-total').textContent, '42');
    document.querySelector('.small-select').click();
    assert.equal(document.getElementById('week-total').textContent, '80');
    document.querySelector('.avatar-button').click();
    assert.equal(document.getElementById('page-audit').classList.contains('hidden'), false);
    document.querySelector('.workspace-switch').click();
    assert.equal(document.getElementById('page-overview').classList.contains('hidden'), false);

    console.log('Browser smoke suite passed: initialization, focus/Escape, mobile nav, demo triage, XSS escaping, duplicate guard, filters, reopen workflow, and interactive header/chart controls verified.');
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
    await new Promise((resolve) => server.close(resolve));
  }
}

runSmokeSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
