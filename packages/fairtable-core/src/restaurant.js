// Restaurant helpers shared by the Fairtable agents. Pure functions, no I/O.
//
// Nothing here is a rule of law, a health code or a vendor's price list. Unit
// conversions are standard kitchen measures; thresholds and targets are settings the
// restaurant changes in its own settings file, and every agent says which it used.
import { foldText, readNumber } from './intl.js';

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const round1 = (n) => Math.round((Number(n) + Number.EPSILON) * 10) / 10;
export const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
export const num = (v) => { if (v === null || v === undefined || v === '') return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null; const n = readNumber(String(v).trim()); return Number.isFinite(n) ? n : null; };
export const sum = (xs) => round2(xs.reduce((s, x) => s + (Number(x) || 0), 0));
export const str = (v) => String(v ?? '').trim();
/** part / whole as a percentage with one decimal, or null when whole is 0 or missing. */
export const pct = (part, whole) => { const w = Number(whole); return w ? round1((Number(part) / w) * 100) : null; };

/** Median of the finite numbers in xs, or null. */
export function median(xs) {
  const v = xs.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : round4((v[m - 1] + v[m]) / 2);
}

/** Group rows by a key function into a Map, keeping order. */
export function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return m;
}

/** Sorted plain object from a Map or object, so results never depend on row order. */
export const sortedObject = (o) => Object.fromEntries([...(o instanceof Map ? o.entries() : Object.entries(o))].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/** Compare two strings the same way on every machine. */
export const cmp = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

// ------------------------------------------------------------------- names ----

/** Key for matching an item, vendor or location name across files: case, accents and punctuation folded. */
export const nameKey = (s) => foldText(str(s)).replace(/\b(the|and)\b/g, ' ').replace(/\s+/g, ' ').trim();

/** Key for a person's name: "Rivera, Ana" and "Ana Rivera" give the same key. */
export function personKey(s) {
  const t = str(s);
  if (!t) return '';
  const m = /^([^,]+),\s*(.+)$/.exec(t);
  const full = m ? `${m[2]} ${m[1]}` : t;
  return foldText(full).split(' ').filter(Boolean).join(' ');
}

/** "Ana Rivera" from "Rivera, Ana"; other names as written. */
export function displayName(s) {
  const t = str(s);
  const m = /^([^,]+),\s*(.+)$/.exec(t);
  return m ? `${m[2].trim()} ${m[1].trim()}` : t;
}

// ------------------------------------------------------------------- dates ----

const DAY = 86400000;
const toMs = (v) => { const s = str(v); if (!s) return NaN; const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`; return Date.parse(iso); };
export const isoDate = (v) => { const t = toMs(v); return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null; };
export function daysBetween(a, b) { const x = toMs(isoDate(a)), y = toMs(isoDate(b)); return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / DAY) : null; }
export function hoursBetween(a, b) { const x = toMs(a), y = toMs(b); return Number.isFinite(x) && Number.isFinite(y) ? Math.round(((y - x) / 3600000) * 100) / 100 : null; }
export function addDays(d, n) { const t = toMs(isoDate(d)); return Number.isFinite(t) ? new Date(t + n * DAY).toISOString().slice(0, 10) : null; }
export const inWindow = (d, from, to) => { const x = isoDate(d); return !!x && (!from || x >= isoDate(from)) && (!to || x <= isoDate(to)); };
/** Monday of the week a date falls in (YYYY-MM-DD). */
export function weekStart(d) { const x = isoDate(d); if (!x) return null; const day = new Date(`${x}T00:00:00Z`).getUTCDay(); return addDays(x, -((day + 6) % 7)); }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayName = (d) => { const x = isoDate(d); return x ? DAYS[new Date(`${x}T00:00:00Z`).getUTCDay()] : null; };

/**
 * Minutes after midnight from "14:30", "2:30 PM", "2026-11-03T14:30", "2026-11-03 14:30:00" or "11/03/2026 2:30 PM".
 * null when no time can be read.
 */
export function minutesOf(v) {
  const s = str(v);
  const m = /(?:^|[T\s])(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*([AaPp][Mm])?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?$/.exec(s) || /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]); const min = Number(m[2]);
  if (m[3]) { const pm = /p/i.test(m[3]); if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12; }
  return h > 23 || min > 59 ? null : h * 60 + min;
}

/** "HH:MM" from minutes after midnight (wraps past 24 hours). */
export const clock = (mins) => { if (mins === null || mins === undefined || !Number.isFinite(mins)) return ''; const m = ((Math.round(mins) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

/**
 * A shift's start and end as minutes from midnight of its date. An end at or before
 * the start is the next day (a bar shift from 18:00 to 02:00 is 8 hours).
 * Returns { start, end, hours } or null.
 */
export function shiftSpan(start, end) {
  const a = minutesOf(start), b0 = minutesOf(end);
  if (a === null || b0 === null) return null;
  let b = b0;
  const da = isoDate(start), db = isoDate(end);
  if (da && db && db > da) b += 1440 * daysBetween(da, db);
  else if (b <= a) b += 1440;
  return { start: a, end: b, hours: round2((b - a) / 60) };
}

/** Which daypart a time falls in, from [{ name, start: "HH:MM", end: "HH:MM" }]; "other" when none. */
export function daypartOf(time, dayparts) {
  const m = minutesOf(time);
  if (m === null) return 'other';
  for (const d of dayparts || []) {
    const a = minutesOf(d.start), b = minutesOf(d.end);
    if (a === null || b === null) continue;
    if (a <= b ? m >= a && m < b : m >= a || m < b) return d.name;
  }
  return 'other';
}

// ------------------------------------------------------------------- units ----

const UNIT_WORDS = {
  g: ['g', 'gr', 'gram', 'grams', 'gramm'], kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms'],
  oz: ['oz', 'ozs', 'ounce', 'ounces', 'wt oz'], lb: ['lb', 'lbs', 'pound', 'pounds', '#'],
  ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'cc'], cl: ['cl', 'centiliter', 'centiliters', 'centilitre'], l: ['l', 'lt', 'ltr', 'liter', 'liters', 'litre', 'litres'],
  floz: ['fl oz', 'floz', 'fl. oz', 'fl.oz', 'fluid ounce', 'fluid ounces'], cup: ['cup', 'cups', 'c'], tbsp: ['tbsp', 'tbs', 'tablespoon', 'tablespoons', 'tbl'],
  tsp: ['tsp', 'teaspoon', 'teaspoons'], pt: ['pt', 'pint', 'pints'], qt: ['qt', 'quart', 'quarts'], gal: ['gal', 'gallon', 'gallons', 'ga'],
  ea: ['ea', 'each', 'ct', 'count', 'pc', 'pcs', 'piece', 'pieces', 'unit', 'units', 'portion', 'portions', 'bottle', 'bottles', 'can', 'cans', 'keg', 'kegs'], dz: ['dz', 'doz', 'dozen'],
};
const UNIT_INDEX = new Map(Object.entries(UNIT_WORDS).flatMap(([u, ws]) => ws.map((w) => [w, u])));
export const UNIT_FACTORS = Object.freeze({
  g: ['weight', 1], kg: ['weight', 1000], oz: ['weight', 28.349523125], lb: ['weight', 453.59237],
  ml: ['volume', 1], cl: ['volume', 10], l: ['volume', 1000], floz: ['volume', 29.5735295625], cup: ['volume', 236.5882365], tbsp: ['volume', 14.78676478125], tsp: ['volume', 4.92892159375], pt: ['volume', 473.176473], qt: ['volume', 946.352946], gal: ['volume', 3785.411784],
  ea: ['count', 1], dz: ['count', 12],
});

/** The canonical unit for a unit word ("LBS" gives "lb", "fl. oz" gives "floz"), or null. */
export function normUnit(u) {
  const s = str(u).toLowerCase().replace(/\s+/g, ' ');
  if (!s) return null;
  return UNIT_INDEX.get(s) || UNIT_INDEX.get(s.replace(/\.$/, '')) || UNIT_INDEX.get(s.replace(/s$/, '')) || null;
}

/** qty in one unit converted to another, or null when they measure different things (weight and volume). */
export function convertQty(qty, from, to) {
  const q = num(qty); const f = UNIT_FACTORS[normUnit(from)]; const t = UNIT_FACTORS[normUnit(to)];
  if (q === null || !f || !t || f[0] !== t[0]) return null;
  return (q * f[1]) / t[1];
}

/**
 * Pack size as distributors print it: "6/5 LB", "4/1 GAL", "1/50#", "12/750ML", "24 CT", "25 LB", "6/#10 CAN".
 * Returns { packs, size, unit, total } (total = packs * size in that unit) or null when it cannot be read.
 */
export function packSize(text) {
  const s = str(text).toUpperCase().replace(/,/g, '.');
  if (!s) return null;
  let m = /^(\d+(?:\.\d+)?)\s*[\/X×]\s*(#\d+\s*)?(\d+(?:\.\d+)?)?\s*([A-Z#. ]+)$/.exec(s);
  if (m && m[2]) { const unit = normUnit(m[4]) || 'ea'; return { packs: Number(m[1]), size: 1, unit, total: Number(m[1]) }; }
  if (m && m[3]) { const unit = normUnit(m[4]); if (!unit) return null; const packs = Number(m[1]); const size = Number(m[3]); return { packs, size, unit, total: packs * size }; }
  m = /^(\d+(?:\.\d+)?)\s*([A-Z#. ]+)$/.exec(s);
  if (m) { const unit = normUnit(m[2]); if (!unit) return null; return { packs: 1, size: Number(m[1]), unit, total: Number(m[1]) }; }
  return null;
}

/** Price of one unit (e.g. per lb) from a case price and its pack size; null when the pack cannot be read or converted. */
export function unitPrice(casePrice, pack, unit) {
  const p = num(casePrice); const k = typeof pack === 'object' && pack ? pack : packSize(pack);
  if (p === null || !k || !k.total) return null;
  const inUnit = convertQty(k.total, k.unit, unit || k.unit);
  return inUnit ? p / inUnit : null;
}

// ------------------------------------------------------------------ status ----

/** Rank used to sort findings and pick an item's status: worst first. */
export const STATUS_RANK = Object.freeze({ flag: 0, review: 1, watch: 2, ok: 3 });
export const worst = (statuses) => statuses.reduce((w, s) => ((STATUS_RANK[s] ?? 3) < (STATUS_RANK[w] ?? 3) ? s : w), 'ok');
