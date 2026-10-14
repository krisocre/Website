// Run after the original builders and build-google-guides.cjs, before set-live-domain.cjs.
const fs=require('node:fs');
const path=require('node:path');
const guides=require('./google-guides.cjs');
const {guideSection}=require('./build-google-guides.cjs');
const root=__dirname;
function change(file,update){const target=path.join(root,file);const old=fs.readFileSync(target,'utf8');const html=update(old);if(html!==old)fs.writeFileSync(target,html,'utf8');}
function metadata(html,title,description){return html.replace(/<title>[^<]+<\/title>/,`<title>${title}</title>`).replace(/(<meta name="description" content=")[^"]+/,(_,start)=>start+description);}
function addSection(html,prefix,marker,context){
  const pattern=/<section class="google-guides-section section"[\s\S]*?<\/section>/;
  const section=guideSection(prefix,context);
  if(pattern.test(html))html=html.replace(pattern,section);
  else {if(!html.includes(marker))throw new Error('Missing Google section insertion marker '+context);html=html.replace(marker,section+'\n'+marker);}
  const css=`<link rel="stylesheet" href="${prefix}google-guides.css">`;
  if(!html.includes(css))html=html.replace('</head>',css+'\n</head>');return html;
}
change('index.html',html=>{
  html=metadata(html,'Google Review Removal Canada &amp; Toronto | ReviewRemoval','Google review removal for Canadian businesses. Let our team handle assessment, reporting and follow-up. CAD $50 upfront per review, plus $125 if removed.');
  html=html.replace('Google review removal,<br><em>handled for you.</em>','Google review removal<br><em>across Canada.</em>');
  html=html.replace('Send us the review. We assess it, prepare the report and manage the follow-through.','Send us the Google review. Our team assesses the case, prepares the report and handles the follow-through.');
  if(!html.includes('<a href="#service">Google reviews</a>'))html=html.replace('<a href="#pricing">Pricing</a><a href="platforms.html">','<a href="#service">Google reviews</a><a href="#pricing">Pricing</a><a href="platforms.html">');
  html=html.replace('Read the facts behind the reviews.','Google review removal, explained.').replace('Original data analysis, useful rating calculations and practical guides for Canadian business owners.','Practical reporting guidance and original rating research for Canadian businesses managing Google reviews.');
  html=html.replace(/<a href="blog\/trustpilot-appeal-outcomes-2025.html">[\s\S]*?<\/a>/,'<a href="blog/report-google-review-appeal.html"><span>GUIDE / GOOGLE REPORTS</span><strong>Report a review and track your next step</strong><small>Understand status labels and prepare an eligible appeal <span aria-hidden="true">↓</span></small></a>');
  return addSection(html,'','    <section class="home-platforms','home');
});
change('review-removal-canada.html',html=>{
  html=metadata(html,'Google Review Removal Across Canada | Service Areas','Google review removal across Canada: Toronto, Calgary, Montréal, Vancouver and other communities. Remote support, CAD pricing and listing-specific preparation.');
  html=html.replace('Review removal in Canada, <em>handled from the first link.</em>','Google review removal for <em>Canadian businesses.</em>');
  html=html.replace('<h3>Toronto, the GTA and beyond</h3>','<h3>Google review removal in Toronto and Ontario</h3>').replace('<h3>Montréal and Québec communities</h3>','<h3>Google review support in Montréal and Québec</h3>').replace('<h3>Vancouver and the West Coast</h3>','<h3>Google review removal in Vancouver and BC</h3>');
  html=html.replace('<a href="remove-booking-com-reviews.html">Booking.com review support →</a>','<a href="index.html#quote">Get a Google review quote for BC →</a>').replace('Review removal questions from Canadian businesses','Google review removal questions across Canada');
  return addSection(html,'','    <section class="canada-platforms','canada');
});
change('blog/index.html',html=>{
  html=metadata(html,'Google Review Removal Guides &amp; Research | ReviewRemoval','Google review removal guides for Canada: pricing, fake reviews, reporting, appeals and evidence preparation, plus original platform research and useful tools.');
  html=html.replace('Better decisions start with <em>better information.</em>','Google review removal,<br><em>clearly explained.</em>');
  html=html.replace('Canadian and platform-sourced research on review moderation, plus practical guides for business owners. Read the methods, check the citations and use the charts.','Start with Google review pricing, evidence and reporting guidance for Canadian businesses. Explore our original research on Google and other review platforms, with cited data and clear methods.');
  html=html.replace(/<script type="application\/ld\+json">([^<]+)<\/script>/g,(tag,json)=>{
    const schema=JSON.parse(json);if(schema['@type']!=='CollectionPage')return tag;
    schema.name='Google Review Removal Guides and Research';schema.dateModified='2026-10-13';
    const items=schema.mainEntity.itemListElement;const urls=new Set(items.map(i=>i.url));
    for(const guide of guides){const url='https://reviewremoval.ca/'+guide.file;if(!urls.has(url))items.push({'@type':'ListItem',position:items.length+1,name:guide.heading,url});}
    schema.mainEntity.numberOfItems=items.length;return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  });
  return addSection(html,'../','<section class="blog-featured"','blog');
});
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f)];
for(const file of files)change(file,html=>{
  const prefix=file.startsWith('blog/')?'../':'';
  // Give the main Google service a descriptive navigation label.
  html=html.replace('<a href="index.html">Home</a>','<a href="index.html">Google reviews</a>').replace('<a href="../index.html">Home</a>','<a href="../index.html">Google reviews</a>');
  html=html.replace(/(<div class="footer-nav">)([\s\S]*?)(<\/div>)/,(_,start,links,end)=>{
    links=links.replace(/(<a href="(?:\.\.\/)?index\.html">)(?:Google reviews|Home)<\/a>/,'$1Google review removal</a>');
    if(!links.includes('google-review-removal-cost-canada.html'))links+=`<a href="${prefix}google-review-removal-cost-canada.html">Google removal pricing</a><a href="${prefix}google-review-removal-checker.html">Google evidence checker</a>`;
    return start+links+end;
  });
  return html.replaceAll(' | ReviewRemoval | ReviewRemoval',' | ReviewRemoval');
});
for(const file of ['blog/google-review-moderation-2019-2025.html','blog/google-review-removal-rating-impact-study.html'])change(file,html=>{
  const link='<p class="google-practical-links">Working on a specific case? Use the <a href="../google-review-removal-checker.html">Google review evidence checker</a>, check <a href="report-google-review-appeal.html">report and appeal status</a>, or ask our team for <a href="../index.html#quote">Google review removal support in Canada</a>.</p>';
  if(!html.includes('class="google-practical-links"'))html=html.replace('<section class="article-cta">',link+'<section class="article-cta">');return html;
});
console.log('Applied Google-focused homepage, Canadian coverage, resource hub and contextual links.');
