import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPORT_TEXT, reportText, writeWorklist, LANGS } from '../src/index.js';

const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(' ');

test('report text: every phrase has all eight translations and keeps its placeholders', () => {
  for (const [name, cat] of Object.entries(REPORT_TEXT)) for (const [en, list] of Object.entries(cat)) {
    assert.equal(list.length, 8, `${name}: ${en}`);
    for (const s of list) { assert.ok(typeof s === 'string' && s.trim(), `${name}: ${en} has an empty translation`); if (name !== 'columns') assert.equal(ph(s), ph(en), `${name}: ${en} -> ${s}`); assert.doesNotMatch(s, /[<>]/, `${name}: ${en}`); }
  }
});

test('report text: dates and numbers in a heading are carried into the translation', () => {
  const de = reportText('de'), ja = reportText('ja');
  assert.equal(de.title('Freight claims as of 2026-11-16'), 'Frachtschäden, Stand 2026-11-16');
  assert.equal(de.title('Open loads at 2026-11-16 10:00'), 'Offene Ladungen, Stand 2026-11-16 10:00');
  assert.equal(ja.page('All rows (12)'), '全行（12）');
  assert.match(de.section('Fuel tables on a 1000 linehaul, 500-mile load'), /1000 .* 500 Meilen/);
});

test('report text: English is untouched, an unknown phrase or column stays English, a regional tag falls back to its language', () => {
  const en = reportText('en');
  assert.equal(en.english, true); assert.equal(en.title('Freight bill audit'), 'Freight bill audit'); assert.equal(en.column('invoice_number'), 'invoice number');
  const fr = reportText('fr-CA');
  assert.equal(fr.lang, 'fr'); assert.equal(fr.title('A report nobody translated'), 'A report nobody translated'); assert.equal(fr.column('some_new_column'), 'some new column');
  assert.equal(fr.column('carrier'), 'Transporteur'); assert.equal(fr.column('otd_pct', 'On-time delivery %'), 'Livraisons à l’heure %');
  assert.equal(reportText('xx').english, true);
  assert.equal(reportText('constructor').title('toString'), 'toString');
});

test('worklist: the page follows the language, the CSV does not, and a translated page says what is still English', () => {
  const real = (lang) => { const dir = mkdtempSync(join(tmpdir(), 'wl-')); const ctx = { lang, root: dir, outDir: () => dir, writeFile: (d, name, text) => { const f = join(d, name); writeFileSync(f, text); return f; } }; const w = writeWorklist(ctx, 'out', 'x', { title: 'Freight bill audit', rows: [{ carrier: 'Ridgeline <b>', amount: 5 }], columns: ['carrier', 'amount'], sections: [{ title: 'By carrier', rows: [], columns: ['carrier'] }], limits: ['A limit.'] }); return { html: readFileSync(join(dir, 'x.html'), 'utf8'), csv: readFileSync(join(dir, 'x.csv'), 'utf8'), sha: w.output_sha256 }; };
  const en = real('en'), ko = real('ko');
  assert.equal(ko.csv, en.csv);
  assert.match(en.html, /<html lang="en"/); assert.match(en.html, /<h1>Freight bill audit<\/h1>/); assert.match(en.html, /<th[^>]*>carrier<\/th>/); assert.doesNotMatch(en.html, /translated by Claude/);
  assert.match(ko.html, /<html lang="ko"/); assert.match(ko.html, /<h1>운임 청구서 감사<\/h1>/); assert.match(ko.html, /<h2>운송사별<\/h2>/); assert.match(ko.html, /<th[^>]*>운송사<\/th><th[^>]*>금액<\/th>/); assert.match(ko.html, /<h2>한계<\/h2>/);
  assert.match(ko.html, /Claude가 번역/); assert.match(ko.html, /Ridgeline &lt;b&gt;/); assert.match(ko.html, /A limit\./);
  for (const l of LANGS) assert.match(real(l).html, /<h1>/);
});
