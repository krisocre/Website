// Local HTTP/browser regression checks. All submission traffic is mocked.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const root=__dirname,output=path.join(root,'.seo-private','homepage-cro');
fs.mkdirSync(output,{recursive:true});
// Rebuild against an in-memory filesystem: preserve the design without rewriting pages.
const vm=require('node:vm'),createRequire=require('node:module').createRequire;
const virtualFiles=new Map(),source=path.join(root,'apply-google-focus.cjs'),localRequire=createRequire(source);
const virtualFs={...fs,readFileSync:(file,...args)=>virtualFiles.has(path.resolve(file))?virtualFiles.get(path.resolve(file)):fs.readFileSync(file,...args),writeFileSync:(file,value)=>virtualFiles.set(path.resolve(file),value)};
const originalHome=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(let run=0;run<2;run++)vm.runInNewContext(fs.readFileSync(source,'utf8'),{require:name=>name==='node:fs'?virtualFs:localRequire(name),__dirname:root,console:{log(){}}},{filename:source});
assert.equal(virtualFiles.get(path.join(root,'index.html'))||originalHome,originalHome,'Google-focus rebuilds must preserve the homepage exactly');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.avif':'image/avif'};
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/';let browser;const results=[];
 try{
  browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[],posts=[];
  async function newPage(width=390){
   const page=await browser.newPage();await page.setViewport({width,height:width<=680?844:900});
   await page.setRequestInterception(true);
   page.on('request',r=>{if(r.method()!=='GET'){posts.push(r.url());r.abort();}else if(r.url().startsWith(base)||r.url().startsWith('data:'))r.continue();else r.abort();});
   page.on('pageerror',e=>errors.push(e.message));return page;
  }
  const page=await newPage();
  for(const width of [1440,1024,768,390,320]){
   await page.setViewport({width,height:width<=680?844:900});await page.goto(base,{waitUntil:'load'});
   await page.evaluate(()=>document.fonts.ready);
   const layout=await page.evaluate(()=>{
    const cta=document.querySelector('.hero-actions .button').getBoundingClientRect(),form=document.querySelector('form').getBoundingClientRect(),summary=document.querySelector('.quote-summary').getBoundingClientRect();
    return {width:innerWidth,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,ctaTop:cta.top,ctaBottom:cta.bottom,viewportHeight:innerHeight,formTop:form.top,summaryTop:summary.top,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),animated:document.getAnimations().filter(a=>a.playState==='running'&&!a.effect.target.matches('.platform-track')).length};
   });
   assert.equal(layout.overflow,false,'Overflow at '+width);assert.ok(layout.ctaTop>=0&&layout.ctaBottom<layout.viewportHeight,'Primary CTA must be visible at '+width);assert.deepEqual(layout.brokenImages,[]);assert.equal(layout.animated,0,'No unrelated homepage animations');
   assert.ok(await page.$eval('.hero-secondary',e=>e.getBoundingClientRect().height>=44),'Pricing link has a 44px tap target');
   const testimonial=await page.$eval('.hero-testimonial',e=>({name:e.querySelector('figcaption strong').textContent,quote:e.querySelector('blockquote').textContent,rating:e.querySelector('.testimonial-stars').getAttribute('aria-label')}));
   assert.equal(testimonial.name,'Luke Hapher');assert.equal(testimonial.quote,'“The team took care of my bad review.”');assert.equal(testimonial.rating,'5 out of 5 stars');
   assert.equal(await page.$eval('.testimonial-overall',e=>e.getAttribute('aria-label')),'Overall customer rating: 4.9 out of 5 from more than 5,000 ratings');
   const portrait=await page.$eval('.testimonial-avatar',e=>{const img=e.querySelector('img');return {loaded:img.complete&&img.naturalWidth===480&&img.naturalHeight===600,circle:getComputedStyle(e).borderRadius,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height};});
   assert.equal(portrait.loaded,true,'Luke’s portrait is loaded');assert.equal(portrait.circle,'50%');assert.equal(portrait.width,portrait.height,'Portrait frame stays circular at every viewport');
   assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/shop-owner.*\.(?:webp|jpg)/.test(r.name)).length),0,'Retired hero photograph is not downloaded');
   const banner=await page.$eval('.platform-banner',e=>({height:e.getBoundingClientRect().height,links:e.querySelectorAll('.platform-list a').length,rows:new Set([...e.querySelectorAll('.platform-list li')].map(n=>Math.round(n.getBoundingClientRect().top))).size,lists:e.querySelectorAll('.platform-list:not([aria-hidden])').length}));
   assert.equal(await page.$$eval('.platform-banner',e=>e.length),1);assert.equal(banner.lists,1);assert.equal(banner.links,8);assert.equal(banner.rows,1,'Banner remains one row');assert.ok(banner.height<=72,'No stacked banner');
   if(width<=680)assert.ok(layout.formTop<layout.summaryTop,'Mobile form precedes summary');
   assert.equal(await page.$eval('.hero-actions .button',e=>e.getAttribute('href')),'#quote');
   assert.equal(await page.$$eval('.assessment-steps>li',e=>e.length),3);
   assert.equal(await page.$eval('.assessment-extra',e=>e.open),false);
   if([1440,390].includes(width)){
    await page.screenshot({path:path.join(output,'home-'+width+'.png'),fullPage:true});
    await page.screenshot({path:path.join(output,'hero-'+width+'.png')});
   }
   if(width<=680){
    await page.click('.menu-toggle');assert.equal(await page.$eval('.primary-nav',e=>e.classList.contains('is-open')),true);
    await page.click('.primary-nav .nav-contact');await page.waitForFunction(()=>location.hash==='#quote');
    assert.equal(await page.$eval('.menu-toggle',e=>e.getAttribute('aria-expanded')),'false');
   }else await page.click('.hero-actions .button');
   // Use instant positioning for a deterministic screenshot after the actual link click.
   await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelector('#quote').scrollIntoView();});
   if(width===390)await page.screenshot({path:path.join(output,'assessment-390.png')});
   results.push(layout);
  }
  // The banner has no visible control; hover/focus and reduced motion keep links usable.
  await page.goto(base,{waitUntil:'load'});
  const tickerDelta=()=>page.$eval('.platform-track',async e=>{const before=e.getBoundingClientRect().left;await new Promise(r=>setTimeout(r,160));return e.getBoundingClientRect().left-before;});
  assert.ok(await tickerDelta() < -1,'Platform banner actually moves');
  assert.equal(await page.$('.platform-toggle'),null,'Pause button is removed');
  await page.$eval('.platform-banner',e=>e.scrollIntoView({block:'center',behavior:'instant'}));
  await page.hover('.platform-banner');assert.ok(Math.abs(await tickerDelta())<.1,'Hover pauses movement');
  await page.mouse.move(0,0);assert.ok(await tickerDelta() < -1,'Leaving the banner resumes movement');
  await page.$eval('.platform-track',e=>{e.getAnimations()[0].currentTime=20000;});
  await page.focus('.platform-list a');
  assert.ok(await page.$eval('.platform-list a',e=>{const link=e.getBoundingClientRect(),viewport=e.closest('.platform-window').getBoundingClientRect();return link.left>=viewport.left&&link.right<=viewport.right;}),'Keyboard focus reveals the platform link even halfway through the loop');
  await page.$eval('.platform-list a',e=>e.blur());
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  assert.equal(await page.$eval('.platform-track',e=>getComputedStyle(e).animationName),'none');
  assert.equal(await page.$eval('.platform-list[aria-hidden]',e=>getComputedStyle(e).display),'none');
  await page.emulateMediaFeatures([]);
  await page.goto(base,{waitUntil:'load'});
  await page.$eval('#priceQuantity',e=>{e.value='3';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#formQuantity',e=>e.value),'3');
  assert.deepEqual(await page.$$eval('[data-quote="total"]',e=>e.map(n=>n.textContent)),['$525','$525']);
  await page.$eval('#formQuantity',e=>{e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.$eval('#priceQuantity',e=>e.value),'1');
  await page.$eval('#formQuantity',e=>{e.value='51';e.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.$eval('#priceQuantity',e=>e.value),'50');
  assert.equal(await page.$eval('form',f=>f.checkValidity()),false,'Empty request must be invalid');
  const body=await page.evaluate(()=>{
   const f=document.querySelector('form');f.querySelector('[name="full_name"]').value='Test Person';f.querySelector('[name="business_name"]').value='Test Canadian Business';f.querySelector('[name="email_address"]').value='test@example.com';f.querySelector('[name="business_url"]').value='https://example.com/review';
   document.querySelector('#formQuantity').value='3';document.querySelector('#formQuantity').dispatchEvent(new Event('change',{bubbles:true}));
   f.querySelector('[name="review_links"]').value='https://example.com/specific-review';f.querySelector('[name="reason"]').value='Documented test concern';
   window.__attempts=[];window.__mockMode='error';
   window.fetch=async(url,options)=>{window.__attempts.push({url,body:options.body.toString()});if(window.__mockMode==='error')throw Error('mock transport failure');return {ok:true,json:async()=>({result:'success',notification_sent:window.__mockMode!=='notification-failure'})};};
   f.requestSubmit();return {method:f.method,action:f.action};
  });
  assert.equal(body.method,'post');assert.match(body.action,/script\.google\.com\/macros\/s\/.+\/exec$/);
  await page.waitForSelector('#form-message.is-error');
  assert.equal(await page.$eval('.submit-button',e=>e.disabled),false);
  assert.equal(await page.$eval('[name="full_name"]',e=>e.value),'Test Person','Retry retains details');
  await page.evaluate(()=>{window.__mockMode='success';document.querySelector('form').requestSubmit();});
  await page.waitForSelector('#submission-success:not([hidden])');
  const attempts=await page.evaluate(()=>window.__attempts);assert.equal(attempts.length,2);
  const sent=new URLSearchParams(attempts[1].body);assert.equal(sent.get('review_count'),'3');assert.equal(sent.get('contact_detail'),'test@example.com');
  assert.equal(sent.get('review_links'),'https://example.com/specific-review');assert.match(sent.get('reason'),/Documented test concern/);assert.match(sent.get('reason'),/\[Submission acknowledgement\]/);assert.equal(sent.get('terms_version'),'2026-10-27');
  assert.match(sent.get('selected_plan'),/\$150 upfront/);assert.match(sent.get('selected_plan'),/\$525 if all removed/);
  await page.goto(base,{waitUntil:'load'});
  await page.evaluate(()=>{
   const f=document.querySelector('form');for(const [name,value] of Object.entries({full_name:'Test',business_name:'Test',email_address:'test@example.com',business_url:'https://example.com'}))f.elements[name].value=value;
   window.fetch=async()=>({ok:true,json:async()=>({result:'success',notification_sent:false})});f.requestSubmit();
  });
  await page.waitForSelector('#submission-success:not([hidden])');assert.match(await page.$eval('#success-copy',e=>e.textContent),/saved, but the notification email was not sent/);
  await page.setJavaScriptEnabled(false);await page.goto(base,{waitUntil:'load'});
  assert.equal(await page.$$eval('.platform-list',e=>e.length),1,'One list without JavaScript');
  assert.equal(await page.$$eval('.platform-list a',e=>e.length),8,'All platforms remain accessible without JavaScript');
  assert.equal(await page.$eval('form',f=>f.method),'post');assert.equal(await page.$eval('form',f=>f.noValidate),false);assert.match(await page.$eval('noscript',n=>n.textContent),/confirm the scope and price/);
  assert.equal(await page.$$eval('title',n=>n.length),1);assert.equal(await page.$$eval('link[rel="canonical"]',n=>n.length),1);
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[],'Never send a real POST');
  fs.writeFileSync(path.join(output,'layout-results.json'),JSON.stringify(results,null,2));
  console.log('PASS: homepage at five widths; circular portrait; one moving eight-platform row without a pause button; hover, keyboard access and reduced motion; visible CTA; mobile form order; quote bounds/totals; mocked error/retry/success/notification failure; legal payload; native POST fallback; zero real submissions.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
