// Source classification, consent, navigation and mocked lead submissions.
// No Google collection, real lead rows or email notifications.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),http=require('node:http');
const puppeteer=require('puppeteer');
const {turnstileApiFixture,isTurnstileApi,completeSecurityCheck}=require('./turnstile-test-fixture.cjs');
const root=__dirname;
const source=fs.readFileSync(path.join(root,'script.js'),'utf8').match(/\/\/ BEGIN LEAD TRAFFIC SOURCE[\s\S]*?\/\/ END LEAD TRAFFIC SOURCE/)[0];
let checks=0;
function visit({url='https://reviewremoval.ca/',referrer='',consent={analyticsConsent:true,advertisingConsent:true},store=new Map(),blocked=false,now=1000000}={}){
 const events={},context={URL,Date:class extends Date{static now(){return now;}},window:{location:{href:url},
  sessionStorage:{getItem(k){if(blocked)throw Error();return store.get(k)||null;},setItem(k,v){if(blocked)throw Error();store.set(k,v);},removeItem(k){if(blocked)throw Error();store.delete(k);}},
  ReviewRemovalMeasurement:{status:()=>consent},addEventListener:(type,fn)=>{events[type]=fn;}},
  document:{referrer,addEventListener:(type,fn)=>{events['document:'+type]=fn;}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {get:()=>vm.runInContext('leadTrafficSource.get()',context),store,events,consent,tick:ms=>{now+=ms;}};
}
for(const [url,referrer,expected] of [
 ['?gclid=LOCAL_CLICK','https://www.google.com/','paid_google'],
 ['?gbraid=LOCAL_CLICK','','paid_google'],['?wbraid=LOCAL_CLICK','','paid_google'],['?dclid=LOCAL_CLICK','','paid_other'],
 ['?utm_source=google&utm_medium=cpc','','paid_google'],['?utm_source=bing&utm_medium=ppc','','paid_other'],
 ['?utm_source=facebook&utm_medium=paid_social','','paid_other'],['?utm_source=google&utm_medium=organic','','organic_google'],
 ['?utm_source=bing&utm_medium=organic','','organic_bing'],['?utm_source=duckduckgo&utm_medium=organic','','organic_other'],
 ['', 'https://www.google.ca/search?q=PRIVATE_QUERY','organic_google'],['','https://www.google.com/','organic_google'],
 ['','https://www.bing.com/search?q=PRIVATE_QUERY','organic_bing'],['','https://ca.search.yahoo.com/','organic_other'],
 ['','https://duckduckgo.com/','organic_other'],['','https://search.brave.com/','organic_other'],
 ['','https://www.googleadservices.com/','paid_google'],['','https://google.com.attacker.invalid/','referral'],
 ['','https://evilgoogle.com/','referral'],['','https://example.ca/private?email=PRIVATE','referral'],
 ['','','unknown'],['','https://reviewremoval.ca/blog/index.html','unknown'],
 ['?gclid=','https://google.com/','unknown'],['?gclid=not%20an%20id','https://google.com/','unknown'],
 ['?utm_source=google','https://google.com/','unknown'],['?utm_medium=unrecognised','https://google.com/','unknown'],
 ['?gad_campaignid=123','https://google.com/','unknown'],['?utm_medium=email','','referral'],
 ['?utm_source=PRIVATE_EMAIL&utm_medium=organic','','unknown']
]){
 const test=visit({url:'https://reviewremoval.ca/'+url,referrer});assert.equal(test.get(),expected,url+' '+referrer);
 assert.ok(!/PRIVATE|LOCAL_CLICK|https:/.test(JSON.stringify([...test.store])),'Only coarse enums/expiry stored');checks++;
}
const noConsent=visit({url:'https://reviewremoval.ca/?gclid=LOCAL_CLICK',consent:{analyticsConsent:false,advertisingConsent:false}});
assert.equal(noConsent.get(),'unknown');assert.equal(noConsent.store.size,0);
noConsent.consent.advertisingConsent=true;assert.equal(noConsent.get(),'paid_google');
const carried=visit({url:'https://reviewremoval.ca/remove-yelp-reviews.html',referrer:'https://reviewremoval.ca/',store:noConsent.store});
assert.equal(carried.get(),'paid_google');
carried.consent.advertisingConsent=false;assert.equal(carried.get(),'unknown');assert.equal(carried.store.size,0);checks+=5;
const analyticOnly=visit({url:'https://reviewremoval.ca/?gclid=LOCAL_CLICK',referrer:'https://google.com/',consent:{analyticsConsent:true,advertisingConsent:false}});
assert.equal(analyticOnly.get(),'unknown');checks++;
const late=visit({referrer:'https://google.com/'});late.tick(30*60*1000);assert.equal(late.get(),'unknown');assert.equal(late.store.size,0);checks++;
const blocked=visit({url:'https://reviewremoval.ca/?gclid=LOCAL_CLICK',blocked:true});assert.equal(blocked.get(),'paid_google');checks++;
for(const record of [{source:'PRIVATE_EMAIL',expires:1000001},{source:'paid_google',expires:999999},{source:'paid_google',expires:99999999}]){
 const test=visit({store:new Map([['reviewremoval.lead-source.v1',JSON.stringify(record)]])});assert.equal(test.get(),'unknown');assert.equal(test.store.size,0);checks++;
}
const switched=visit({referrer:'https://www.bing.com/',store:visit({url:'https://reviewremoval.ca/?gclid=OLD_CLICK'}).store});assert.equal(switched.get(),'organic_bing');checks++;

const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const test of [{query:'?gclid=LOCAL_CLICK',referrer:'https://www.google.com/',accept:true,want:'paid_google'},
                   {query:'',referrer:'https://www.google.ca/',accept:true,want:'organic_google'},
                   {query:'?gclid=LOCAL_CLICK',referrer:'https://www.google.com/',accept:false,want:'unknown'}]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),posts=[],errors=[];
  // Local HTTP previews suppress HTTPS search referrers on downgrade. Supply
  // that landing-only browser fixture; never visit a real search engine.
  await page.evaluateOnNewDocument((landing,referrer)=>{
   if(location.href===landing)Object.defineProperty(document,'referrer',{get:()=>referrer});
  },base+'/'+test.query,test.referrer);
  page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
  page.on('request',r=>{
   if(isTurnstileApi(r.url()))return r.respond({status:200,contentType:'text/javascript',body:turnstileApiFixture});
   if(r.url().startsWith('https://script.google.com/')&&r.method()==='POST'){
    posts.push(r.postData()||'');return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"success","notification_sent":true}'});
   }
   if(r.url().startsWith(base)&&r.method()==='GET')return r.continue();r.abort();
  });
  await page.goto(base+test.query,{referer:test.referrer,waitUntil:'load'});
  await page.click('#measurement-preferences [data-choice="'+(test.accept?'accept':'reject')+'"]');
  if(test.accept){
   await page.goto(base+'/blog/index.html',{waitUntil:'load'});
   await page.goto(base+'/',{waitUntil:'load'});
  }
  await completeSecurityCheck(page);
  await page.evaluate(()=>{
   const originalFetch=window.fetch;
   window.fetch=(url,options)=>{
    if(String(url).startsWith('https://script.google.com/'))window.__leadSourcePayload=Object.fromEntries(options.body);
    return originalFetch(url,options);
   };
   const f=document.querySelector('#assessment-form');
   for(const [name,value] of Object.entries({full_name:'Local Test',business_name:'Test Business',email_address:'local-test@example.invalid',reason:'Local mocked attribution check'}))f.elements[name].value=value;
   f.requestSubmit();
  });
  await page.waitForSelector('#submission-success:not([hidden])');
  const payload=await page.evaluate(()=>window.__leadSourcePayload);
  assert.equal(posts.length,1);assert.equal(payload.traffic_source,test.want,'Source enum included in submitted FormData');
  const label={paid_google:'Paid - Google Ads',organic_google:'Organic - Google',unknown:'Direct / unknown'}[test.want];
  assert.ok(payload.reason.startsWith('[Traffic Source: '+label+']\n'),'Existing Reason must expose the label to legacy emails and sheets');
  assert.ok(!JSON.stringify(payload).includes('LOCAL_CLICK'),'Raw advertising ID is not sent with lead');
  assert.deepEqual(errors,[]);await context.close();checks++;
 }
 console.log('PASS: '+checks+' source/consent/storage cases, including three mocked successful form submissions, paid/organic navigation carryover and consent rejection. No real leads or Google collection.');
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
