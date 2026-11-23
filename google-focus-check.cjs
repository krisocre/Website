const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const puppeteer=require('C:/Users/alkhi/node_modules/puppeteer');
const {planFor}=require('./google-evidence-planner.js');
const guides=require('./google-guides.cjs');
const root=__dirname;
assert.match(planFor('negative','declined').action,/customer concern/);
assert.equal(planFor('extortion','pending').route,'https://support.google.com/business/answer/16404809');
assert.match(planFor('fake','pending').action,/existing report status/);
assert.match(planFor('conflict','appealed').action,/decision emails/);
assert.throws(()=>planFor('not-a-concern','new'),RangeError);
const output=path.join(root,'.seo-private','previews');fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setRequestInterception(true);page.on('request',request=>request.url().startsWith('file:')||request.url().startsWith('data:')?request.continue():request.abort());
    for(const file of ['index.html',...guides.map(g=>g.file)]){
      await page.goto('file:///'+path.join(root,file).replaceAll('\\','/'),{waitUntil:'load'});
      if(file==='google-review-removal-checker.html'){
        await page.evaluate(()=>{
          window.__checkerRequests=[];
          window.fetch=async(url,options)=>{
            if(url!=='/api/review-check')throw new Error('Unexpected checker request');
            const input=JSON.parse(options.body);window.__checkerRequests.push(input);
            return {ok:true,json:async()=>({outcome:input.remaining?'unclear':'possible',policy:'fake',questions:['experience','duplicates','connection'],excerpt:''})};
          };
        });
        await page.type('#policy-check-input','They described a service we do not offer.');
        await page.click('#policy-check-form button');
        await page.waitForSelector('#policy-follow-up:not([hidden])');
        assert.equal(await page.$eval('#policy-follow-up-step',el=>el.textContent),'Follow-up 1 of 2');
        await page.click('#policy-follow-up-body button');
        assert.equal(await page.$eval('#policy-follow-up-step',el=>el.textContent),'Follow-up 2 of 2');
        await page.click('#policy-follow-up-body button');
        await page.waitForSelector('#policy-check-result:not([hidden])');
        assert.equal(await page.$eval('#policy-result-source',el=>el.textContent),'AI policy estimate');
        assert.equal(await page.$eval('#policy-follow-up',el=>el.hidden),true);
        assert.deepEqual(await page.evaluate(()=>window.__checkerRequests.map(r=>r.remaining)),[2,0]);
        await page.$eval('#policy-check-input',el=>{el.value='https://maps.app.goo.gl/Example123';el.dispatchEvent(new Event('input',{bubbles:true}));});
        await page.click('#policy-check-form button');
        await page.waitForSelector('#policy-follow-up-wording');
        await page.click('#policy-follow-up-body button:last-child');
        assert.equal(await page.$eval('#policy-follow-up-step',el=>el.textContent),'Follow-up 2 of 2');
        await page.click('.policy-follow-up-options button:first-child');
        assert.equal(await page.$eval('#policy-result-source',el=>el.textContent),'Guided policy estimate');
        assert.match(await page.$eval('#policy-result-title',el=>el.textContent),/policy issue/);
        assert.equal(await page.evaluate(()=>window.__checkerRequests.length),2,'A link alone does not reach AI');
        await page.select('#google-concern','negative');await page.select('#google-stage','declined');await page.click('#google-evidence-form button[type="submit"]');
        assert.match(await page.$eval('#google-evidence-result',el=>el.textContent),/customer concern/);
        await page.select('#google-concern','extortion');await page.click('#google-evidence-form button[type="submit"]');
        assert.equal(await page.$eval('#google-evidence-result a',el=>el.href),'https://support.google.com/business/answer/16404809');
        await page.evaluate(()=>{
          const original=URL.createObjectURL;URL.createObjectURL=blob=>{window.__worksheetBlob=blob;return original(blob);};
          HTMLAnchorElement.prototype.click=function(){};
        });
        await page.click('#google-evidence-result button');
        const worksheet=await page.evaluate(()=>window.__worksheetBlob.text());
        assert.match(worksheet,/A demand for payment or favours/);assert.match(worksheet,/Business name:/);assert.match(worksheet,/16404809/);
        await page.select('#google-concern','fake');await page.select('#google-stage','pending');await page.click('#google-evidence-form button[type="submit"]');
        assert.match(await page.$eval('#google-evidence-result',el=>el.textContent),/existing report status/);
      }
      for(const width of [1440,390,320]){
        await page.setViewport({width,height:930});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' horizontal overflow at '+width);
        if(width!==320){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,path.basename(file,'.html')+'-'+width+'.png')});}
      }
    }
    assert.deepEqual(errors,[],'Browser exceptions');
    await page.setJavaScriptEnabled(false);await page.goto('file:///'+path.join(root,'google-review-removal-checker.html').replaceAll('\\','/'),{waitUntil:'load'});
    assert.equal(await page.$$eval('#concerns + p + .table-scroll tbody tr',els=>els.length),7);
    assert.equal(await page.$$eval('#stages + .table-scroll tbody tr',els=>els.length),4);
    console.log('PASS: Google guide layouts; negative-feedback, extortion and pending-stage paths; worksheet download contents; complete checklists without JavaScript.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
