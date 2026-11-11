// Container/destination responses are mocked. No real analytics, conversions or leads.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {turnstileApiFixture,isTurnstileApi,completeSecurityCheck}=require('./turnstile-test-fixture.cjs');
const root=__dirname;
const pages=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f)];
const {applyToHtml}=require('./install-measurement.cjs');
for(const file of pages){
 const html=fs.readFileSync(path.join(root,file),'utf8'),head=html.split('</head>')[0];
 assert.match(head,/<head\b[^>]*>\s*<!-- measurement bootstrap start -->/);
 assert.equal((head.match(/src="[^"\s]*measurement-config\.js"/g)||[]).length,1,file);
 assert.equal((head.match(/src="[^"\s]*measurement\.js"/g)||[]).length,1,file);
 assert.equal(applyToHtml(applyToHtml(html,file),file),html,file+' bootstrap must be repeatable');
 assert.ok(!/googletagmanager\.com\/(?:gtag\/js|gtm\.js)|googletagmanager\.com\/ns\.html/.test(html),'No unconditional loader/iframe bypasses consent');
}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(req.method!=='GET'||!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
 async function open(query='',gpc=false){
  const context=await browser.createBrowserContext(),page=await context.newPage(),loads=[];
  await page.setRequestInterception(true);page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{
   if(isTurnstileApi(r.url()))return r.respond({status:200,contentType:'text/javascript',body:turnstileApiFixture});
   if(r.url().startsWith('https://www.googletagmanager.com/')){loads.push(r.url());return r.respond({status:200,contentType:'text/javascript',body:'/* provider mocked */'});}
   return r.method()==='GET'&&r.url().startsWith(origin+'/')?r.continue():r.abort();
  });
  if(gpc)await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true}));
  await page.goto(origin+'/'+query,{waitUntil:'load'});await page.waitForFunction(()=>!!window.ReviewRemovalMeasurement);
  return {context,page,loads};
 }
 async function consent(page,analytics,advertising){
  await page.click('#measurement-preferences [data-choice="customize"]');
  for(const [purpose,want]of [['analytics',analytics],['advertising',advertising]])if(await page.$eval('[data-purpose="'+purpose+'"]',el=>el.checked)!==want)await page.click('[data-purpose="'+purpose+'"]');
  await page.click('[data-choice="save"]');
 }
 async function submit(page){
  await completeSecurityCheck(page);
  await page.evaluate(()=>{
   const f=document.querySelector('#assessment-form');for(const [name,value]of Object.entries({full_name:'PRIVATE_NAME',business_name:'PRIVATE_BUSINESS',email_address:'private@example.invalid',business_url:'https://example.invalid/PRIVATE_PROFILE',reason:'PRIVATE_REVIEW'}))f.elements[name].value=value;
   window.fetch=async()=>({ok:true,json:async()=>({result:'success'})});f.requestSubmit();
  });await page.waitForSelector('#submission-success:not([hidden])');
 }
 const layer=page=>page.evaluate(()=>dataLayer.map(entry=>entry.event?entry:Array.from(entry)));
 try{
  let t=await open();assert.equal(t.loads.length,0);await t.page.click('[data-choice="reject"]');assert.equal(t.loads.length,0);await t.context.close();
  t=await open();await consent(t.page,true,false);await t.page.waitForSelector('#reviewremoval-tag-manager');
  assert.equal(t.loads.length,1);assert.ok(t.loads[0].includes('/gtm.js?id=GTM-NJ2W494M'));
  await submit(t.page);let data=await layer(t.page);assert.equal(data.filter(e=>e.event==='reviewremoval_generate_lead').length,1);assert.equal(data.filter(e=>e[0]==='event'&&e[1]==='conversion').length,0);
  assert.equal(data.filter(e=>e.event==='gtm.js').length,1);assert.ok(!JSON.stringify(data).includes('PRIVATE_'));
  await t.page.click('.measurement-settings');await t.page.click('[data-choice="reject"]');
  assert.equal(await t.page.evaluate(()=>window['ga-disable-G-9LFJWP87F0']),true);
  await t.page.click('.measurement-settings');await t.page.click('[data-choice="accept"]');
  await t.page.waitForSelector('#reviewremoval-google-tag');assert.equal(t.loads.filter(url=>url.includes('/gtm.js?')).length,1);await t.context.close();
  t=await open();await consent(t.page,false,true);await t.page.waitForSelector('#reviewremoval-google-tag');assert.equal(t.loads.filter(url=>url.includes('/gtm.js?')).length,0);await submit(t.page);data=await layer(t.page);
  assert.equal(data.filter(e=>e[0]==='event'&&e[1]==='conversion').length,1);await t.context.close();
  t=await open();await t.page.click('[data-choice="accept"]');await t.page.waitForSelector('#reviewremoval-tag-manager');await t.page.waitForSelector('#reviewremoval-google-tag');await submit(t.page);
  await t.page.evaluate(()=>ReviewRemovalMeasurement.confirmedLead(document.querySelector('form')));data=await layer(t.page);
  assert.equal(data.filter(e=>e.event==='reviewremoval_generate_lead').length,1);const conversions=data.filter(e=>e[0]==='event'&&e[1]==='conversion');assert.equal(conversions.length,1);assert.equal(conversions[0][2].send_to,'AW-18449308865/EVurCIn11LQdEMG5qN1E');assert.equal(conversions[0][2].user_data,'');
  assert.equal(t.loads.filter(url=>url.includes('/gtm.js?')).length,1);assert.equal(t.loads.filter(url=>url.includes('/gtag/js?')).length,1);assert.ok(!data.some(e=>e[0]==='config'&&e[1]==='G-9LFJWP87F0'),'GTM-owned GA4 is not initialized a second time by site code');await t.context.close();
  t=await open('?email=PRIVATE_EMAIL');await t.page.click('[data-choice="accept"]');assert.equal(t.loads.length,0);await t.context.close();
  t=await open('',true);await t.page.click('[data-choice="accept"]');await t.page.waitForSelector('#reviewremoval-tag-manager');assert.equal(t.loads.filter(url=>url.includes('/gtag/js?')).length,0);await t.context.close();
  assert.deepEqual(errors,[]);console.log(`PASS: ${pages.length} page bootstraps; one GTM container, consent purposes/rejection/withdrawal/GPC, unsafe URLs, safe event bridge, unchanged confirmed-only Ads conversion and no duplicate GA4 initialization. Providers mocked.`);
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
