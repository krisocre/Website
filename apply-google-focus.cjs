// Run after the original builders and build-google-guides.cjs, before set-live-domain.cjs.
const fs=require('node:fs');
const path=require('node:path');
const {applyPositioning}=require('./apply-service-positioning.cjs');
const guides=require('./google-guides.cjs');
const {guideSection}=require('./build-google-guides.cjs');
const root=__dirname;
function change(file,update){const target=path.join(root,file);const old=fs.readFileSync(target,'utf8');const html=update(old);if(html!==old)fs.writeFileSync(target,html,'utf8');}
function addSection(html,prefix,marker,context){
  const pattern=/<section class="google-guides-section section"[\s\S]*?<\/section>/;
  const section=guideSection(prefix,context);
  if(pattern.test(html))html=html.replace(pattern,section);
  else {if(!html.includes(marker))throw new Error('Missing Google section insertion marker '+context);html=html.replace(marker,section+'\n'+marker);}
  if(context==='home')return html;
  const css=`<link rel="stylesheet" href="${prefix}google-guides.css">`;
  if(!html.includes(css))html=html.replace('</head>',css+'\n</head>');return html;
}
change('index.html',html=>applyPositioning('index.html',html));
change('review-removal-canada.html',html=>{
  if(!html.includes('id="case-tracker"'))html=html.replace('</main>','<section class="section" id="case-tracker"><div class="wrap"><p class="eyebrow"><span></span> For Canadian teams</p><h2>Keep each review and location in the right case.</h2><p>Managing several listings across Canada? Our free tracker keeps the city, province, listing, review link, report reference, decision and current visibility separate. Use one row per review so a result for one location is not applied to another.</p><p><a class="text-link" href="assets/reviewremoval-case-tracker.csv" download>Download the blank case tracker (CSV) ↓</a> · <a class="text-link" href="blog/report-google-review-appeal.html#tracker">Read the tracker instructions</a></p><p>The template contains column headings only, with no client examples or success estimates. Do not put passwords or private customer records in it.</p></div></section></main>');
  html=applyPositioning('review-removal-canada.html',html);
  html=html.replace('Review removal in Canada, <em>handled from the first link.</em>','Google review removal for <em>Canadian businesses.</em>');
  html=html.replace('<h3>Toronto, the GTA and beyond</h3>','<h3>Google review removal in Toronto and Ontario</h3>').replace('<h3>Montréal and Québec communities</h3>','<h3>Google review support in Montréal and Québec</h3>').replace('<h3>Vancouver and the West Coast</h3>','<h3>Google review removal in Vancouver and BC</h3>');
  return addSection(html,'','<section class="section" id="case-tracker"','canada');
});
change('blog/index.html',html=>{
  html=applyPositioning('blog/index.html',html);
  html=html.replace('Better decisions start with <em>better information.</em>','Google review removal,<br><em>clearly explained.</em>');
  html=html.replace('Canadian and platform-sourced research on review moderation, plus practical guides for business owners. Read the methods, check the citations and use the charts.','Start with Google review pricing, evidence and reporting guidance for Canadian businesses. Explore our original research on Google review moderation, with cited data and clear methods.');
  html=html.replace(/<script type="application\/ld\+json">([^<]+)<\/script>/g,(tag,json)=>{
    const schema=JSON.parse(json);if(schema['@type']!=='CollectionPage')return tag;
    schema.name='Google Review Removal Guides and Research';schema.dateModified=[schema.dateModified||'', '2026-11-24'].sort().at(-1);
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
const researchLinks = {
  'blog/google-review-removal-denominator-audit.html': 'Platform-wide percentages describe groups of reviews. For a specific post, start with the <a href="../google-review-removal-policy.html#matrix">policy and evidence matrix</a> and assess the facts of that review.',
  'blog/google-review-removal-appeals-data.html': 'Working on an existing report? Check the <a href="report-google-review-appeal.html#status">current report status and appeal route</a> to determine what is available for your case.'
};
for (const [file, paragraph] of Object.entries(researchLinks)) change(file, html => {
  if (html.includes(paragraph)) return html;
  return html.replace('<section class="article-cta">', `<p class="google-practical-links">${paragraph}</p><section class="article-cta">`);
});
console.log('Applied Google-focused homepage, Canadian coverage, resource hub and contextual links.');
