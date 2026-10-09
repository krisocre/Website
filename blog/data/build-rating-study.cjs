const fs = require('node:fs');
const path = require('node:path');
const M = require('./rating-model.js');
const counts = [10,20,25,50,75,100,150,200,300,500,1000,2000,5000];
const ratings = Array.from({length:25}, (_, i) => 25 + i);
const removals = [1,2,3,5,10];
const rows = [];
for (const count of counts) for (const rating of ratings) for (const removed of removals) {
  const result = removed < count ? M.bounds(count, rating, removed, 1) : null;
  rows.push({reviews:count,displayed_rating:rating / 10,one_star_removals:removed,feasible:!!result,
    min_star_total:result?.minTotal ?? null,max_star_total:result?.maxTotal ?? null,
    attainable_star_totals:result?.attainableTotals ?? 0,
    min_average_after:result?.minAfter ?? null,max_average_after:result?.maxAfter ?? null,
    min_display_after:result ? result.minDisplay / 10 : null,max_display_after:result ? result.maxDisplay / 10 : null,
    higher_display:result?.higherDisplay ?? 'infeasible'});
}
const feasible = rows.filter(r => r.feasible);
const classification = Object.fromEntries(['all','some','none'].map(key => [key, feasible.filter(r => r.higher_display === key).length]));
const D = {
  title:'Google review removal rating sensitivity: integer-feasible rounded-score scenarios',
  version:'1.0',published:'2026-10-08',license:'https://creativecommons.org/licenses/by/4.0/',
  article_url:'https://reviewremoval.ca/blog/google-review-removal-rating-impact-study.html',
  kind:'Original deterministic mathematical analysis; not observed reviews, a survey or a Canadian business sample',
  assumptions:['Integer ratings from 1 to 5, equally weighted','Nearest-tenth display rounding; exact halves rounded upward (assumed, not confirmed by Google)', 'Only the specified one-star reviews are removed; all other ratings remain unchanged','At least one review remains','Existence of enough one-star reviews is imposed as a feasibility constraint'],
  sources:[
    {url:'https://support.google.com/business/answer/4801187?hl=en',supports:'Google states its review score is the average of all ratings published for a place or business; the exact display-rounding convention is not specified here',accessed:'2026-10-08'},
    {url:'https://support.google.com/business/answer/4596773?hl=en',supports:'Removal eligibility and the review-reporting process',accessed:'2026-10-08'},
    {url:'https://support.google.com/contributionpolicy/answer/7400114?hl=en',supports:'Google Maps content policies',accessed:'2026-10-08'}
  ],
  grid:{review_counts:counts,displayed_ratings:ratings.map(r=>r/10),one_star_removals:removals},
  summary:{inputs:rows.length,feasible:feasible.length,infeasible:rows.length-feasible.length,classification},rows
};
fs.writeFileSync(path.join(__dirname,'rating-removal-sensitivity-2026.json'),JSON.stringify(D,null,2)+'\n');
const headers=Object.keys(rows[0]);
fs.writeFileSync(path.join(__dirname,'rating-removal-sensitivity-2026.csv'),[headers.join(','),...rows.map(r=>headers.map(h=>r[h]===null?'':r[h]).join(','))].join('\n')+'\n');
console.log(JSON.stringify(D.summary));
