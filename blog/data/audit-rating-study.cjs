// Independent histogram enumeration checks the analytical interval bounds.
const assert = require('node:assert/strict');
const D = require('./rating-removal-sensitivity-2026.json');
const M = require('./rating-model.js');
const round = (sum,n) => Math.floor((sum / n) * 10 + 0.5 + 1e-10);
let checked=0;
for (let n=2;n<=9;n++) {
  const groups=new Map();
  function histogram(star,left,parts) {
    if (star===5) {
      const h=[...parts,left];
      const sum=h.reduce((a,c,i)=>a+c*(i+1),0),d=round(sum,n);
      for(let v=1;v<=5;v++) for(let k=1;k<=Math.min(h[v-1],n-1);k++) {
        const key=`${d}/${k}/${v}`;
        if (!groups.has(key)) groups.set(key,[]);
        groups.get(key).push(sum);
      }
      return;
    }
    for(let i=0;i<=left;i++) histogram(star+1,left-i,[...parts,i]);
  }
  histogram(1,n,[]);
  for(let d=10;d<=50;d++) for(let k=1;k<n;k++) for(let v=1;v<=5;v++) {
    const sums=groups.get(`${d}/${k}/${v}`),r=M.bounds(n,d,k,v);
    if(!sums) assert.equal(r,null);
    else {
      assert.ok(r); assert.equal(r.minTotal,Math.min(...sums)); assert.equal(r.maxTotal,Math.max(...sums));
      assert.equal(new Set(sums).size,r.attainableTotals);
      assert.equal(r.minDisplay,round(r.minTotal-k*v,n-k));
      assert.equal(r.maxDisplay,round(r.maxTotal-k*v,n-k));
    }
    checked++;
  }
}
assert.equal(D.rows.length,1625);
assert.equal(D.summary.feasible+D.summary.infeasible,D.rows.length);
assert.equal(Object.values(D.summary.classification).reduce((a,b)=>a+b,0),D.summary.feasible);
for (const key of ['all','some','none']) assert.equal(D.summary.classification[key],D.rows.filter(r=>r.feasible && r.higher_display===key).length);
for(const row of D.rows) {
  const r=row.one_star_removals<row.reviews?M.bounds(row.reviews,Math.round(row.displayed_rating*10),row.one_star_removals,1):null;
  assert.equal(row.feasible,!!r);
  assert.equal(row.higher_display,r?.higherDisplay??'infeasible');
  if(r) {
    assert.ok(r.minAfter>=r.minBefore && r.maxAfter>=r.maxBefore);
    assert.equal(row.min_star_total,r.minTotal); assert.equal(row.max_star_total,r.maxTotal);
    assert.equal(row.attainable_star_totals,r.attainableTotals);
    assert.equal(row.min_average_after,r.minAfter); assert.equal(row.max_average_after,r.maxAfter);
    assert.equal(row.min_display_after,r.minDisplay/10); assert.equal(row.max_display_after,r.maxDisplay/10);
  }
}
assert.equal(M.bounds(100,44,1,1).minDisplay,44);
assert.equal(M.bounds(100,44,1,1).maxDisplay,45);
assert.equal(M.bounds(20,44,1,1).minDisplay,45);
assert.equal(M.bounds(10,49,1,1),null);
assert.equal(M.bounds(20,44,1,4).higherDisplay,'none');
const hundred=M.bounds(100,44,1,1);
assert.equal(9*100-2*hundred.maxTotal,12);
assert.equal(9*100-2*hundred.minTotal,30);
assert.equal(Math.ceil((89*100-20*hundred.maxTotal)/11),2);
assert.equal(Math.ceil((89*100-20*hundred.minTotal)/11),19);
assert.throws(()=>M.bounds(10,44,10,1),RangeError);
console.log(`PASS: ${checked.toLocaleString()} histogram-based bound checks and all ${D.rows.length} dataset rows`);
