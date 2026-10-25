/* Reproduce the original compilation from source-labelled, checked input values. */
const fs=require('node:fs');
const path=require('node:path');
const input=require('./google-removal-source-values-2026.json');
const root=__dirname;
const article='https://reviewremoval.ca/blog/google-review-removal-denominator-audit.html';
const reasons={'Fake or misleading':'fake_or_misleading','Vandalism or off-topic':'vandalism_or_off_topic','Account restrictions':'account_restriction_reviews','Harm':'harm','Other':'other'};
const rows=[];
const labels={reviews_published:'Reviews published',reviews_removed:'Reviews blocked or removed',media_published:'Photos and videos published',media_removed:'Photos and videos blocked or removed',edits_published:'Place edits published',edits_removed:'Place edits blocked or removed',accounts_restricted:'Contributor accounts restricted',profiles_removed:'Fake or fraudulent Business Profiles blocked or removed'};
function number(text){const m=text.match(/^([0-9.]+)([BMK])$/);if(!m)throw new Error('Unexpected count '+text);return Number(m[1])*({B:1e9,M:1e6,K:1e3}[m[2]]);}
function add(row){rows.push({record_id:'G'+String(rows.length+1).padStart(2,'0'),geography:'Global',checked:input.checked,...row});}
for(const year of input.years){
  for(const [metric,display] of Object.entries(year.metrics)){
    const section=metric.endsWith('_published')?'overview':'enforcement';
    const accountLevel=metric.startsWith('accounts')||metric.startsWith('profiles');
    add({year:year.year,metric,label:labels[metric],source_kind:'current_snapshot',unit:metric.startsWith('accounts')?'accounts':metric.startsWith('profiles')?'profiles':metric.startsWith('edits')?'edits':metric.startsWith('media')?'photos_and_videos':'reviews',display,value:number(display),operator:'displayed_rounded',denominator:null,snapshot_status_date:accountLevel?null:year.snapshot_date,population_time_basis:accountLevel?'enforcement_actions_during_selected_year':'selected_year_contribution_status_at_following_january_31',source_url:year.sources[section].url,notes:'Displayed magnitude; source does not publish an exact unrounded count or rounding algorithm. This is not a case-success probability.'});
  }
  for(const [label,display] of Object.entries(year.reasons)){
    const bounded=display.startsWith('<');const value=Number(display.replace(/[<%]/g,''));
    add({year:year.year,metric:'reason_'+reasons[label],label,source_kind:'current_snapshot',unit:'percent',display,value,operator:bounded?'lt':'displayed_rounded',denominator:'all_reviews_contributed',snapshot_status_date:year.snapshot_date,source_url:year.sources.enforcement.url,notes:bounded?'Strict upper bound, not an observed point or zero.':'Displayed percentage of all contributed reviews, not of removed reviews or business reports.'});
  }
}
for(const correction of input.corrections)for(const version of ['old','new']){
  const display=correction[version];const percent=display.includes('%');
  add({year:correction.year,metric:correction.metric,label:percent?'Harm bound':labels[correction.metric],source_kind:version==='old'?'superseded_value':'correction_notice_value',unit:percent?'percent':'edits',display,value:percent?Number(display.replace(/[<%]/g,'')):number(display),operator:display.startsWith('<')?'lt':'displayed_rounded',denominator:percent?'all_reviews_contributed':null,snapshot_status_date:'2025-01-31',source_url:input.correction_url,notes:'Google identifies this '+(version==='old'?'earlier value as superseded':'replacement in its March 2026 correction notice')+'. Do not mix versions in a change calculation.'});
}
for(const headline of input.headlines)add({year:headline.year,metric:'reviews_blocked_or_removed_headline',label:'Reviews blocked or removed: announcement threshold',source_kind:'announcement_threshold',unit:'reviews',display:headline.value,value:headline.numeric_threshold,operator:headline.comparator,denominator:null,snapshot_status_date:null,source_url:headline.source_url,source_publication_date:headline.publication_date,notes:'A strict lower threshold from a separate announcement. It is not an exact count or the snapshot-table value.'});
const comparisons=[];
const metrics=[...Object.keys(labels),...Object.values(reasons).map(r=>'reason_'+r)];
for(const metric of metrics){
  const before=rows.find(r=>r.metric===metric&&r.year===2024&&r.source_kind==='current_snapshot');
  const after=rows.find(r=>r.metric===metric&&r.year===2025&&r.source_kind==='current_snapshot');
  const bounded=before.operator==='lt'||after.operator==='lt';
  comparisons.push({metric,label:after.label,before_record:before.record_id,after_record:after.record_id,unit:before.unit,before_display:before.display,after_display:after.display,denominator:before.denominator,
    nominal_delta:bounded?null:Number((after.value-before.value).toFixed(10)),nominal_relative_change_percent:bounded?null:(after.value-before.value)/before.value*100,
    per_10000_before:before.unit==='percent'?before.value*100:null,per_10000_after:after.unit==='percent'?after.value*100:null,
    per_10000_operator:before.unit==='percent'?(bounded?'lt':'nominal_display_conversion'):null,
    nominal_delta_unit:before.unit==='percent'?'percentage_points':before.unit,
    interpretation:bounded?'Both source bounds are <0.1%; direction of the actual change is unknown. Converted counts are <10 per illustrative 10,000, not an observed cohort.':before.unit==='percent'?'Difference between displayed rates. Per-10,000 figures are rescaled illustrations, not observed case counts.':'Arithmetic change between rounded display magnitudes, not a change in an exact count or a reporting success rate.'});
}
const data={title:'Google review removal denominator audit: 2024–2025',version:'1.0',published:'2026-10-24',article_url:article,license:'https://creativecommons.org/licenses/by/4.0/',rights_note:'ReviewRemoval original compilation, calculations and figures: CC BY 4.0. Google retains rights in source material.',geographic_scope:'Global source disclosures; no separate Canadian, provincial or city sample.',reporting_period:'2024-01-01/2025-12-31',source_count:rows.length,comparison_count:comparisons.length,source_input:'google-removal-source-values-2026.json',source_provenance:input.years.map(y=>({year:y.year,sources:y.sources})),notes:[
  'Rows preserve source, version, unit, denominator and inequality. Do not add measurements with different units or sum current and superseded values.',
  'Source statuses are assessed as of January 31 of the following year, per Google’s FAQ; current pages can incorporate later reporting corrections.',
  'Current snapshot magnitudes and announcement thresholds are different disclosures. A >240M threshold is not an exact 240M count.',
  'Nominal percentage-point changes use displayed rates. The source does not supply unrounded values, standard errors or its rounding algorithm.',
  'The harm field remains a strict upper bound. Equal displayed bounds do not demonstrate unchanged actual harm volume or share.',
  'No per-reason review count, merchant-report denominator, Canadian success rate or fraud prevalence is inferred.',
  'Per-10,000 conversions illustrate scale. They do not describe a sample of 10,000 actual reviews or submitted reports.'
],rows,comparisons};
fs.writeFileSync(path.join(root,'google-removal-denominator-audit-2026.json'),JSON.stringify(data,null,2)+'\n');
function writeCsv(file,records){const columns=[...new Set(records.flatMap(r=>Object.keys(r)))];const escape=x=>x==null?'':/[",\r\n]/.test(String(x))?'"'+String(x).replaceAll('"','""')+'"':String(x);fs.writeFileSync(path.join(root,file),[columns.join(','),...records.map(r=>columns.map(c=>escape(r[c])).join(','))].join('\r\n')+'\r\n');}
writeCsv('google-removal-denominator-audit-2026.csv',rows);
writeCsv('google-removal-comparisons-2026.csv',comparisons);
const fields={record_id:'Stable source-record reference for this release.',year:'Activity year, not the publication year.',metric:'Normalized metric; identical keys with different source_kind values remain distinct disclosures.',label:'Human-readable measurement.',source_kind:'current_snapshot, superseded_value, correction_notice_value or announcement_threshold.',unit:'Unit; reviews, edits, media, accounts and profiles are not additive.',display:'Source display string, retaining magnitude abbreviations or inequality.',value:'Numeric display magnitude or threshold; interpret with operator, never as an exact count.',operator:'lt = strict upper bound; gt = strict lower threshold; displayed_rounded = reported display magnitude.',denominator:'all_reviews_contributed for source reason percentages; null for counts.',snapshot_status_date:'Content status date per the FAQ. Null for account/profile action counts and announcements, which use a different timing basis.',population_time_basis:'For current count records, distinguishes selected-year content snapshots from account-level actions during the year.',source_url:'Primary source, including selected-year state where applicable.',source_publication_date:'Announcement date when provided.',notes:'Source-version and interpretation limits.',geography:'Reported geography, not a Canadian sample.',checked:'Date source values were checked for this release.'};
fs.writeFileSync(path.join(root,'google-removal-denominator-audit-2026.csv-metadata.json'),JSON.stringify({'@context':'http://www.w3.org/ns/csvw',url:'https://reviewremoval.ca/blog/data/google-removal-denominator-audit-2026.csv','dc:title':data.title,'dc:license':data.license,tableSchema:{columns:Object.keys(rows.reduce((a,r)=>Object.assign(a,r),{})).map(name=>({name,datatype:name==='year'?'integer':name==='value'?'number':'string',null:[''],'dc:description':fields[name]}))}},null,2)+'\n');
fs.writeFileSync(path.join(root,'google-removal-denominator-audit.cff'),'cff-version: 1.2.0\nmessage: "Cite ReviewRemoval for this compilation and Google for underlying disclosures."\ntitle: "Google review removal denominator audit: 2024–2025"\nversion: "1.0"\ndate-released: "2026-10-24"\ntype: dataset\nauthors:\n  - name: "ReviewRemoval"\nurl: "'+article+'"\nlicense: CC-BY-4.0\n');
fs.writeFileSync(path.join(root,'google-removal-denominator-audit.bib'),'@misc{reviewremoval2026denominator,\n  author = {{ReviewRemoval}},\n  title = {Google review removal denominator audit: 2024--2025},\n  year = {2026},\n  month = {October},\n  version = {1.0},\n  url = {'+article+'},\n  note = {Original compilation of 34 source records and 13 comparisons; global Google disclosures, not Canadian case outcomes}\n}\n');
const comparisonFields={
  metric:'Metric key shared with source records; different units must remain separate.',
  label:'Human-readable metric name.',before_record:'2024 source record ID in the source CSV.',after_record:'2025 source record ID in the source CSV.',
  unit:'Measurement unit of the original displays.',before_display:'2024 source display, preserving rounding or bounds.',after_display:'2025 source display, preserving rounding or bounds.',
  denominator:'all_reviews_contributed for reason rates; blank for counts.',nominal_delta:'Difference between displayed magnitudes; blank where bounds do not identify a difference.',
  nominal_relative_change_percent:'100 × (after − before) / before, using displayed values; not an exact event-count change.',
  per_10000_before:'Rescaled 2024 rate per illustrative 10,000 contributions, not an observed sample.',per_10000_after:'Rescaled 2025 rate per illustrative 10,000 contributions, not an observed sample.',
  per_10000_operator:'nominal_display_conversion for rescaling a displayed percentage; lt retains a strict upper bound.',nominal_delta_unit:'Unit of the nominal difference, including percentage_points for rates.',
  interpretation:'Limits on inference for this comparison.'
};
const numericFields=new Set(['nominal_delta','nominal_relative_change_percent','per_10000_before','per_10000_after']);
fs.writeFileSync(path.join(root,'google-removal-comparisons-2026.csv-metadata.json'),JSON.stringify({
  '@context':'http://www.w3.org/ns/csvw',url:'https://reviewremoval.ca/blog/data/google-removal-comparisons-2026.csv',
  'dc:title':data.title+' — 13 comparisons','dc:license':data.license,
  tableSchema:{columns:Object.keys(comparisons[0]).map(name=>({name,datatype:numericFields.has(name)?'number':'string',null:[''],'dc:description':comparisonFields[name]}))}
},null,2)+'\n');
console.log(`Built ${rows.length} source records and ${comparisons.length} comparisons, with CSV, JSON, CSVW and citation files.`);
