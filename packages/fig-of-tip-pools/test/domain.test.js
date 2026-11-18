// Tip pool and tip credit: shares, points, managers, shortfalls and state settings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tipPools, DEFAULTS } from '../src/index.js';

const tc = (employee, role, hours, rate, card = 0, cash = 0, day = '2026-11-02') => ({ employee, role, hours, rate, card_tips: card, cash_tips: cash, clock_in: `${day}T17:00` });
const who = (r, e, week = '2026-11-02') => r.items.find((i) => i.employee === e && i.week === week);

test('the pool is split by hours times role points', () => {
  const r = tipPools({ timecards: [tc('A', 'Server', 10, 2.13, 300, 10), tc('B', 'Busser', 10, 8)] }, { ...DEFAULTS, role_points: { Busser: 0.5 } });
  assert.equal(who(r, 'A').pool_share, 200); assert.equal(who(r, 'B').pool_share, 100);
});

test('tips on a manager\'s own timecard go into the pool and are flagged', () => {
  const r = tipPools({ timecards: [tc('A', 'Server', 10, 2.13, 100, 10), tc('M', 'Manager', 10, 20, 50)] }, DEFAULTS);
  assert.equal(who(r, 'A').pool_share, 150); assert.equal(who(r, 'M').findings[0].code, 'manager_kept_tips');
});

test('cash wage plus tips under the minimum gives a makeup amount', () => {
  const r = tipPools({ timecards: [tc('A', 'Server', 10, 2.13, 20, 0)] }, DEFAULTS);
  const f = who(r, 'A').findings.find((x) => x.code === 'tip_credit_shortfall');
  assert.equal(who(r, 'A').effective_hourly, 4.13); assert.equal(f.amount, 31.2);
});

test('weeks are kept apart: a good week does not cover a slow one', () => {
  const r = tipPools({ timecards: [tc('A', 'Server', 10, 2.13, 500, 0), tc('A', 'Server', 10, 2.13, 10, 0, '2026-11-10')] }, DEFAULTS);
  assert.equal(who(r, 'A').status, 'watch'); assert.equal(who(r, 'A', '2026-11-09').status, 'flag');
});

test('a state with no tip credit flags any tipped wage under the full minimum', () => {
  const r = tipPools({ timecards: [tc('A', 'Server', 10, 5, 500, 50)] }, { ...DEFAULTS, full_min_wage: 16, tip_credit_allowed: false });
  assert.equal(who(r, 'A').findings[0].code, 'tip_credit_not_allowed'); assert.equal(who(r, 'A').makeup_owed, 110);
});

test('a cash wage under the tipped minimum is flagged even when tips are high', () => {
  const r = tipPools({ timecards: [tc('A', 'Host', 10, 2, 500, 50)] }, DEFAULTS);
  assert.equal(who(r, 'A').findings[0].code, 'below_cash_wage');
});
