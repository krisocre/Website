// Synthetic destination IDs below are test fixtures only. Every Google request is intercepted.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {turnstileApiFixture,isTurnstileApi,completeSecurityCheck}=require('./turnstile-test-fixture.cjs');
const root=__dirname;
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(bytes);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';let browser;
 const google=[],externalPosts=[],errors=[];
 try{
  browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const fixtures={ga4MeasurementId:'G-TEST000001',googleAdsId:'AW-18449308865',googleAdsLeadConversionLabel:'TEST_ONLY'};
  async function open({config=fixtures,query='',gpc=false,blockedStorage=false,language='en-CA'}={}){
   const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width:390,height:844});
   await page.setRequestInterception(true);page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{
    if(r.method()!=='GET'){externalPosts.push(r.url());r.abort();return;}
    if(isTurnstileApi(r.url())){r.respond({status:200,contentType:'text/javascript',body:turnstileApiFixture});return;}
    if(r.url().includes('googletagmanager.com/gtag/js')){google.push(r.url());r.respond({status:200,contentType:'text/javascript',body:'/* intercepted test loader: no network collection */'});return;}
    if(config!==null&&r.url().startsWith(base)&&r.url().endsWith('/measurement-config.js')){r.respond({status:200,contentType:'text/javascript',body:'window.ReviewRemovalMeasurementConfig='+JSON.stringify(config)+';'});return;}
    if(r.url().startsWith(base))r.continue();else r.abort();
   });
   if(gpc)await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true}));
   await page.evaluateOnNewDocument(language=>Object.defineProperty(navigator,'language',{get:()=>language}),language);
   if(blockedStorage)await page.evaluateOnNewDocument(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage blocked');}}));
   await page.goto(base+query,{waitUntil:'load'});await page.waitForFunction(()=>!!window.ReviewRemovalMeasurement);
   return {page,context};
  }
  async function commands(page){return page.evaluate(()=>window.dataLayer.map(v=>Array.from(v)));}
  async function events(page){return (await commands(page)).filter(v=>v[0]==='event');}
  async function choose(page,choice){await page.click('#measurement-preferences [data-choice="'+choice+'"]');}
  async function fillAndSubmit(page,result='success'){
   await completeSecurityCheck(page);
   await page.evaluate(result=>{
    const f=document.querySelector('#assessment-form');
    const values={full_name:'PRIVATE_PERSON',business_name:'PRIVATE_BUSINESS',email_address:'private.person@example.com',business_url:'https://example.com/PRIVATE_PROFILE',review_links:'https://example.com/PRIVATE_REVIEW',reason:'PRIVATE_REVIEW_TEXT'};
    for(const [name,value] of Object.entries(values))f.elements[name].value=value;
    window.fetch=async()=>{
      if(result==='network')throw Error('PRIVATE_NETWORK_ERROR');
      return {ok:result!=='http',json:async()=>{if(result==='json')throw Error('PRIVATE_JSON_ERROR');return result==='legacy'?{result:'error',error:'Failed to send email: no recipient'}:result==='error'?{result:'error',error:'PRIVATE_SERVER_ERROR'}:{result:'success',notification_sent:result!=='notification'};}};
    };
    f.requestSubmit();
   },result);
   if(['network','http','json','error'].includes(result))await page.waitForSelector('#form-message.is-error');else await page.waitForSelector('#submission-success:not([hidden])');
  }
  // Initial visit and explicit rejection never load a Google tag.
  let test=await open(),page=test.page,start=google.length;
  assert.equal(await page.$eval('#measurement-preferences',e=>e.hidden),false);
  assert.equal((await commands(page)).filter(c=>c[0]==='config').length,0);
  await choose(page,'reject');assert.equal(google.length,start);
  await fillAndSubmit(page);assert.equal((await events(page)).length,0,'No denied lead backfill');
  await page.click('.measurement-settings');await choose(page,'accept');
  assert.equal((await events(page)).filter(e=>e[1]==='generate_lead'||e[1]==='conversion').length,0);
  await test.context.close();
  // Actual checked-in Ads destination: confirmed lead only, no real Google requests.
  test=await open({config:null});page=test.page;start=google.length;
  assert.equal((await page.evaluate(()=>window.ReviewRemovalMeasurement.status())).adsLeadConfigured,true);
  assert.equal((await page.evaluate(()=>window.ReviewRemovalMeasurement.status())).ga4Configured,false);
  assert.equal((await events(page)).filter(e=>e[1]==='conversion').length,0);
  await choose(page,'accept');
  await page.waitForFunction(()=>document.querySelector('#reviewremoval-google-tag'));
  assert.equal(google.length-start,1);
  await page.click('.hero-actions .button');
  assert.equal((await events(page)).filter(e=>e[1]==='conversion').length,0,'Quote CTA is not a completed lead');
  await fillAndSubmit(page,'network');
  assert.equal((await events(page)).filter(e=>e[1]==='conversion').length,0,'Failed submission is not a lead');
  await fillAndSubmit(page);
  await page.evaluate(()=>window.ReviewRemovalMeasurement.confirmedLead(document.querySelector('form')));
  const realConversions=(await events(page)).filter(e=>e[1]==='conversion');
  assert.equal(realConversions.length,1);
  assert.equal(realConversions[0][2].send_to,'AW-18449308865/HqdzCIv5z4gdEMG5qN1E');
  assert.equal(realConversions[0][2].value,1);assert.equal(realConversions[0][2].currency,'CAD');
  assert.ok(realConversions[0][2].transaction_id);
  assert.ok(!/PRIVATE_|private\.person|example\.com/.test(JSON.stringify(realConversions)),'No form data sent to the real Ads destination');
  assert.equal((await events(page)).filter(e=>e[1]==='generate_lead'||e[1]==='page_view').length,0,'Unconfigured GA4 remains disabled');
  await test.context.close();
  // Both routes: one loader, manual page view, no duplicate lead or form start.
  test=await open();page=test.page;start=google.length;await choose(page,'accept');
  await page.waitForFunction(()=>document.querySelector('#reviewremoval-google-tag'));
  assert.equal(google.length-start,1);assert.equal((await events(page)).filter(e=>e[1]==='page_view').length,1);
  assert.ok((await commands(page)).find(c=>c[0]==='config'&&c[1]===fixtures.ga4MeasurementId&&c[2].send_page_view===false));
  await page.click('.hero-actions .button');
  assert.equal((await events(page)).filter(e=>e[1]==='quote_cta_click').length,1);
  await page.focus('[name="full_name"]');assert.equal((await events(page)).filter(e=>e[1]==='quote_form_start').length,0);
  await page.type('[name="full_name"]','Test');await page.type('[name="email_address"]','x');
  assert.equal((await events(page)).filter(e=>e[1]==='quote_form_start').length,1);
  await page.evaluate(()=>document.querySelector('form').requestSubmit());assert.equal((await events(page)).filter(e=>e[1]==='generate_lead').length,0);
  await fillAndSubmit(page,'network');assert.equal((await events(page)).filter(e=>e[1]==='generate_lead').length,0);
  await fillAndSubmit(page);await page.evaluate(()=>window.ReviewRemovalMeasurement.confirmedLead(document.querySelector('form')));
  let all=await events(page);assert.equal(all.filter(e=>e[1]==='generate_lead').length,1);assert.equal(all.filter(e=>e[1]==='conversion').length,1);
  assert.equal(all.find(e=>e[1]==='generate_lead')[2].send_to,fixtures.ga4MeasurementId);
  assert.equal(all.find(e=>e[1]==='conversion')[2].send_to,'AW-18449308865/TEST_ONLY');
  assert.ok(all.find(e=>e[1]==='conversion')[2].transaction_id);
  assert.ok(!/PRIVATE_|private\.person|example\.com/.test(JSON.stringify(all)),'No form contents in any event parameter');
  // Future contact links transmit method only, never recipient, telephone or message.
  await page.evaluate(()=>{const e=document.createElement('a');e.id='test-email';e.href='mailto:PRIVATE_EMAIL@example.com?body=PRIVATE_BODY';e.textContent='Email';e.onclick=x=>x.preventDefault();document.body.appendChild(e);const t=e.cloneNode();t.id='test-phone';t.href='tel:+15551234567';t.textContent='Phone';t.onclick=x=>x.preventDefault();document.body.appendChild(t);});
  await page.click('#test-email');await page.click('#test-phone');all=await events(page);
  assert.equal(all.filter(e=>e[1]==='email_click').length,1);assert.equal(all.filter(e=>e[1]==='phone_click').length,1);assert.ok(!/PRIVATE_|15551234567/.test(JSON.stringify(all)));
  await page.click('.measurement-settings');await choose(page,'reject');const count=(await events(page)).length;
  await page.click('.hero-actions .button');assert.equal((await events(page)).length,count,'Withdrawal stops new events');
  await page.reload({waitUntil:'load'});assert.equal(await page.$eval('#measurement-preferences',e=>e.hidden),true);assert.equal((await events(page)).length,0);
  await test.context.close();
  // Strict confirmed response, including saved-without-email, across outcome states.
  for(const outcome of ['http','json','error','legacy','notification']){
   test=await open();page=test.page;await choose(page,'accept');await fillAndSubmit(page,outcome);
   const leads=(await events(page)).filter(e=>e[1]==='generate_lead');assert.equal(leads.length,outcome==='notification'?1:0,'Lead confirmation: '+outcome);await test.context.close();
  }
  // Missing production IDs/labels produce no fake destination or conversion.
  test=await open({config:{ga4MeasurementId:null,googleAdsId:'AW-18449308865',googleAdsLeadConversionLabel:null}});page=test.page;await choose(page,'accept');await fillAndSubmit(page);
  assert.equal((await events(page)).length,0);assert.equal((await page.evaluate(()=>window.ReviewRemovalMeasurement.recentEvents())).filter(e=>e.name==='generate_lead').length,1);await test.context.close();
  // Independent purposes and browser privacy signal.
  test=await open({gpc:true});page=test.page;await choose(page,'accept');
  assert.equal((await page.evaluate(()=>window.ReviewRemovalMeasurement.status())).advertisingConsent,false);
  assert.ok(!(await commands(page)).some(c=>c[0]==='config'&&c[1]==='AW-18449308865'));await test.context.close();
  test=await open();page=test.page;await choose(page,'customize');await page.click('[data-purpose="analytics"]');await choose(page,'save');
  assert.ok((await commands(page)).some(c=>c[0]==='config'&&c[1]===fixtures.ga4MeasurementId));assert.ok(!(await commands(page)).some(c=>c[0]==='config'&&c[1]===fixtures.googleAdsId));await test.context.close();
  test=await open();page=test.page;await choose(page,'customize');await page.click('[data-purpose="advertising"]');await choose(page,'save');await fillAndSubmit(page);
  assert.ok(!(await commands(page)).some(c=>c[0]==='config'&&c[1]===fixtures.ga4MeasurementId));assert.equal((await events(page)).filter(e=>e[1]==='generate_lead'||e[1]==='page_view').length,0);assert.equal((await events(page)).filter(e=>e[1]==='conversion').length,1);await test.context.close();
  // Language, keyboard controls and a narrow inline layout without overlays.
  test=await open({language:'fr-CA'});page=test.page;
  assert.equal(await page.$eval('#measurement-preferences',e=>e.lang),'fr-CA');
  assert.equal(await page.$eval('#measurement-preferences [data-choice="reject"]',e=>e.textContent),'Refuser les mesures');
  await choose(page,'customize');assert.equal(await page.evaluate(()=>document.activeElement.dataset.purpose),'analytics');
  await page.focus('[data-choice="save"]');await page.keyboard.press('Enter');assert.equal(await page.$eval('#measurement-preferences',e=>e.hidden),true);
  assert.equal(await page.evaluate(()=>document.activeElement.className),'measurement-settings');await page.keyboard.press('Enter');
  assert.equal(await page.$eval('#measurement-preferences',e=>e.hidden),false);
  fs.mkdirSync('.seo-private/measurement-2026-11-01',{recursive:true});
  for(const width of [320,1440]){
   await page.setViewport({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow at '+width);
   assert.equal(await page.$eval('#measurement-preferences',e=>getComputedStyle(e).position),'static');
   await (await page.$('#measurement-preferences')).screenshot({path:'.seo-private/measurement-2026-11-01/consent-fr-'+width+'.png'});
  }
  await page.click('.measurement-language');assert.equal(await page.$eval('#measurement-preferences',e=>e.lang),'en-CA');await test.context.close();
  // URL leakage guard, without changing the original address or the form integration.
  test=await open({query:'?email_address=PRIVATE_EMAIL#PRIVATE_HASH'});page=test.page;start=google.length;await choose(page,'accept');await fillAndSubmit(page);
  assert.equal(google.length,start);assert.equal((await events(page)).length,0);assert.ok(page.url().includes('PRIVATE_EMAIL'));await test.context.close();
  // Browser storage failure does not prevent a confirmed assessment request.
  test=await open({blockedStorage:true});page=test.page;await choose(page,'reject');await fillAndSubmit(page);await test.context.close();
  assert.deepEqual(externalPosts,[]);assert.deepEqual(errors,[]);
  console.log('PASS: consent defaults/rejection/withdrawal/restoration, independent purposes, one loader, manual page views, CTA/start deduplication, confirmed-only GA4/Ads leads, saved-without-notification, privacy payloads, future contact clicks, missing IDs, GPC, unsafe URL suppression, blocked storage, French/English controls, keyboard flow and 320/1440px layouts. No real Google collection or form POST.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
