// Search and social metadata shared by the static page and production URL builds.
const metadata={
 'index.html':{title:'Google Review Removal Canada – Free Assessment',description:'Professional Google review removal help across Canada. Free assessment. CAD $50 upfront per approved review, plus $125 only for each review removed.'},
 'suppression-avis-google.html':{title:'Suppression d’avis Google au Canada – Évaluation gratuite',description:'Aide à la suppression d’avis Google au Canada, dont le Québec. Évaluation gratuite. 50 $ CA au départ par avis accepté, puis 125 $ CA par avis retiré.'},
 'about.html':{title:'About ReviewRemoval | Managed Google Review Removal',description:'See what ReviewRemoval handles for Canadian businesses, from a free assessment to evidence preparation, Google reporting and eligible follow-up.'},
 'review-removal-canada.html':{title:'Google Review Removal Across Canada | Service Areas',description:'Get remote Google review removal help in Toronto, Montréal, Vancouver and across Canada. See what to send if you manage reviews for multiple locations.'},
 'google-review-removal-cost-canada.html':{title:'Google Review Removal Cost in Canada | $50 Upfront',description:'ReviewRemoval charges CAD $50 upfront per approved review, plus $125 per successful removal. Compare totals when all, some or none are removed.'},
 'google-review-removal-process.html':{title:'How Paid Google Review Removal Works | ReviewRemoval',description:'Hire ReviewRemoval to assess and report Google reviews in Canada. See what we handle, how you approve paid work and what updates to expect.'},
 'remove-fake-google-reviews.html':{title:'How to Remove Fake Google Reviews in Canada',description:'See what supports a fake Google review report, how to document a review attack and when to request a free assessment from ReviewRemoval.'},
 'google-review-removal-policy.html':{title:'Google Review Removal Policies: What Qualifies',description:'Use a policy and evidence matrix to assess suspected fake, abusive or off-topic Google reviews. Compare reporting routes and examples of valid criticism.'},
 'google-review-removal-checker.html':{title:'Google Review Removal Checker | Free Policy Check',description:'Check a Google review for possible policy issues. Start with the wording or a link, answer up to two questions and get an evidence checklist.'},
 'google-review-case-tracker.html':{title:'Google Review Case Tracker | Free CSV Export',description:'Track Google review reports, appeal dates and outcomes in your browser. Export a CSV to keep records for several reviews or business locations.'},
 'blog/index.html':{title:'Google Review Removal Guides, Tools & Research',description:'Find Google review pricing, reporting and appeal guides for Canadian businesses. Check review eligibility, prepare evidence and explore original research.'},
 'blog/report-google-review-appeal.html':{title:'Google Review Removal Status & One-Time Appeals',description:'Check a Google review report, learn what “appeal eligible” means and prepare a one-time appeal. Includes a case tracker for multiple reviews.'},
 'blog/review-removal-questions-answered.html':{title:'Google Review Removal FAQ | Fees & Getting Started',description:'See what to send, what the free assessment covers and when ReviewRemoval’s CAD $50 upfront and $125 success fees apply.'},
 'blog/review-report-evidence-checklist.html':{title:'Google Review Report Evidence | 5-Step Checklist',description:'Prepare evidence for a Google review report or appeal. Use a five-step checklist and see what records help support a specific policy concern.'},
 'blog/google-reviews-not-showing.html':{title:'Google Reviews Not Showing? Find Out Why',description:'Check whether a Google review is delayed, posted on another listing or removed. Learn which details to verify and when to check a report’s status.'},
 'blog/google-review-removal-rating-impact-study.html':{title:'Google Review Removal | Star Rating Calculator',description:'Could removing a one-star Google review change your rating? Calculate a possible range and explore 1,625 modelled scenarios, charts and open data.'},
 'blog/google-review-removal-denominator-audit.html':{title:'Google Review Removal Statistics | 2024–2025 Data',description:'Compare five Google review removal reasons using the same denominator. Download the corrected 2024–2025 dataset and inspect 13 original comparisons.'},
 'blog/google-review-removal-appeals-data.html':{title:'Google Maps Appeals Data | 2026 Reversal Rates',description:'Compare Google Maps reversal rates by appeal direction. Explore 74 source cells, three charts and open EU-focused data, with limits for Canadian businesses.'},
 'blog/google-review-moderation-2019-2025.html':{title:'Google Maps Review Moderation Data, 2019–2025',description:'Compare seven years of Google Maps review moderation data. See original charts, download the CSV and learn how Google counts blocked or removed reviews.'},
 'blog/canadian-tourism-google-reviews-2023.html':{title:'Google Reviews in Canadian Tourism | 2023 Data',description:'Google Reviews activity reached 63.8% for tourism SMEs versus 47.0% across industries in the 2023 data. View the ISED source, chart and CSV.'},
 'blog/google-review-risk-score-denominator-study.html':{title:'Google Review Risk Scores | Limits of Deletion Data',description:'See why deleted reviews can’t reveal a Google profile’s overall risk. Explore six mathematical models, three charts and downloadable research data.'},
 'blog/google-review-removal-time-data.html':{title:'Google Review Removal Times | 2026 Notice Data',description:'An audit of 2,800 published Google Maps legal-notice cells shows what median processing times can tell us. See charts and download the data.'},
 'blog/google-review-removal-local-ranking-study.html':{title:'Does Google Review Removal Improve Rankings?',description:'See why a higher star rating and better Maps visibility are different outcomes. Explore data and charts from 1,571 listings across six U.S. metros.'},
 'blog/google-reviews-without-text-data-study.html':{title:'Google Reviews Without Text | 516,281-Record Study',description:'In a historical Alaska archive, 43.2% of cleaned Google review records lacked text. See how a text-only filter changes the sample and download the data.'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metadataFor(file){ return metadata[file]; }


function applyPositioning(file,html){
 const m=metadataFor(file);
 if(!m)return html;
 const end=html.indexOf('</head>');
 if(end<0)throw Error('Missing head: '+file);
 let head=html.slice(0,end);
 head=head.replace(/<title>[^<]*<\/title>/,()=>'<title>'+esc(m.title)+'</title>');
 for(const key of ['description','og:title','og:description','twitter:title','twitter:description']){
  const value=key.endsWith('title')?m.title:m.description;
  head=head.replace(new RegExp('(<meta (?:name|property)="'+key+'" content=")[^"]*','g'),(_,prefix)=>prefix+esc(value));
 }
 head=head.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,text)=>{
  const data=JSON.parse(text), old=JSON.stringify(data);
  function visit(node){
   if(!node||typeof node!=='object')return;
   if(node['@type']==='Organization'&&node.name==='ReviewRemoval')node.description='Google review removal assistance for businesses across Canada.';
   if(['WebPage','AboutPage'].includes(node['@type'])){
    node.name=m.title;node.description=m.description;
   }else if(['CollectionPage','Article','BlogPosting'].includes(node['@type'])){
    node.description=m.description;
   }
   if(file==='index.html'&&node['@type']==='Service')node.description='Professional assistance assessing, preparing and managing reports about Google reviews that may violate policy, for businesses across Canada.';
   if(file==='review-removal-canada.html'&&node['@type']==='Service'){
    node.name='Google review removal service across Canada';node.serviceType='Google review removal assistance';node.description=m.description;
   }
   for(const value of Object.values(node))if(value&&typeof value==='object')visit(value);
  }
  visit(data);
  return old===JSON.stringify(data)?tag:'<script type="application/ld+json">'+JSON.stringify(data).replaceAll('<','\\u003c')+'</script>';
 });
 return head+html.slice(end);
}
module.exports={applyPositioning,metadataFor};
if(require.main===module){
 const fs=require('node:fs');
 const path=require('node:path');
 for(const file of Object.keys(metadata)){
  const location=path.join(__dirname,file),before=fs.readFileSync(location,'utf8');
  const after=applyPositioning(file,before);
  if(after!==before)fs.writeFileSync(location,after,'utf8');
 }
}
