const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeCellValue, escapeCSVCell, toCSV } = require('../csv');

test('normal text cells are quoted safely', () => {
  assert.equal(escapeCSVCell('CR-2048'), '"CR-2048"');
  assert.equal(escapeCSVCell('A-Wing · Corridor, Floor 2'), '"A-Wing · Corridor, Floor 2"');
});

test('embedded double quotes are doubled per RFC 4180', () => {
  assert.equal(escapeCSVCell('Room "B204" entrance'), '"Room ""B204"" entrance"');
});

test('formula-leading characters are neutralized with a leading apostrophe', () => {
  assert.equal(sanitizeCellValue('=cmd|\' /C calc\'!A0'), "'=cmd|' /C calc'!A0");
  assert.equal(sanitizeCellValue('+SUM(A1:A2)'), "'+SUM(A1:A2)");
  assert.equal(sanitizeCellValue('-1+1'), "'-1+1");
  assert.equal(sanitizeCellValue('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(sanitizeCellValue('  =HYPERLINK("http://evil.example")'), "'  =HYPERLINK(\"http://evil.example\")");
});

test('newlines inside cells are flattened to spaces', () => {
  assert.equal(escapeCSVCell('Line 1\r\nLine 2\nLine 3'), '"Line 1 Line 2 Line 3"');
});

test('toCSV serializes header and rows with CRLF line endings', () => {
  const csv = toCSV(
    ['id', 'title', 'description'],
    [
      { id: 'CR-1', title: 'Normal title', description: '=SUM(1,2)' },
      { id: 'CR-2', title: 'Quoted "text"', description: 'Safe' },
    ]
  );
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"id","title","description"');
  assert.equal(lines[1], '"CR-1","Normal title","\'=SUM(1,2)"');
  assert.equal(lines[2], '"CR-2","Quoted ""text""","Safe"');
});
