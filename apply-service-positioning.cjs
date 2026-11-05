// Build-time service policy. Never edits blog files, homepage body, forms or runtime assets.
const fs=require('node:fs');
const path=require('node:path');
const discontinued={
 'remove-facebook-reviews.html':'Facebook',
 'remove-trustpilot-reviews.html':'Trustpilot',
 'remove-tripadvisor-reviews.html':'Tripadvisor',
 'remove-glassdoor-reviews.html':'Glassdoor',
 'remove-booking-com-reviews.html':'Booking.com',
 'remove-indeed-reviews.html':'Indeed'
};
const organizationDescription='Google review removal assistance for Canadian businesses, with Yelp review reporting support.';
const contentUpdated=new Set(['platforms.html','about.html','review-removal-canada.html','remove-yelp-reviews.html',...Object.keys(discontinued)]);
const updated='2026-11-05';
const metadata={
 'index.html':{title:'Google Review Removal Service Canada | ReviewRemoval.ca',description:'Professional Google review removal assistance for Canadian businesses. Help reporting fake, spam and policy-violating reviews. Get a free assessment.'},
 'platforms.html':{title:'Google & Yelp Review Removal Canada | ReviewRemoval',description:'Google review removal is our primary service for Canadian businesses, with Yelp support also available. Compare the process, CAD fees and free assessments.'},
 'about.html':{title:'About ReviewRemoval | Google Review Removal Canada',description:'How ReviewRemoval helps Canadian businesses assess and report Google reviews, with Yelp support, clear CAD fees and cited research. Request a free assessment.'},
 'review-removal-canada.html':{title:'Google Review Removal Across Canada | Service Areas',description:'Google review removal assistance across Canada. Remote support for Toronto, Mississauga, Vancouver and other communities, with clear CAD fees.'},
 'remove-yelp-reviews.html':{title:'Yelp Review Removal Assistance Canada | ReviewRemoval',description:'Professional Yelp review reporting support for Canadian businesses. CAD $50 upfront per review, plus $125 if removed. Request a free assessment.'},
 'google-review-removal-cost-canada.html':{title:'Google Review Removal Cost Canada | ReviewRemoval',description:'Google review removal costs in Canada: CAD $50 upfront per review + $125 if removed. Compare free reporting, paid assistance and partial-success examples.'},
 'remove-fake-google-reviews.html':{title:'Remove Fake Google Reviews in Canada | ReviewRemoval',description:'How Canadian businesses can report fake Google reviews, document policy concerns and request professional help. Evidence guidance, without a removal guarantee.'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metadataFor(file){
 const name=discontinued[file];
 return name?{title:`${name} Service No Longer Offered | ReviewRemoval`,description:`ReviewRemoval no longer offers ${name} review removal. Our current services are Google review removal assistance in Canada and Yelp review reporting support.`}:metadata[file];
}
function removeDiscontinuedLinks(html){
 const paths=Object.keys(discontinued).map(s=>s.replaceAll('.','\\.')).join('|');
 const cleaned=html.replace(new RegExp(`<a\\b(?=[^>]*\\bhref="(?:${paths})(?:[?#][^"]*)?")[^>]*>[\\s\\S]*?<\\/a>`,'g'),'');
 return cleaned.replace(/(<div class="wrap related-grid">)([\s\S]*?)(<\/div>)/,(_,start,links,end)=>start+links.replace(/^[ \t]+(?=\r?$)/gm,'')+end);
}
function updateHead(file,head){
 const m=metadataFor(file);
 if(m){
  head=head.replace(/<title>[^<]*<\/title>/,`<title>${esc(m.title)}</title>`);
  for(const key of ['description','og:title','og:description','twitter:title','twitter:description']){
   const value=key.endsWith('title')?m.title:m.description;
   head=head.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`,'g'),(_,start)=>start+esc(value));
  }
 }
 return head.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,json)=>{
  let schema=JSON.parse(json);
  const canonical=head.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const origin=canonical?new URL(canonical).origin:'https://reviewremoval.ca';
  if(discontinued[file]){
   schema={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:m.title,description:m.description,inLanguage:'en-CA',dateModified:updated},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:discontinued[file]+' service availability',item:canonical}]}
   ]};
  }else{
   const walk=node=>{
    if(!node||typeof node!=='object')return;
    if(node['@type']==='Organization'&&node.name==='ReviewRemoval')node.description=organizationDescription;
    if(file==='review-removal-canada.html'&&node['@type']==='Service'){
     node.name='Google review removal service across Canada';node.serviceType='Google review removal assistance';node.description=m.description;
    }
    if(file==='index.html'&&node['@type']==='Service')node.description='Professional assistance assessing, preparing and managing reports about Google reviews that may violate policy, for businesses across Canada.';
    if(m&&['WebPage','AboutPage','CollectionPage','Article'].includes(node['@type'])){
     node.name=m.title;if(node.headline)node.headline=m.title.replace(/ \| ReviewRemoval(?:\.ca)?$/,'');node.description=m.description;
     if(contentUpdated.has(file))node.dateModified=updated;
    }
    if(m&&node['@type']==='ListItem'&&node.item===canonical)node.name=m.title.replace(/ \| ReviewRemoval(?:\.ca)?$/,'');
    if(file==='platforms.html'&&node['@type']==='CollectionPage')node.mainEntity={'@type':'ItemList',name:'Current review removal services',numberOfItems:2,itemListElement:[
     {'@type':'ListItem',position:1,name:'Google review removal assistance in Canada',url:origin+'/'},
     {'@type':'ListItem',position:2,name:'Yelp review removal assistance',url:origin+'/remove-yelp-reviews.html'}
    ]};
    if(file==='remove-yelp-reviews.html'&&node['@type']==='Service')node.description=m.description;
    for(const value of Object.values(node))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(walk):walk(value);
   };walk(schema);
   if(file==='remove-yelp-reviews.html'&&schema['@graph']&&!schema['@graph'].some(node=>node['@type']==='WebPage'))schema['@graph'].push({'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:m.title,description:m.description,inLanguage:'en-CA',dateModified:updated,mainEntity:{'@id':canonical+'#service'}});
  }
  return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
 });
}
function retiredBody(file,body){
 if(body.includes('id="legacy-request"'))return body;
 const name=discontinued[file];
 const quote=body.match(/<section class="quote-section\b[\s\S]*?<\/section>/)?.[0];
 if(!quote)throw new Error(`Cannot preserve the existing enquiry form in ${file}`);
 // Only surrounding headings change; the complete form, success state and quote fields survive.
 const legacyQuote=quote.replace(/(<h2 id="quote-title">)[\s\S]*?(<\/h2>)/,`$1Previous ${esc(name)} request$2`)
  .replace('Your next step','Earlier requests only')
  .replace(/<p>Send the page or review link and a few details\.[\s\S]*?<\/p>/,'<p>This retained form is for follow-up on an earlier request, not a new service order. Its existing price fields are historical references; any earlier agreement remains subject to its written terms.</p>');
 const main=`<main id="main">
 <section class="platform-hero" id="top" aria-labelledby="hero-title"><div class="wrap platform-hero-grid"><div class="platform-hero-copy"><p class="breadcrumb"><a href="platforms.html">Current services</a><span aria-hidden="true">/</span>${esc(name)}</p><p class="eyebrow"><span></span> Service availability</p><h1 id="hero-title">${esc(name)} review removal is no longer offered.</h1><p class="platform-hero-lead">ReviewRemoval no longer accepts new ${esc(name)} review removal requests. We specialise in professional Google review removal assistance for Canadian businesses, with Yelp as our only secondary service.</p><div class="hero-actions"><a class="button button-accent" href="/#quote">Google review removal <span aria-hidden="true">↓</span></a><a class="platform-secondary" href="remove-yelp-reviews.html">Yelp review removal →</a></div></div><aside class="case-card" aria-label="Current service availability"><div class="case-card-top"><span>REVIEWREMOVAL / CURRENT SERVICES</span></div><h2>Google first.<br>Yelp support.</h2><p id="process">We assess potential policy violations, organise supporting evidence and help with the applicable reporting process. Each platform decides whether a review is removed; removal is not guaranteed.</p><p>Remote assistance for businesses across Canada. No Google password is needed for an initial assessment.</p></aside></div></section>
 <section class="platform-evidence section" id="legacy-request"><div class="wrap"><h2>Following up on an earlier ${esc(name)} request?</h2><p id="questions">You can use the retained enquiry form below for a previous request. Submitting it does not make this discontinued service available for new orders.</p><span id="pricing"></span><details><summary>Open the previous-request enquiry form</summary>${legacyQuote}</details></div></section>
 </main>`;
 body=body.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,main);
 return body.replace(/<header class="site-header">[\s\S]*?<\/header>|<footer class="site-footer">[\s\S]*?<\/footer>/g,part=>part.replaceAll('href="#pricing"','href="/#pricing"').replaceAll('href="#quote"','href="/#quote"'));
}
function updateBody(file,body){
 if(file==='index.html')return body;
 if(discontinued[file])return retiredBody(file,body);
 if(file==='platforms.html'){
  body=removeDiscontinuedLinks(body)
   .replace('Review removal services in Canada.<br><em>Your next step is simple.</em>','Google review removal in Canada.<br><em>Yelp support, too.</em>')
   .replace('Find the platform where the review appears. From Toronto and Ontario to businesses across Canada, our team assesses the details, prepares the report and guides the case from there.','Google review removal is our primary service for Canadian businesses. We also assist with Yelp reviews. Our team assesses potential policy violations, prepares supporting evidence and manages the available reporting process.')
   .replace('For Canadian businesses dealing with reviews across the places customers and candidates look first.','Professional Google review reporting assistance across Canada, with Yelp as our only secondary service.')
   .replace('Same price.<br>Every platform.','Clear fees.<br>Google and Yelp.')
   .replace('You see the fee before agreeing to any work. Each review is priced separately, whichever site it appears on.','You see the fee before agreeing to paid work. Each Google or Yelp review is priced separately; removal is not guaranteed.');
  let number=0;body=body.replace(/<span class="directory-number">\d+<\/span>/g,()=>`<span class="directory-number">0${++number}</span>`);
 }
 if(file==='about.html')body=body
  .replace('ReviewRemoval helps businesses in Toronto, Ontario and across Canada prepare and manage reports about reviews that may breach a platform’s rules.','ReviewRemoval specialises in Google review removal assistance for businesses in Toronto, Ontario and across Canada, with Yelp review reporting as our only secondary service.')
  .replace('Google, Facebook, Yelp, Trustpilot, Tripadvisor, Booking.com, Glassdoor and Indeed each apply their own policies.','Google and Yelp each apply their own policies and make their own moderation decisions.');
 if(file==='review-removal-canada.html'){
  body=body.replace('One service.<br>Eight review platforms.','Google review removal.<br>Yelp support, too.')
   .replace('A review on a Toronto Google Business Profile and one on a Vancouver property listing require different platform processes.','A Google review on a Toronto Business Profile and a Yelp review about a Vancouver business require different platform processes.')
   .replace('Compare the eight platforms','Compare Google and Yelp support')
   .replace('Businesses in Vancouver, Surrey, Victoria and Kelowna may need to distinguish a Google review from a Tripadvisor or Booking.com guest review. Send the URL for the platform where the post actually appears.','Businesses in Vancouver, Surrey, Victoria and Kelowna can request Google review removal assistance or Yelp review reporting support. Send the exact public review and business listing URL.')
   .replace('<a href="remove-tripadvisor-reviews.html">Tripadvisor review support →</a>','<a href="/#quote">Google review support for Atlantic Canada →</a>')
   .replace('Each page explains that platform’s reporting route and gives you the same clear per-review price.','Google review removal is our primary service. Yelp is our only secondary service; each page explains the reporting process and per-review fees.')
   .replace('send the precise Google, Facebook or Yelp business listing.','send the precise Google Business Profile or Yelp business listing.')
   .replace('distinguish a Google post from Tripadvisor or Booking.com guest feedback.','identify the Google review and the exact property listing it concerns.')
   .replace('point us to the specific Indeed or Glassdoor Company Page review.','we assess Google or Yelp business reviews; employee-review platforms are not part of our service.');
  body=removeDiscontinuedLinks(body);
 }
 if(file==='remove-yelp-reviews.html')body=removeDiscontinuedLinks(body).replace('Working across review sites?','Need help with a Google review?');
 return body;
}
function applyPositioning(file,html){
 if(file.startsWith('blog/'))return html;
 const end=html.indexOf('</head>');if(end<0)throw new Error(`Missing head in ${file}`);
 return updateHead(file,html.slice(0,end))+updateBody(file,html.slice(end));
}
module.exports={applyPositioning,metadataFor,discontinued};
if(require.main===module){
 const root=__dirname;
 for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.html')&&name!=='404.html')){
  const location=path.join(root,file),before=fs.readFileSync(location,'utf8'),after=applyPositioning(file,before);
  if(after!==before){fs.writeFileSync(location,after,'utf8');console.log(`Updated ${file}`);}
 }
 // Only pages whose visible service availability changed get a new modification date.
 // Keep every URL, image entry and protected blog entry intact.
 const sitemap=path.join(root,'sitemap.xml');
 const before=fs.readFileSync(sitemap,'utf8');
 const after=before.replace(/<url><loc>([^<]+)<\/loc>(?:<lastmod>[^<]+<\/lastmod>)?/g,(entry,url)=>contentUpdated.has(new URL(url).pathname.slice(1))?`<url><loc>${url}</loc><lastmod>${updated}</lastmod>`:entry);
 if(after!==before)fs.writeFileSync(sitemap,after,'utf8');
}
