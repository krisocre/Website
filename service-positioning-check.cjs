const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {applyPositioning,metadataFor,discontinued}=require('./apply-service-positioning.cjs');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const schemas=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
function nodes(value){if(!value||typeof value!=='object')return [];return [value,...Object.values(value).flatMap(v=>Array.isArray(v)?v.flatMap(nodes):nodes(v))];}
const retiredPaths=new Set(Object.keys(discontinued));
const rootPages=fs.readdirSync(root).filter(file=>file.endsWith('.html')&&file!=='404.html');
for(const file of rootPages){
 const html=read(file),head=html.split('</head>')[0];
 assert.equal(applyPositioning(file,html),html,file+': service policy is not repeatable');
 assert.equal((head.match(/rel="canonical"/g)||[]).length,1,file+': canonical duplicated');
 const data=schemas(html).flatMap(nodes);
 if(file==='index.html')assert.equal(html.split('</head>')[1],applyPositioning(file,html).split('</head>')[1]);
 if(metadataFor(file)){
  const m=metadataFor(file),decode=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'");
  assert.equal(decode(head.match(/<title>([^<]+)<\/title>/)[1]),m.title);
  for(const key of ['description','og:description','twitter:description'])assert.equal(decode(head.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))[1]),m.description,file+': '+key);
  for(const key of ['og:title','twitter:title'])assert.equal(decode(head.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))[1]),m.title,file+': '+key);
 }
 assert.ok(!/name="keywords"/.test(head),file+': no meta-keyword stuffing');
 const links=[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1].split(/[?#]/)[0]);
 if(file!=='index.html')assert.ok(!links.some(link=>retiredPaths.has(link)),file+': discontinued service promoted');
 if(retiredPaths.has(file)){
  assert.ok(data.some(n=>n['@type']==='WebPage'));
  assert.ok(!data.some(n=>['Service','Offer','Product'].includes(n['@type'])),file+': inactive service schema');
  assert.ok(html.includes(discontinued[file]+' review removal is no longer offered.'));
  assert.ok(html.includes('id="legacy-request"'));
  assert.equal((html.match(/<form\b/g)||[]).length,1,file+': retained form missing');
 }
 if(file==='platforms.html'){
  const list=data.find(n=>n['@type']==='ItemList');assert.equal(list.numberOfItems,2);
  assert.match(list.itemListElement[0].name,/Google/);assert.match(list.itemListElement[1].name,/Yelp/);
  assert.equal((html.match(/class="directory-item"/g)||[]).length,2);
 }
 if(file==='remove-yelp-reviews.html'){
  const service=data.find(n=>n['@type']==='Service');assert.match(service.name,/Yelp/);assert.equal(service.offers.price,'50');assert.equal(service.offers.priceCurrency,'CAD');
 }
 if(file==='review-removal-canada.html'){
  const service=data.find(n=>n['@type']==='Service');assert.match(service.name,/Google/);assert.equal(service.areaServed.name,'Canada');
 }
 assert.ok(!data.some(n=>n['@type']==='Service'&&/Facebook|Trustpilot|Tripadvisor|Booking\.com|Glassdoor|Indeed/.test(n.name||'')),file+': obsolete service');
}
let blogFiles=0;
function walkBlog(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){
 const file=path.join(directory,item.name);if(item.isDirectory())walkBlog(file);else{
  blogFiles++;if(item.name.endsWith('.html')){const html=fs.readFileSync(file,'utf8');assert.equal(applyPositioning(path.relative(root,file).replaceAll('\\','/'),html),html);}
 }
}}walkBlog(path.join(root,'blog'));
if(process.env.SERVICE_POSITIONING_BASELINE){
 const baseline=path.resolve(process.env.SERVICE_POSITIONING_BASELINE),manifest=JSON.parse(fs.readFileSync(path.join(baseline,'before-hashes.json'),'utf8'));
 const beforeRoot=path.join(baseline,'before');
 for(const [file,hash] of Object.entries(manifest)){
  const protectedFile=file.startsWith('blog/')||/\.(?:js|css|gs|avif|jpg|png|svg|webp|woff2?|bib|cff|csv)$/.test(file)||['robots.txt','CNAME','feed.xml','legal-settings.json'].includes(file);
  if(protectedFile)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file+': protected file changed');
  if(file.endsWith('.html')){
   const before=fs.readFileSync(path.join(beforeRoot,file),'utf8'),after=read(file);
   assert.deepEqual(after.match(/<form\b[\s\S]*?<\/form>/g),before.match(/<form\b[\s\S]*?<\/form>/g),file+': form changed');
   assert.deepEqual(after.match(/<link rel="canonical"[^>]+>/g),before.match(/<link rel="canonical"[^>]+>/g),file+': canonical changed');
   assert.deepEqual(after.match(/<meta name="robots"[^>]+>/g),before.match(/<meta name="robots"[^>]+>/g),file+': indexability changed');
  }
 }
 const before=fs.readFileSync(path.join(beforeRoot,'index.html'));
 const after=fs.readFileSync(path.join(root,'index.html'));
 assert.deepEqual(after.subarray(after.indexOf('</head>')+7),before.subarray(before.indexOf('</head>')+7),'Homepage body changed');
 const sitemapBefore=fs.readFileSync(path.join(beforeRoot,'sitemap.xml'),'utf8'),sitemapAfter=read('sitemap.xml');
 assert.deepEqual([...sitemapAfter.matchAll(/<loc>[^<]+<\/loc>/g)].map(m=>m[0]),[...sitemapBefore.matchAll(/<loc>[^<]+<\/loc>/g)].map(m=>m[0]),'Sitemap URLs changed');
 assert.deepEqual([...sitemapAfter.matchAll(/<url><loc>https:\/\/reviewremoval.ca\/blog\/[\s\S]*?<\/url>/g)].map(m=>m[0]),[...sitemapBefore.matchAll(/<url><loc>https:\/\/reviewremoval.ca\/blog\/[\s\S]*?<\/url>/g)].map(m=>m[0]),'Blog sitemap entries changed');
 console.log('PASS: baseline hashes, homepage body, every blog asset, all existing forms, canonical/indexability and sitemap URL/blog-entry preservation.');
}
console.log(`PASS: ${rootPages.length} non-blog pages, service policy idempotency, rendered-source metadata/schema, Google/Yelp positioning and ${blogFiles} protected blog files.`);
