// Source values checked 2026-09-27. Build outputs with build-research-assets.cjs.
const sources = {
  yelpPaper: 'https://plaintextresponse.com/static/papers/conpro22-amos.pdf',
  yelpProject: 'https://sites.google.com/princeton.edu/longitudinal-review-data/',
  yelpHelp: 'https://www.yelp-support.com/article/How-We-Approach-Reviews-at-Yelp?l=en_GB',
  yelp2023: 'https://s24.q4cdn.com/521204325/files/doc_downloads/esg/2024/Trust-Safety-Report-2023-V3.pdf',
  yelpReport: 'https://www.yelp-support.com/article/How-do-I-report-a-review?l=en_US',
  ta2018: 'https://www.tripadvisor.com/TripAdvisorInsights/wp-content/uploads/2019/09/2147_PR_Content_Transparency_Report_6SEP19_US.pdf',
  ta2020: 'https://tripadvisor.mediaroom.com/2021-10-27-Tripadvisor-Content-Moderation-Transparency-Report-Reveals-New-Data-In-Fight-Against-Fake-Reviews',
  ta2022: 'https://tripadvisor.mediaroom.com/2023-04-11-Tripadvisor-report-reveals-strong-growth-in-review-submissions-and-improvement-in-fraud-detection-rates',
  ta2023Full: 'https://tripadvisor.shorthandstories.com/2023-tripadvisor-review-transparency-report/',
  ta2024: 'https://tripadvisor.mediaroom.com/2025-03-18-Tripadvisors-2025-Transparency-Report-reveals-strong-review-submissions-and-improved-fraud-detection',
  taReport: 'https://www.tripadvisor.com/TransparencyReport2025',
  taConcern: 'https://www.tripadvisor.com/business/en-gb/insights/restaurants/resources/bad-review-response-tips',
  canada: 'https://www.ised-isde.canada.ca/site/ised/en/canadian-tourism-sector/sme-profile-2023-tourism-industries-canada',
  bureau: 'https://competition-bureau.canada.ca/en/deceptive-marketing-practices-digest-volume-3'
};
// Table II: only reviews observed in both snapshots; rows are original states.
const transitions = [
  {from:'Recommended',to:'Recommended',count:56048},
  {from:'Recommended',to:'Not Recommended',count:2249},
  {from:'Not Recommended',to:'Recommended',count:3566},
  {from:'Not Recommended',to:'Not Recommended',count:5059}
];
const cohorts = [
  {name:'EYG',months:96,period:'8 years',observations:263308,unique:196383,businesses:201,crawls:2,reclassified:8.69},
  {name:'CHI',months:11,period:'11 months',observations:10485007,unique:1395870,businesses:5773,crawls:8,reclassified:0.87},
  {name:'UDS',months:4,period:'4 months',observations:1409059,unique:358184,businesses:2829,crawls:4,reclassified:0.54},
  {name:'UIS',months:4,period:'4 months',observations:1145995,unique:292107,businesses:2843,crawls:4,reclassified:0.61}
];
const tripadvisor = [
  {year:2018,report:2019,reviews:66,qualifier:'more than',fakePercent:2.1,basis:'reported percentage',blockedPercent:73,source:sources.ta2018},
  {year:2020,report:2021,reviews:26,qualifier:'more than',fakePercent:3.6,basis:'reported percentage',blockedPercent:67.1,source:sources.ta2020},
  {year:2022,report:2023,reviews:30.2,qualifier:'more than',fakePercent:4.4,basis:'reported percentage',blockedPercent:72,source:sources.ta2022},
  {year:2024,report:2025,reviews:31.1,qualifier:'rounded',fakePercent:2.7/31.1*100,basis:'calculation from rounded counts',blockedPercent:null,source:sources.ta2024}
];
const screening = [{label:'Met automation standards',percent:87.8},{label:'Rejected by technology',percent:7.3},{label:'Flagged for further review',percent:4.9}];
const total = transitions.reduce((n,r)=>n+r.count,0);
const switched = transitions.filter(r=>r.from!==r.to).reduce((n,r)=>n+r.count,0);
const incoming = transitions.find(r=>r.from==='Not Recommended' && r.to==='Recommended').count;
const outgoing = transitions.find(r=>r.from==='Recommended' && r.to==='Not Recommended').count;
const starting = state => transitions.filter(r=>r.from===state).reduce((n,r)=>n+r.count,0);
module.exports = {sources,transitions,cohorts,tripadvisor,screening,yelp:{total,switched,incoming,outgoing,net:incoming-outgoing,starting}};
