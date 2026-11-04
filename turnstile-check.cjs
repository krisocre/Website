// Backend and browser security regression tests. No real leads, mail or secrets.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const http = require('node:http'), assert = require('node:assert/strict'), puppeteer = require('puppeteer');
const {turnstileApiFixture, isTurnstileApi, completeSecurityCheck} = require('./turnstile-test-fixture.cjs');
const root = __dirname;
const source = fs.readFileSync(path.join(root, 'google-apps-script.gs'), 'utf8');
let cases = 0;
function backend({properties, provider, responseCode = 200, malformed = false, mailFailure = false} = {}) {
  const calls = {verify: [], sheets: 0, rows: [], mail: 0};
  const used = new Set();
  const context = {
    PropertiesService: {getScriptProperties: () => ({getProperty: name => (properties || {
      TURNSTILE_SECRET: 'LOCAL_TEST_SECRET', TURNSTILE_HOSTNAMES: 'reviewremoval.ca,www.reviewremoval.ca'
    })[name] || null})},
    UrlFetchApp: {fetch(url, options) {
      assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.equal(options.method, 'post'); assert.equal(options.followRedirects, false);
      assert.deepEqual(Object.keys(options.payload).sort(), ['response', 'secret']);
      calls.verify.push(options);
      const result = provider ? provider() : used.has(options.payload.response)
        ? {success: false, 'error-codes': ['timeout-or-duplicate']}
        : {success: true, action: 'quote_request', hostname: 'reviewremoval.ca'};
      used.add(options.payload.response);
      return {getResponseCode: () => responseCode, getContentText: () => malformed ? 'bad json' : JSON.stringify(result)};
    }},
    SpreadsheetApp: {getActiveSpreadsheet() { calls.sheets++; return {getActiveSheet: () => ({appendRow: row => calls.rows.push(row)})}; }},
    Session: {getEffectiveUser: () => ({getEmail: () => 'test@example.invalid'})},
    MailApp: {sendEmail() { calls.mail++; if (mailFailure) throw Error('local mail test'); }},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: text => ({setMimeType: () => JSON.parse(text)})},
    console: {error() {}}
  };
  vm.createContext(context); vm.runInContext(source, context);
  return {calls, post: parameter => context.doPost({parameter})};
}
const payload = {'cf-turnstile-response': 'LOCAL_TOKEN', full_name: '=formula', email_address: 'private@example.invalid', reason: 'private review text', selected_plan: 'Existing plan', review_count: '2'};
function reject(options, data = payload) {
  const app = backend(options), result = app.post(data);
  assert.equal(result.result, 'error'); assert.equal(result.code, 'verification_failed');
  assert.equal(app.calls.sheets, 0); assert.equal(app.calls.mail, 0);
  assert.equal(JSON.stringify(result).includes('LOCAL_TEST_SECRET'), false); cases++;
  return app;
}
for (const token of [undefined, '', ' ', 12, ['token'], 'x'.repeat(2049)]) {
  assert.equal(reject({}, {...payload, 'cf-turnstile-response': token}).calls.verify.length, 0);
}
for (const properties of [{}, {TURNSTILE_SECRET: ' '}, {TURNSTILE_SECRET: 'LOCAL'},
  {TURNSTILE_SECRET: 'LOCAL', TURNSTILE_HOSTNAMES: 'localhost'},
  {TURNSTILE_SECRET: 'LOCAL', TURNSTILE_HOSTNAMES: 'reviewremoval.ca,127.0.0.1'},
  {TURNSTILE_SECRET: 'LOCAL', TURNSTILE_HOSTNAMES: 'reviewsboost.ca'}]) reject({properties});
for (const result of [null, {}, {success: false},
  {success: 'true', action: 'quote_request', hostname: 'reviewremoval.ca'},
  {success: true, action: 'login', hostname: 'reviewremoval.ca'},
  ...['reviewsboost.ca','reviewremoval.ca.attacker.example','localhost','127.0.0.1'].map(hostname => ({success: true, action: 'quote_request', hostname}))]) reject({provider: () => result});
reject({provider: () => { throw Error('provider unavailable'); }});
reject({malformed: true}); reject({responseCode: 503});
reject({}, {selected_plan: 'ReviewsBoost', submission_page: 'https://reviewsboost.ca/', action: 'quote_request'});
const app = backend();
assert.equal(app.post(payload).result, 'success');
assert.equal(app.calls.rows.length, 1); assert.equal(app.calls.mail, 1);
assert.equal(app.calls.rows[0][2], "'=formula", 'Existing spreadsheet formula protection is preserved');
assert.equal(app.post(payload).code, 'verification_failed', 'Provider replay rejection must prevent another lead');
assert.equal(app.calls.rows.length, 1); assert.equal(app.calls.mail, 1); cases += 2;
const notification = backend({mailFailure: true});
assert.equal(notification.post(payload).notification_sent, false);
assert.equal(notification.calls.rows.length, 1); cases++;
console.log(`PASS: ${cases} backend cases; missing/invalid/expired/replayed tokens, action/hostname/config checks, provider failures, zero writes on rejection, existing lead handling.`);

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') { res.writeHead(405).end(); return; }
  const file = path.resolve(root, '.' + (new URL(req.url, 'http://local').pathname === '/' ? '/index.html' : new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type': ({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream'}).end(bytes);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  let browser;
  try {
    browser = await puppeteer.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page = await browser.newPage(), errors = [], externalPosts = [];
    let blocked = false, apiLoads = 0;
    await page.setViewport({width:390,height:844});
    await page.setRequestInterception(true); page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.method() !== 'GET') { externalPosts.push(request.url()); request.abort(); }
      else if (isTurnstileApi(request.url())) { apiLoads++; blocked ? request.abort() : request.respond({status:200,contentType:'text/javascript',body:turnstileApiFixture}); }
      else if (request.url().startsWith(base)) request.continue();
      else request.abort();
    });
    await page.goto(base, {waitUntil:'load'});
    assert.equal(apiLoads, 0, 'Widget must not load on the first screen');
    await page.evaluate(() => {
      const form = document.querySelector('#assessment-form');
      for (const [name,value] of Object.entries({full_name:'Local Test',business_name:'Test Business',email_address:'local@example.invalid',business_url:'https://example.invalid/'})) form.elements[name].value = value;
      window.__sent = []; window.__mode = 'reject'; window.__leads = 0;
      window.ReviewRemovalMeasurement = {confirmedLead() { window.__leads++; }};
      window.fetch = async (url, options) => {
        window.__sent.push(options.body.toString());
        if (window.__mode === 'network') throw Error('local network error');
        return {ok:true,json:async () => window.__mode === 'success' ? {result:'success'} : {result:'error',code:'verification_failed'}};
      };
      form.requestSubmit();
    });
    assert.equal(await page.evaluate(() => window.__sent.length), 0, 'No token means no POST');
    await completeSecurityCheck(page);
    assert.equal(await page.evaluate(() => window.__turnstileFixture.sitekey), '0x4AAAAAAFy2a5sutqdFxytB');
    assert.equal(await page.evaluate(() => window.__turnstileFixture.action), 'quote_request');
    assert.equal(await page.$$eval('input[name="cf-turnstile-response"]', nodes => nodes.length), 1);
    await page.evaluate(() => { window.__turnstileFixture.expire(); document.querySelector('form').requestSubmit(); });
    assert.equal(await page.evaluate(() => window.__sent.length), 0, 'Expired tokens cannot be submitted');
    await page.click('#verification-retry'); await completeSecurityCheck(page);
    await page.evaluate(() => document.querySelector('form').requestSubmit());
    await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('was not accepted'));
    assert.equal(await page.evaluate(() => window.__leads), 0);
    assert.equal(await page.$eval('[name="full_name"]', node => node.value), 'Local Test');
    await completeSecurityCheck(page);
    await page.evaluate(() => { window.__mode='network'; document.querySelector('form').requestSubmit(); });
    await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('could not confirm'));
    await completeSecurityCheck(page);
    await page.evaluate(() => { window.__mode='success'; document.querySelector('form').requestSubmit(); });
    await page.waitForSelector('#submission-success:not([hidden])');
    assert.equal(await page.evaluate(() => window.__leads), 1);
    const tokens = await page.evaluate(() => window.__sent.map(body => new URLSearchParams(body).get('cf-turnstile-response')));
    assert.equal(tokens.length, 3); assert.equal(new Set(tokens).size, 3, 'Every retry uses a fresh token');
    assert.ok(await page.evaluate(() => window.__turnstileFixture.resets >= 4));
    blocked = true; await page.goto(base, {waitUntil:'load'}); await page.focus('[name="full_name"]');
    await page.waitForSelector('#verification-retry:not([hidden])');
    blocked = false; await page.click('#verification-retry'); await completeSecurityCheck(page);
    for (const width of [320,390,768,1440,320]) {
      await page.setViewport({width,height:900}); await completeSecurityCheck(page);
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
    }
    await page.setViewport({width:1440,height:900});
    await page.waitForFunction(() => document.querySelector('#assessment-verification').style.minHeight === '65px');
    await completeSecurityCheck(page);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      for (const [name,value] of Object.entries({full_name:'Local Test',business_name:'Test',email_address:'test@example.invalid',business_url:'https://example.invalid/'})) form.elements[name].value=value;
      window.fetch = () => new Promise(resolve => { window.__finishRequest = () => resolve({ok:true,json:async()=>({result:'error',code:'verification_failed'})}); });
      form.requestSubmit();
    });
    await page.waitForFunction(() => Boolean(window.__finishRequest));
    await page.setViewport({width:320,height:900});
    await page.evaluate(() => window.__finishRequest());
    await page.waitForFunction(() => document.querySelector('#assessment-verification').style.minHeight === '140px' && document.documentElement.scrollWidth <= innerWidth + 1);
    const output = path.join(root, '.seo-private', 'turnstile-2026-11-03'); fs.mkdirSync(output,{recursive:true});
    await page.$eval('.form-verification', element => element.scrollIntoView({behavior:'instant',block:'center'}));
    await page.screenshot({path:path.join(output,'form-320.png')});
    await page.goto(base+'about.html',{waitUntil:'load'});
    assert.equal(await page.$$eval('script[src*="challenges.cloudflare.com"]', nodes => nodes.length), 0);
    assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
    console.log('PASS: lazy loading, token gate, expiration, script failure/retry, fresh tokens after rejection/network/success, lead tracking, responsive widget, no loader on other pages. All provider responses mocked; zero real submissions.');
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode=1; });
