/* Optional live source check. Requires Puppeteer and Chrome; no sign-in or submissions.
   Run from this repository: node blog/data/collect-google-removal-sources.cjs
   Captures stay in the ignored .seo-private/maps-source directory.
   A changed live display fails rather than silently revising the published dataset. */
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer');
const input=require('./google-removal-source-values-2026.json');
const output=path.resolve(__dirname,'../../.seo-private/maps-source');
const labels={reviews_published:'Total reviews published',media_published:'Total photos and videos published',edits_published:'Total place edits published',reviews_removed:'Total reviews removed',media_removed:'Total photos and videos removed',edits_removed:'Total place edits removed',accounts_restricted:'Total accounts restricted',profiles_removed:'Total business profiles removed'};
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const chrome=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  const browser=await puppeteer.launch({headless:true,executablePath:chrome});
  try{
    const page=await browser.newPage();await page.setRequestInterception(true);
    page.on('request',request=>/google-analytics\.com|googletagmanager\.com/.test(request.url())?request.abort():request.continue());
    for(const y of input.years)for(const section of ['overview','enforcement']){
      await page.goto(y.sources[section].url,{waitUntil:'networkidle2',timeout:45000});
      await page.waitForSelector('mat-select',{timeout:15000});
      const selected=await page.$$eval('mat-select',els=>els.map(e=>e.innerText.trim()));
      assert.ok(selected.every(value=>value===String(y.year)),'Source year state changed; select and re-audit manually.');
      const text=await page.$eval('body',e=>e.innerText);
      for(const [metric,display] of Object.entries(y.metrics))if((metric.endsWith('_published')?'overview':'enforcement')===section)assert.ok(text.includes(labels[metric]+'\n'+display),'Live source changed: '+metric);
      if(section==='enforcement')for(const [label,display] of Object.entries(y.reasons))assert.ok(text.includes(label+'\t'+display),'Live reason changed: '+label);
      // Save matching values to a new check file; keep release fingerprints intact.
      fs.writeFileSync(path.join(output,section+'-'+y.year+'-live-check.txt'),text);
      console.log(section,y.year,'values match; body text SHA-256',createHash('sha256').update(text).digest('hex'));
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
