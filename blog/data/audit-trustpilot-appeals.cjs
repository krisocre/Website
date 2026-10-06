const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const data = require('./trustpilot-appeals-2025.json');
const total = data.rows.find(r => r.category === 'all_complaints');
const notice = data.rows.find(r => r.category === 'notice_no_action');
const content = data.rows.find(r => r.category === 'content_restriction');
const residual = data.rows.find(r => r.row_origin === 'derived');
for (const r of data.rows) assert.equal(r.complaints, r.upheld + r.partially_reversed + r.reversed, r.category);
for (const field of ['complaints','upheld','partially_reversed','reversed']) {
  assert.equal(total[field], data.rows.filter(r => r.category !== 'all_complaints').reduce((sum,r) => sum+r[field],0));
}
assert.equal(total.complaints,3458);
assert.equal(residual.complaints,46);
assert.equal(residual.reversed,8);
assert.equal(data.separately_reported.decisions_omitted,473);
const pct = (part, denominator) => (part / denominator * 100).toFixed(2);
console.log(JSON.stringify({overall_reversal_share:pct(total.reversed,total.complaints),notice_no_action_reversal_share:pct(notice.reversed,notice.complaints),content_restriction_reversal_share:pct(content.reversed,content.complaints),notice_no_action_share_of_all_complaints:pct(notice.complaints,total.complaints),notice_no_action_share_of_all_reversals:pct(notice.reversed,total.reversed),unallocated_residual:residual,omitted_metric_excluded_from_reconciled_outcomes:data.separately_reported.decisions_omitted},null,2));
