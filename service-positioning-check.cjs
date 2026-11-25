const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {applyPositioning,metadataFor}=require('./apply-service-positioning.cjs');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const schemas=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
function nodes(value){if(!value||typeof value!=='object')return [];return [value,...Object.values(value).flatMap(v=>Array.isArray(v)?v.flatMap(nodes):nodes(v))];}
const retired=/yelp|facebook|trustpilot|tripadvisor|glassdoor|sitejabber|booking[.-]com|remove-indeed|\bplatforms\.html|review removal services by platform|review.removal services across major platforms/i;
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
 assert.ok(!retired.test(html),file+': retired platform reference');
 if(file==='review-removal-canada.html'){
  const service=data.find(n=>n['@type']==='Service');assert.match(service.name,/Google/);assert.equal(service.areaServed.name,'Canada');
 }
}
for(const file of fs.readdirSync(path.join(root,'blog')).filter(file=>file.endsWith('.html'))){
 assert.ok(!retired.test(file)||!fs.existsSync(path.join(root,'blog',file)),file+': retired article published');
 assert.ok(!retired.test(read('blog/'+file)),file+': retired platform reference');
}
for(const file of ['sitemap.xml','feed.xml'])assert.ok(!retired.test(read(file)),file+': retired entry');
const links=read('index.html').match(/<ul class="platform-list">([\s\S]*?)<\/ul>/)?.[1]||'';
assert.equal((links.match(/<li>/g)||[]).length,7,'The homepage displays one curated press list');
const timesDomains = new Set(["mtltimes.ca", "otttimes.ca", "totimes.ca"]);
const outlets = [...links.matchAll(/href="([^"]+)"/g)].map(link => new URL(link[1]).hostname);
assert.equal(outlets.filter(outlet => timesDomains.has(outlet)).length, 2, "Only two Times publications appear");
console.log('PASS: Google-only public pages, schema, sitemap and feed; curated homepage press banner.');
