const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const D=require('./google-removal-denominator-audit-2026.json');
const input=require('./google-removal-source-values-2026.json');
const current=D.rows.filter(r=>r.source_kind==='current_snapshot');
const row=(year,metric)=>current.find(r=>r.year===year&&r.metric===metric);
assert.equal(D.rows.length,34);assert.equal(D.comparisons.length,13);assert.equal(current.length,26);
assert.equal(new Set(D.rows.map(r=>r.record_id)).size,34);
for(const [kind,count] of [['superseded_value',3],['correction_notice_value',3],['announcement_threshold',2]])assert.equal(D.rows.filter(r=>r.source_kind===kind).length,count);
const golden={2024:{reviews_published:999000000,reviews_removed:245000000,media_published:752000000,media_removed:169000000,edits_published:83000000,edits_removed:82000000,accounts_restricted:949000,profiles_removed:12000000},2025:{reviews_published:1140000000,reviews_removed:292000000,media_published:827000000,media_removed:159000000,edits_published:80000000,edits_removed:79000000,accounts_restricted:782000,profiles_removed:13000000}};
for(const [year,metrics] of Object.entries(golden))for(const [metric,value] of Object.entries(metrics))assert.equal(row(Number(year),metric).value,value);
for(const year of [2024,2025]){
 for(const metric of ['accounts_restricted','profiles_removed']){assert.equal(row(year,metric).snapshot_status_date,null);assert.equal(row(year,metric).population_time_basis,'enforcement_actions_during_selected_year');}
 const harm=row(year,'reason_harm');assert.equal(harm.display,'<0.1%');assert.equal(harm.operator,'lt');
 const rates=current.filter(r=>r.year===year&&r.unit==='percent');assert.equal(rates.length,5);
 for(const rate of rates)assert.equal(rate.denominator,'all_reviews_contributed');
}
assert.equal(row(2024,'reason_fake_or_misleading').value,15.1);assert.equal(row(2025,'reason_fake_or_misleading').value,15.4);
for(const c of D.comparisons){
 const before=D.rows.find(r=>r.record_id===c.before_record);const after=D.rows.find(r=>r.record_id===c.after_record);
 assert.equal(before.year,2024);assert.equal(after.year,2025);assert.equal(before.metric,after.metric);
 assert.equal(before.source_kind,'current_snapshot');assert.equal(after.source_kind,'current_snapshot');
 if(c.metric==='reason_harm'){assert.equal(c.nominal_delta,null);assert.equal(c.nominal_relative_change_percent,null);assert.equal(c.per_10000_operator,'lt');assert.equal(c.per_10000_after,10);}
 else{assert.ok(Math.abs(c.nominal_delta-(after.value-before.value))<1e-8);assert.ok(Math.abs(c.nominal_relative_change_percent-(after.value/before.value-1)*100)<1e-10);}
}
assert.equal(D.comparisons.find(c=>c.metric==='reason_fake_or_misleading').nominal_delta,0.3);
assert.equal(D.comparisons.find(c=>c.metric==='reason_fake_or_misleading').per_10000_after,1540);
const prior=D.rows.find(r=>r.metric==='edits_removed'&&r.source_kind==='superseded_value');
assert.equal(prior.value,70000000);assert.ok((79000000-prior.value)>0);assert.ok((79000000-row(2024,'edits_removed').value)<0);
for(const r of D.rows.filter(r=>r.source_kind==='announcement_threshold')){assert.equal(r.operator,'gt');assert.equal(r.denominator,null);}
function parseCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}assert.equal(quoted,false);return rows;}
for(const [file,rows] of [['google-removal-denominator-audit-2026.csv',D.rows],['google-removal-comparisons-2026.csv',D.comparisons]]){
 const [columns,...records]=parseCsv(fs.readFileSync(path.join(__dirname,file),'utf8'));assert.equal(records.length,rows.length);
 records.forEach((cells,i)=>{assert.equal(cells.length,columns.length);columns.forEach((key,j)=>assert.equal(cells[j],rows[i][key]==null?'':String(rows[i][key])));});
}
let checked=0;
for(const y of input.years)for(const section of ['overview','enforcement']){
 const file=path.resolve(__dirname,'../../.seo-private/maps-source',section+'-'+y.year+'.txt');if(!fs.existsSync(file))continue;
 const raw=fs.readFileSync(file);assert.equal(createHash('sha256').update(raw).digest('hex'),y.sources[section].body_text_sha256);
 const text=raw.toString('utf8');const labels={reviews_published:'Total reviews published',media_published:'Total photos and videos published',edits_published:'Total place edits published',reviews_removed:'Total reviews removed',media_removed:'Total photos and videos removed',edits_removed:'Total place edits removed',accounts_restricted:'Total accounts restricted',profiles_removed:'Total business profiles removed'};
 for(const [metric,display] of Object.entries(y.metrics))if((metric.endsWith('_published')?'overview':'enforcement')===section)assert.ok(text.includes(labels[metric]+'\n'+display),metric);
 if(section==='enforcement')for(const [label,display] of Object.entries(y.reasons))assert.ok(text.includes(label+'\t'+display),label);
 checked++;
}
console.log(`PASS: 34 source records, 13 comparisons, CSV parity, correction sign reversal, strict bounds and thresholds; ${checked}/4 local source captures verified.`);
