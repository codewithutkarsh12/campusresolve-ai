(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CampusResolveCSV = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FORMULA_PREFIX = /^[=+\-@\t\r]/;

  function sanitizeCellValue(value) {
    const raw = String(value ?? '').replace(/\r?\n/g, ' ');
    if (FORMULA_PREFIX.test(raw) || FORMULA_PREFIX.test(raw.trimStart())) {
      return `'${raw}`;
    }
    return raw;
  }

  function escapeCSVCell(value) {
    const safe = sanitizeCellValue(value).replace(/"/g, '""');
    return `"${safe}"`;
  }

  function toCSV(headers, records) {
    const cols = Array.isArray(headers) ? headers : [];
    const items = Array.isArray(records) ? records : [];
    const rows = [
      cols.map(escapeCSVCell).join(','),
      ...items.map((record) =>
        cols.map((col) => escapeCSVCell(record && typeof record === 'object' ? record[col] : '')).join(',')
      ),
    ];
    return rows.join('\r\n');
  }

  return {
    sanitizeCellValue,
    escapeCSVCell,
    toCSV,
  };
});
