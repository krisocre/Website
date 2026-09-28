const fs = require('node:fs');
const path = require('node:path');
const D = require('./blog/research-data.cjs');
const assets = path.join(__dirname,'blog','assets');
const data = path.join(__dirname,'blog','data');
const csvCell = value => value == null ? '' : /[,"\n]/.test(String(value)) ? '"'+String(value).replaceAll('"','""')+'"' : String(value);
function csv(name,headers,rows){fs.writeFileSync(path.join(data,name),[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\n')+'\n','utf8');}
const percent = (a,b) => (a/b*100).toFixed(4);
csv('yelp-reclassification-2012-2020.csv',['start_year','end_year','start_state','end_state','count','start_state_total','conditional_percent_calculated','source_table','source_url'],D.transitions.map(r=>[2012,2020,r.from,r.to,r.count,D.yelp.starting(r.from),percent(r.count,D.yelp.starting(r.from)),'II',D.sources.yelpPaper]));
csv('yelp-longitudinal-cohorts.csv',['cohort','window_months','review_observations','unique_reviews','businesses','crawls','reclassified_percent_reported','source_table','source_url'],D.cohorts.map(r=>[r.name,r.months,r.observations,r.unique,r.businesses,r.crawls,r.reclassified,'I',D.sources.yelpPaper]));
csv('tripadvisor-review-fraud-2018-2024.csv',['activity_year','publication_year','review_submissions_millions','submission_qualifier','detected_fraud_percent','percent_basis','fraud_count_millions_used_for_calculation','detected_fraud_prepublication_percent','source_url'],D.tripadvisor.map(r=>[r.year,r.report,r.reviews,r.qualifier,r.year===2024?r.fakePercent.toFixed(6):r.fakePercent,r.basis,r.year===2024?2.7:null,r.blockedPercent,r.source]));
csv('tripadvisor-screening-2024.csv',['activity_year','measure','percent_reported','scope','additivity_note','source_url'],[
  ...D.screening.map(r=>[2024,r.label,r.percent,'initial automated outcome','initial outcomes total 100 percent',D.sources.ta2024]),
  [2024,'Human-moderated reviews',13.5,'before or after posting','separate process measure; do not add to initial outcomes',D.sources.ta2024]
]);
csv('tripadvisor-source-differences.csv',['activity_year','first_value_percent','first_source_url','other_value_percent','other_source_url','other_minus_first_percentage_points','interpretation'],[
  [2018,2.1,D.sources.ta2018,2.4,D.sources.ta2023Full,'0.30','original report and later retrospective disagree; cause not established'],
  [2022,4.4,D.sources.ta2022,4.37,D.sources.ta2023Full,'-0.03','one-decimal press release versus two-decimal full report']
]);
csv('review-status-tracking-template.csv',['observed_at_iso8601','platform','business_profile_url','review_url','observed_state','visible_review_count','visible_rating','case_reference','moderation_message_received','notes'],[]);
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text = (x,y,s,size=20,extra='') => `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${esc(s)}</text>`;
function svg(name,title,desc,body){
  fs.writeFileSync(path.join(assets,name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="672" viewBox="0 0 1200 672" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc><style>text{font-family:Arial,sans-serif;fill:#17353e}.serif{font-family:Georgia,serif}.muted{fill:#61736e}.white{fill:#fff}.accent{fill:#b56142}</style><rect width="1200" height="672" fill="#f7f3ec"/><rect x="24" y="24" width="6" height="624" fill="#bb6949"/>${text(66,65,'REVIEWREMOVAL / RESEARCH',14,'letter-spacing="2" class="accent"')}${text(66,112,title,37,'class="serif"')}${body}</svg>\n`,'utf8');
}
const Y = D.yelp;
const outgoingPercent = Y.outgoing/Y.starting('Recommended')*100;
const incomingPercent = Y.incoming/Y.starting('Not Recommended')*100;
let body = text(66,153,'Matched reviews present in both 2012 and 2020 snapshots; each row has a separate denominator.',19,'class="muted"');
body += '<rect x="66" y="185" width="17" height="17" fill="#17353e"/>'+text(93,199,'Same state at both endpoints',17)+'<rect x="420" y="185" width="17" height="17" fill="#bb6949"/>'+text(447,199,'Changed state',17);
for(const row of [{y:280,label:'Recommended in 2012',total:Y.starting('Recommended'),changed:Y.outgoing,p:outgoingPercent},{y:440,label:'Not recommended in 2012',total:Y.starting('Not Recommended'),changed:Y.incoming,p:incomingPercent}]){
  const sameW=700*(100-row.p)/100,changedW=700-sameW;
  body+=text(66,row.y-22,row.label,22,'class="serif"')+text(66,row.y+11,`${row.total.toLocaleString('en-CA')} matched reviews`,17,'class="muted"');
  body+=`<rect x="370" y="${row.y-50}" width="${sameW}" height="68" fill="#17353e"/><rect x="${370+sameW}" y="${row.y-50}" width="${changedW}" height="68" fill="#bb6949"/>`;
  body+=text(386,row.y-8,`${(100-row.p).toFixed(2)}% same state`,20,'class="white"');
  body+=text(1070,row.y+55,`${row.changed.toLocaleString('en-CA')} changed (${row.p.toFixed(2)}%)`,20,'text-anchor="end" class="accent"');
}
body+='<path d="M66 552H1134" stroke="#cbd5cf"/>'+text(66,584,'A historical US sample. These are not deletion rates or predictions for Canadian listings.',18,'class="muted"')+text(66,619,'Source: Amos et al., Reviews in Motion (2022), Table II. Percentages calculated by ReviewRemoval.',16,'class="muted"');
svg('yelp-review-transitions','Where did the matched Yelp reviews move?','Endpoint recommendation transitions; changing classification is distinct from deletion.',body);
body=text(66,153,'Selected activity years; denominator is review submissions, not owner complaints.',19,'class="muted"');
for(let tick=0;tick<=10;tick+=2){const y=494-tick*28;body+=`<path d="M130 ${y}H1100" stroke="#d6ddd7"/>`+text(107,y+6,tick+'%',17,'text-anchor="end" class="muted"');}
D.tripadvisor.forEach((r,i)=>{const x=205+i*230,h=r.fakePercent*28;body+=`<rect x="${x}" y="${494-h}" width="135" height="${h}" fill="${r.year===2024?'#f7f3ec':'#17353e'}" stroke="${r.year===2024?'#bb6949':'#17353e'}" stroke-width="${r.year===2024?4:0}"/>`+text(x+67,478-h,(r.year===2024?'≈':'')+r.fakePercent.toFixed(1)+'%',26,'text-anchor="middle" class="serif"')+text(x+67,530,r.year,23,'text-anchor="middle"')+text(x+67,558,r.year===2024?'Calculated ratio':'Reported share',16,'text-anchor="middle" class="muted"');});
body+=text(66,607,'2024: 2.7m ÷ 31.1m ≈ 8.7%. Rounded inputs; detection and definitions can change.',18,'class="muted"')+text(66,637,'Sources: Tripadvisor, 2019/2021/2023/2025. Original 2018: 2.1%; later restatement: 2.4%.',15,'class="muted"');
svg('tripadvisor-fraud-series','Detected review fraud, not removal odds','Published fraud shares for three activity years and an approximate ratio for 2024.',body);
body=text(66,153,'The initial automated split totals 100%. Human moderation is a separate process measure.',19,'class="muted"');
const colors=['#17353e','#bb6949','#7c9790'];let x=66;
D.screening.forEach((r,i)=>{body+=`<rect x="${x}" y="212" width="${1068*r.percent/100}" height="85" fill="${colors[i]}"/>`;x+=1068*r.percent/100;});
body+=text(91,264,'87.8% met automation standards',27,'class="white"');
D.screening.forEach((r,i)=>{const col=66+i*365;body+=`<rect x="${col}" y="329" width="17" height="17" fill="${colors[i]}"/>`+text(col+27,344,r.percent+'%',23)+text(col,382,r.label,18,'class="muted"');});
body+='<rect x="66" y="430" width="1068" height="103" fill="#eaf0ed" stroke="#7c9790" stroke-dasharray="6 5"/>'+text(91,473,'13.5% human moderated',29,'class="serif"')+text(91,508,'Before OR after posting. Do not add this to the initial 100% split.',19,'class="muted"');
body+=text(66,590,'Flagged, rejected and moderated describe processes; they do not all mean “fake”.',18,'class="muted"')+text(66,626,'Source: Tripadvisor, March 18, 2025 release, covering 2024 activity. Diagram by ReviewRemoval.',16,'class="muted"');
svg('tripadvisor-screening-2024','Three initial outcomes, one separate measure','A disjoint initial automated split and a separate human-moderation metric.',body);
console.log('Built 6 research CSVs and 3 source-based SVG charts');
