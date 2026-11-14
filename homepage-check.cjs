// Local HTTP/browser regression checks. All submission traffic is mocked.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {turnstileApiFixture,isTurnstileApi,completeSecurityCheck}=require('./turnstile-test-fixture.cjs');
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
   // Control only the carousel's 5-second clock; form/provider timers remain real.
   await page.evaluateOnNewDocument(()=>{
    const nativeSet=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window),jobs=new Map();
    let now=0,id=-1;
    window.setTimeout=(callback,delay,...args)=>{
     if(delay!==5000)return nativeSet(callback,delay,...args);
     const key=id--;jobs.set(key,{due:now+delay,run:()=>callback(...args)});return key;
    };
    window.clearTimeout=key=>{if(!jobs.delete(key))nativeClear(key);};
    window.__reviewerClock={pending:()=>jobs.size,tick(ms){now+=ms;for(const [key,job]of [...jobs])if(job.due<=now){jobs.delete(key);job.run();}}};
   });
   await page.setRequestInterception(true);
   page.on('request',r=>{if(r.method()!=='GET'){posts.push(r.url());r.abort();}else if(isTurnstileApi(r.url()))r.respond({status:200,contentType:'text/javascript',body:turnstileApiFixture});else if(r.url().startsWith(base)||r.url().startsWith('data:'))r.continue();else r.abort();});
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
   const testimonial=await page.$eval('.hero-testimonial',e=>({name:e.querySelector('figcaption strong').textContent.trim(),quote:e.querySelector('blockquote').textContent.trim()}));
   assert.equal(testimonial.name,'Luke Hapher');assert.equal(testimonial.quote,'“A great team to have on your side.”');
   assert.deepEqual(await page.$$eval('.reviewer-slide',e=>e.map(n=>n.dataset.reviewer)),['Luke Hapher','Michelle Carter','Daniel Chen']);
   assert.equal(await page.$eval('.testimonial-overall',e=>e.getAttribute('aria-label')),'Overall customer rating: 4.9 out of 5 from more than 5,000 ratings');
   const portrait=await page.$eval('.testimonial-avatar',e=>{const img=e.querySelector('img');return {loaded:img.complete&&img.naturalWidth===480&&img.naturalHeight===600,circle:getComputedStyle(e).borderRadius,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height};});
   assert.equal(portrait.loaded,true,'Luke’s portrait is loaded');assert.equal(portrait.circle,'50%');assert.equal(portrait.width,portrait.height,'Portrait frame stays circular at every viewport');
   assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/shop-owner.*\.(?:webp|jpg)/.test(r.name)).length),0,'Retired hero photograph is not downloaded');
   const banner=await page.$eval('.platform-banner',e=>({height:e.getBoundingClientRect().height,links:e.querySelectorAll('.platform-list a').length,rows:new Set([...e.querySelectorAll('.platform-list li')].map(n=>Math.round(n.getBoundingClientRect().top))).size,lists:e.querySelectorAll('.platform-list:not([aria-hidden])').length}));
   assert.equal(await page.$$eval('.platform-banner',e=>e.length),1);assert.equal(banner.lists,1);assert.equal(banner.links,8);assert.equal(banner.rows,1,'Banner remains one row');assert.ok(banner.height<=72,'No stacked banner');
   if(width<=680)assert.ok(layout.formTop<layout.summaryTop,'Mobile form precedes summary');
   assert.equal(await page.$eval('.hero-actions .button',e=>e.getAttribute('href')),'#quote');
   assert.equal(await page.$$eval('.assessment-steps>li',e=>e.length),3);
   assert.equal(await page.$('#assessment-form details'),null,'The comment does not require opening optional details');
   assert.deepEqual(await page.$eval('#assessment-comment',e=>({required:e.required,name:e.name,visible:e.getClientRects().length>0,afterLink:!!(document.querySelector('[name="business_url"]').compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING),beforeQuantity:!!(e.compareDocumentPosition(document.querySelector('#formQuantity'))&Node.DOCUMENT_POSITION_FOLLOWING)})),{required:false,name:'reason',visible:true,afterLink:true,beforeQuantity:true},'Optional comment is visible immediately after the profile link');
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
  // Reviewer selection must update portrait, quote and accessible state without layout jumps.
  await page.setViewport({width:390,height:844});await page.goto(base,{waitUntil:'load'});
  const reviewHeight=await page.$eval('.hero-testimonial',e=>e.getBoundingClientRect().height);
  async function expectReview(index,name){
   await page.waitForFunction(index=>{const e=document.querySelector('.reviewer-window');return Math.abs(e.scrollLeft-e.clientWidth*index)<1;},{},index);
   await page.waitForFunction(name=>document.querySelector('.reviewer-slide[aria-hidden="false"]')?.dataset.reviewer===name,{},name);
   assert.equal(await page.$$eval('.reviewer-slide[aria-hidden="false"]',e=>e.length),1);
   await page.$eval('.reviewer-slide[aria-hidden="false"] img',e=>e.decode());
   assert.equal(await page.$eval('.hero-testimonial',e=>e.getBoundingClientRect().height),reviewHeight,'Changing reviewers must not shift the page');
   assert.equal(await page.$eval('.testimonial-overall',e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','The rating shares the white card background');
  }
  assert.equal(await page.$$eval('[data-reviewer-step],.reviewer-arrow',e=>e.length),0,'Side arrows were removed');
  assert.equal(await page.$('.reviewer-rotation'),null,'No pause/play button');
  await page.click('.reviewer-dot[aria-label="Show review from Michelle Carter"]');await expectReview(1,'Michelle Carter');
  await page.screenshot({path:path.join(output,'review-michelle-390.png')});
  await page.click('.reviewer-dot[aria-label="Show review from Daniel Chen"]');await expectReview(2,'Daniel Chen');
  await page.screenshot({path:path.join(output,'review-daniel-390.png')});
  await page.click('.reviewer-dot[aria-label="Show review from Luke Hapher"]');await expectReview(0,'Luke Hapher');
  await page.click('.reviewer-dot[aria-label="Show review from Daniel Chen"]');await expectReview(2,'Daniel Chen');
  await page.click('.reviewer-dot[aria-label="Show review from Michelle Carter"]');await expectReview(1,'Michelle Carter');
  await page.focus('.reviewer-window');await page.keyboard.press('Home');await expectReview(0,'Luke Hapher');
  await page.keyboard.press('ArrowRight');await expectReview(1,'Michelle Carter');
  await page.keyboard.press('End');await expectReview(2,'Daniel Chen');
  await page.keyboard.press('Home');await expectReview(0,'Luke Hapher');
  await page.$eval('.reviewer-window',e=>e.scrollIntoView({behavior:'instant',block:'center'}));
  const swipeRect=await page.$eval('.reviewer-window',e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,y:r.top+r.height/2};});
  const touch=await page.createCDPSession();
  try{
   await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:swipeRect.right-20,y:swipeRect.y}]});
   for(let step=1;step<=8;step++){
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:swipeRect.right-20-(swipeRect.right-swipeRect.left-40)*step/8,y:swipeRect.y}]});
    await new Promise(r=>setTimeout(r,40));
   }
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await expectReview(1,'Michelle Carter');
  }finally{await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await touch.detach();}
  await page.click('.reviewer-dot[aria-label="Show review from Daniel Chen"]');await expectReview(2,'Daniel Chen');
  await page.setViewport({width:768,height:900});
  await page.waitForFunction(()=>{const e=document.querySelector('.reviewer-window');return Math.abs(e.scrollLeft-e.clientWidth*2)<1;});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.click('.reviewer-dot[aria-label="Show review from Luke Hapher"]');
  await page.waitForFunction(()=>document.querySelector('.reviewer-window').scrollLeft===0);
  await page.emulateMediaFeatures([]);
  // Actual timer callbacks run at the requested 5-second interval without sleeps.
  const automatic=await newPage(1440);
  await automatic.goto(base,{waitUntil:'load'});
  const tick=ms=>automatic.evaluate(ms=>window.__reviewerClock.tick(ms),ms);
  const active=()=>automatic.$eval('.reviewer-slide[aria-hidden="false"]',e=>e.dataset.reviewer);
  const rotating=()=>automatic.waitForFunction(()=>window.__reviewerClock.pending()===1);
  const stopped=()=>automatic.waitForFunction(()=>window.__reviewerClock.pending()===0);
  async function automaticReview(name){await automatic.waitForFunction(name=>document.querySelector('.reviewer-slide[aria-hidden="false"]')?.dataset.reviewer===name,{},name);}
  await rotating();assert.equal(await active(),'Luke Hapher');
  assert.equal(await automatic.$eval('.reviewer-status',e=>e.getAttribute('aria-live')),'off');
  await tick(4999);assert.equal(await active(),'Luke Hapher','No early rotation');
  await tick(1);await automaticReview('Michelle Carter');
  await tick(5000);await automaticReview('Daniel Chen');
  await tick(5000);await automaticReview('Luke Hapher');
  await automatic.hover('.hero-testimonial');await stopped();await tick(10000);assert.equal(await active(),'Luke Hapher','Hover pauses rotation');
  await automatic.mouse.move(0,0);await rotating();
  await tick(5000);await automaticReview('Michelle Carter');
  await automatic.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await stopped();await tick(10000);assert.equal(await active(),'Michelle Carter','Hidden tabs do not advance');
  await automatic.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await rotating();
  await automatic.$eval('#quote',e=>e.scrollIntoView({behavior:'instant',block:'start'}));
  await stopped();await tick(10000);assert.equal(await active(),'Michelle Carter','Offscreen cards do not advance');
  await automatic.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await rotating();
  await automatic.focus('.reviewer-window');await stopped();
  await automatic.$eval('.reviewer-window',e=>e.blur());await tick(10000);
  assert.equal(await active(),'Michelle Carter','Keyboard interaction keeps automatic rotation stopped');
  assert.equal(await automatic.$eval('.reviewer-status',e=>e.getAttribute('aria-live')),'polite');
  await automatic.click('.reviewer-dot[aria-label="Show review from Daniel Chen"]');await automaticReview('Daniel Chen');
  await automatic.mouse.move(0,0);await stopped();await tick(10000);
  assert.equal(await active(),'Daniel Chen','Dots remain usable and manual selection stops automatic rotation');
  await automatic.goto(base,{waitUntil:'load'});await rotating();
  await automatic.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await stopped();
  await tick(10000);assert.equal(await active(),'Luke Hapher','Reduced motion stops automatic rotation');
  await automatic.goto(base,{waitUntil:'load'});await stopped();
  await tick(10000);assert.equal(await active(),'Luke Hapher','Reduced motion disables initial autoplay');
  await automatic.close();
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
  await completeSecurityCheck(page);
  const body=await page.evaluate(()=>{
   const f=document.querySelector('form');f.querySelector('[name="full_name"]').value='Test Person';f.querySelector('[name="business_name"]').value='Test Canadian Business';f.querySelector('[name="email_address"]').value='test@example.com';f.querySelector('[name="business_url"]').value='https://example.com/review';
   document.querySelector('#formQuantity').value='3';document.querySelector('#formQuantity').dispatchEvent(new Event('change',{bubbles:true}));
   f.querySelector('[name="reason"]').value='Documented test concern https://example.com/specific-review';
   window.__attempts=[];window.__mockMode='error';
   window.fetch=async(url,options)=>{window.__attempts.push({url,body:options.body.toString()});if(window.__mockMode==='error')throw Error('mock transport failure');return {ok:true,json:async()=>({result:'success',notification_sent:window.__mockMode!=='notification-failure'})};};
   f.requestSubmit();return {method:f.method,action:f.action};
  });
  assert.equal(body.method,'post');assert.match(body.action,/script\.google\.com\/macros\/s\/.+\/exec$/);
  await page.waitForSelector('#form-message.is-error');
  assert.equal(await page.$eval('.submit-button',e=>e.disabled),false);
  assert.equal(await page.$eval('[name="full_name"]',e=>e.value),'Test Person','Retry retains details');
  await completeSecurityCheck(page);
  await page.evaluate(()=>{window.__mockMode='success';document.querySelector('form').requestSubmit();});
  await page.waitForSelector('#submission-success:not([hidden])');
  const attempts=await page.evaluate(()=>window.__attempts);assert.equal(attempts.length,2);
  const sent=new URLSearchParams(attempts[1].body);assert.equal(sent.get('review_count'),'3');assert.equal(sent.get('contact_detail'),'test@example.com');
  assert.equal(sent.get('review_links'),null);assert.match(sent.get('reason'),/Documented test concern https:\/\/example\.com\/specific-review/);assert.match(sent.get('reason'),/\[Submission acknowledgement\]/);assert.equal(sent.get('terms_version'),'2026-10-27');
  assert.match(sent.get('selected_plan'),/\$150 upfront/);assert.match(sent.get('selected_plan'),/\$525 if all removed/);
  await page.goto(base,{waitUntil:'load'});
  await completeSecurityCheck(page);
  await page.evaluate(()=>{
   const f=document.querySelector('form');for(const [name,value] of Object.entries({full_name:'Test',business_name:'Test',email_address:'test@example.com',business_url:'https://example.com'}))f.elements[name].value=value;
   window.fetch=async()=>({ok:true,json:async()=>({result:'success',notification_sent:false})});f.requestSubmit();
  });
  await page.waitForSelector('#submission-success:not([hidden])');assert.match(await page.$eval('#success-copy',e=>e.textContent),/saved, but the notification email was not sent/);
  await page.setJavaScriptEnabled(false);await page.goto(base,{waitUntil:'load'});
  assert.equal(await page.$eval('.reviewer-controls',e=>e.hidden),true,'No inert buttons without JavaScript');
  assert.equal(await page.$$eval('.reviewer-slide',e=>e.length),3,'Reviews remain in static HTML');
  assert.equal(await page.$$eval('.platform-list',e=>e.length),1,'One list without JavaScript');
  assert.equal(await page.$$eval('.platform-list a',e=>e.length),8,'All platforms remain accessible without JavaScript');
  assert.equal(await page.$eval('form',f=>f.method),'post');assert.equal(await page.$eval('form',f=>f.noValidate),false);assert.match(await page.$eval('noscript',n=>n.textContent),/enable JavaScript to complete the security check/);
  assert.equal(await page.$$eval('title',n=>n.length),1);assert.equal(await page.$$eval('link[rel="canonical"]',n=>n.length),1);
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[],'Never send a real POST');
  fs.writeFileSync(path.join(output,'layout-results.json'),JSON.stringify(results,null,2));
  console.log('PASS: five homepage widths; distinct quotes; five-second automatic reviewer rotation; no side arrows or pause/play button; dots, swipe, keyboard, resize and stable height; hover/focus/hidden/offscreen pauses and reduced motion; one platform banner; working quote forms with mocked Turnstile; legal payload and no-JS notice; zero real submissions.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
