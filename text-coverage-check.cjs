// Dataset/discovery regression checks; no network or lead submissions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,D=require('./blog/data/google-text-coverage-study.json');
const file='blog/google-reviews-without-text-data-study.html',html=fs.readFileSync(path.join(root,file),'utf8');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
assert.equal(D.records,516281);assert.equal(D.places,6019);
assert.equal(D.cleaning.distinct_user_place_time_keys-D.cleaning.ambiguous_keys_excluded,D.records);
assert.equal(D.cleaning.source_rows-D.cleaning.distinct_user_place_time_keys,D.cleaning.repeated_key_occurrences);
assert.equal(D.coverage.reduce((s,r)=>s+r.total,0),D.records);
for(const r of D.coverage){assert.equal(r.total,r.with_text+r.without_text);near(r.without_text_pct,100*r.without_text/r.total);}
for(const [i,frame] of D.frames.entries()){
 const selected=i===0?r=>r.total:i===1?r=>r.with_text:r=>r.without_text;
 assert.equal(frame.records,D.coverage.reduce((s,r)=>s+selected(r),0));
 assert.equal(frame.star_points,D.coverage.reduce((s,r)=>s+r.rating*selected(r),0));
 assert.equal(frame.one_star_count,selected(D.coverage[0]));
 near(frame.mean_rating,frame.star_points/frame.records);
 near(frame.one_star_pct,frame.one_star_count/frame.records*100);
}
assert.equal(D.shifts.reduce((s,r)=>s+r.place_count,0),D.places);
assert.equal(D.photos.reduce((s,r)=>s+r.records,0),D.records);
assert.equal(D.photos.filter(r=>r.stored_text==='absent').reduce((s,r)=>s+r.records,0),D.frames[2].records);
assert.equal(D.photos.filter(r=>r.photo_field==='nonempty').reduce((s,r)=>s+r.records,0),20479);
assert.equal(D.distributions.reduce((s,r)=>s+r.rows,0),16);
for(const dist of D.distributions){
 const rows=fs.readFileSync(path.join(root,'blog/data',dist.file),'utf8').trim().split(/\r?\n/);
 assert.equal(rows.length-1,dist.rows);
}
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.equal((html.match(/<title>/g)||[]).length,1);
assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
assert.ok(html.includes('<link rel="canonical" href="https://reviewremoval.ca/'+file+'">'));
assert.ok(!html.includes('%%'));
const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const graph=schemas.flatMap(s=>s['@graph']||[s]);
const article=graph.find(s=>s['@type']==='BlogPosting'),dataset=graph.find(s=>s['@type']==='Dataset');
assert.equal(article.datePublished,'2026-11-13');
assert.equal(article.mainEntity['@id'],dataset['@id']);
assert.equal(article.image.length,3);
assert.equal(dataset.distribution.length,5);
assert.equal(graph.filter(s=>s['@type']==='ImageObject').length,3);
assert.ok(dataset.spatialCoverage.name.includes('Alaska'));
for(const id of ['answer','findings','coverage','filter','places','photos','canada','method','questions','downloads','sources'])assert.ok(html.includes(`id="${id}"`));
for(const name of ['ratings','frames','places'])for(const suffix of ['','-mobile'])for(const ext of ['png','svg']){
 const p=path.join(root,`blog/assets/google-text-coverage-${name}${suffix}.${ext}`);
 assert.ok(fs.statSync(p).size>1000);
}
// Validate local links, anchors and downloads in the generated article.
const origin='https://reviewremoval.ca';
for(const match of html.matchAll(/\b(?:href|src|srcset)="([^"\s]+)"/g)){
 const u=new URL(match[1],origin+'/'+file);
 if(u.origin!==origin || u.protocol!=='https:')continue;
 const target=path.join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
 assert.ok(fs.existsSync(target),`Missing local target ${u.pathname}`);
 if(u.hash && target.endsWith('.html')){
  const content=fs.readFileSync(target,'utf8');
  assert.ok(content.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`),`Missing anchor ${u.href}`);
 }
}
const index=fs.readFileSync(path.join(root,'blog/index.html'),'utf8');
assert.ok(index.includes(`href="google-reviews-without-text-data-study.html"`));
assert.ok(index.includes('dateModified":"2026-11-13"'));
for(const f of ['sitemap.xml','feed.xml'])assert.ok(fs.readFileSync(path.join(root,f),'utf8').includes(origin+'/'+file));
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
for(const name of ['ratings','frames','places'])assert.ok(sitemap.includes(`google-text-coverage-${name}.svg`));
const baseline=path.join(root,'.seo-private/text-coverage-20261113/before-hashes.json');
if(fs.existsSync(baseline)){
 const hashes=JSON.parse(fs.readFileSync(baseline,'utf8')),crypto=require('node:crypto');
 const allowed=new Set(['_config.yml','build-blog.cjs','set-live-domain.cjs','launch-check.cjs','blog/index.html','feed.xml','sitemap.xml']);
 let protectedCount=0;
 for(const [name,hash] of Object.entries(hashes))if(!allowed.has(name)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),hash,`Protected file changed: ${name}`);protectedCount++;
 }
 console.log(`PASS: ${protectedCount} existing files byte-identical, including homepage, prior articles, forms, styles and measurement.`);
}
console.log('PASS: cleaned aggregates, 16 CSV rows, figures, rendered metadata/schema, local links, downloads, blog, RSS and sitemap.');
