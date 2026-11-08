// Backend and browser security regression tests. No real leads, mail or secrets.
const fs = require('node:fs'),
    path = require('node:path'),
    vm = require('node:vm');
const http = require('node:http'),
    assert = require('node:assert/strict'),
    puppeteer = require('puppeteer');
const { turnstileApiFixture, isTurnstileApi, completeSecurityCheck } = require('./turnstile-test-fixture.cjs');
const root = __dirname;
const source = fs.readFileSync(path.join(root, 'google-apps-script.gs'), 'utf8');
const protectedEndpoint = 'https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec';
const sharedEndpoint = 'https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec';
const formPages = ['index.html', 'remove-yelp-reviews.html', 'remove-facebook-reviews.html',
    'remove-trustpilot-reviews.html', 'remove-tripadvisor-reviews.html',
    'remove-booking-com-reviews.html', 'remove-glassdoor-reviews.html', 'remove-indeed-reviews.html'];
const formScript = 'script.js?v=20261107-lead-source';
const frontend = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const ruleBlock = value => value.match(/\/\/ BEGIN LEAD INPUT RULES[\s\S]*?\/\/ END LEAD INPUT RULES/)[0];
assert.equal(ruleBlock(frontend), ruleBlock(source), 'Browser and backend input rules must agree');
assert.ok(frontend.includes("const endpoint = '" + protectedEndpoint + "';"), 'Requests must use the tested ReviewRemoval deployment');
assert.ok(!frontend.includes(sharedEndpoint), 'No fallback to the unprotected shared deployment');
for (const file of formPages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.deepEqual([...html.matchAll(/<script\b[^>]*\bsrc="(script\.js(?:\?[^"]*)?)"/g)].map(match => match[1]), [formScript], file + ': fresh form runtime required');
    assert.ok(html.includes('data-sitekey="0x4AAAAAAFy2ZmcJCPhgxNBL"'), file + ': existing widget required');
    assert.ok(!html.includes(sharedEndpoint), file + ': no old form destination');
    if (file === 'index.html') assert.ok(html.includes('action="' + protectedEndpoint + '"'), 'Native action and JavaScript must agree');
}
assert.ok(fs.readFileSync(path.join(root, 'build-platform-pages.cjs'), 'utf8').includes('src="' + formScript + '"'), 'Generated forms must retain the cache version');
let cases = 0;

function backend({ properties, provider, responseCode = 200, malformed = false, mailFailure = false, missingSheet = false, badHeaders = false, sharedState, lockUnavailable = false, propertyFailure = false, onClaim, clock = {now: Date.now()} } = {}) {
    const calls = { verify: [], sheets: 0, rows: [], mail: 0, mailBodies: [], claims: [], releases: 0 };
    const used = new Set();
    const state = sharedState || {properties: {...(properties || {
        TURNSTILE_SECRET: 'LOCAL_TEST_SECRET', TURNSTILE_HOSTNAMES: 'reviewremoval.ca,www.reviewremoval.ca',
        SPREADSHEET_ID: 'LOCAL_SHEET_ID', SHEET_NAME: 'Leads', NOTIFICATION_EMAIL: 'test@example.invalid'
    })}, locked: false};
    const context = {
        Date: class extends Date { static now() { return clock.now; } },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: name => state.properties[name] || null,
                getProperties: () => ({...state.properties}),
                setProperty(name, value) {
                    assert.equal(state.locked, true, 'Replay markers must be written under the shared lock');
                    assert.match(name, /^TURNSTILE_USED_[a-f0-9]{64}$/);
                    if (propertyFailure) throw Error('local property failure');
                    if (onClaim) onClaim();
                    state.properties[name] = value; calls.claims.push({name, value});
                },
                deleteProperty(name) {
                    assert.equal(state.locked, true);
                    assert.match(name, /^TURNSTILE_USED_[a-f0-9]{64}$/);
                    delete state.properties[name];
                }
            })
        },
        LockService: {getScriptLock: () => ({
            tryLock(timeout) {
                assert.equal(timeout, 10000);
                if (lockUnavailable || state.locked) return false;
                state.locked = true; return true;
            },
            releaseLock() {assert.equal(state.locked, true); state.locked = false; calls.releases++;}
        })},
        Utilities: {
            DigestAlgorithm: {SHA_256: 'SHA_256'}, Charset: {UTF_8: 'UTF_8'},
            computeDigest(algorithm, token, encoding) {
                assert.equal(algorithm, 'SHA_256'); assert.equal(encoding, 'UTF_8');
                return [...require('node:crypto').createHash('sha256').update(token).digest()].map(byte=>byte>127?byte-256:byte);
            }
        },
        UrlFetchApp: {
            fetch(url, options) {
                assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
                assert.equal(options.method, 'post');
                assert.equal(options.followRedirects, false);
                assert.deepEqual(Object.keys(options.payload).sort(), ['response', 'secret']);
                calls.verify.push(options);
                const result = provider ? provider() : options.payload.response === 'XXXX.DUMMY.TOKEN.XXXX' ?
                    { success: false, 'error-codes': ['invalid-input-response'] } : used.has(options.payload.response) ?
                    { success: false, 'error-codes': ['timeout-or-duplicate'] } :
                    { success: true, action: 'quote_request', hostname: 'reviewremoval.ca' };
                used.add(options.payload.response);
                return { getResponseCode: () => responseCode, getContentText: () => malformed ? 'bad json' : JSON.stringify(result) };
            }
        },
        SpreadsheetApp: {
            openById(id) {
                calls.sheets++;
                assert.equal(id, 'LOCAL_SHEET_ID');
                return {
                    getSheetByName(name) {
                        assert.equal(name, 'Leads');
                        return missingSheet ? null : {
                            appendRow: row => calls.rows.push(row),
                            getRange: () => ({ getValues: () => [badHeaders ? [] : ['Timestamp', 'Selected Plan', 'Full Name', 'Business Name', 'Email', 'Phone', 'Preferred Contact', 'Contact Detail', 'Profile URL', 'Review Count', 'Review Links', 'Reason', 'Traffic Source']] })
                        };
                    }
                };
            }
        },
        Session: { getEffectiveUser: () => ({ getEmail: () => 'test@example.invalid' }) },
        MailApp: { sendEmail(to, subject, body) { calls.mail++; calls.mailBodies.push(body); if (mailFailure) throw Error('local mail test'); } },
        ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
        console: { error() {}, log() {} }
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { calls, state, post: parameter => context.doPost({ parameter }), check: () => context.checkReviewRemovalSetup() };
}
const payload = { 'cf-turnstile-response': 'LOCAL_TOKEN', full_name: '=formula', business_name: 'Test Business', email_address: 'private@example.invalid', reason: 'private review text', selected_plan: 'Existing plan', review_count: '2' };

for (const [overrides, field] of [
    [{full_name:'$4,000 PROMO https://www.google.com/share.google?q=TEST'},'full_name'],
    [{full_name:'\uFF04 Bonus'},'full_name'], [{full_name:'\uFE69 Bonus'},'full_name'],
    [{full_name:'https://example.invalid'},'full_name'], [{full_name:'www.example.invalid'},'full_name'],
    [{full_name:'John\nSmith'},'full_name'], [{full_name:'12345'},'full_name'],
    [{full_name:'A'.repeat(151)},'full_name'], [{full_name:' '},'full_name'],
    [{business_name:'https://example.invalid'},'business_name'], [{business_name:'Shop\nName'},'business_name'],
    [{business_name:' '},'business_name'], [{business_name:'A'.repeat(251)},'business_name'],
    [{email_address:'bot@fldubai.com'},'email_address'], [{email_address:' BOT@FLDUBAI.COM '},'email_address'],
    [{email_address:'bot@sub.fldubai.com'},'email_address'], [{contact_detail:'bot@fldubai.com'},'email_address'],
    [{email_address:'a\u0000b@example.ca'},'email_address'], [{email_address:'invalid-email'},'email_address'],
    ...['rbka80','2.5','0','51',''].map(review_count=>[{review_count},'review_count']),
    [{business_url:'https://www.google.com/share.google?q=TEST'},'business_url'],
    [{business_url:'https://google.com/%73hare.google?q=TEST'},'business_url'],
    [{business_url:'javascript:alert(1)'},'business_url'], [{business_url:'https://user:pass@example.ca'},'business_url'],
    [{business_url:'https://example.ca/'+ 'a'.repeat(2048)},'business_url'],
    [{reason:'a'.repeat(20001)},'reason'], [{review_links:'a'.repeat(12001)},'review_links'],
    [{phone_number:'1'.repeat(81)},'phone_number']
]) {
    const invalid = backend(), result = invalid.post({...payload,...overrides});
    assert.equal(result.code,'invalid_input',JSON.stringify(overrides));
    assert.equal(result.field,field); assert.equal(invalid.calls.sheets,0); assert.equal(invalid.calls.mail,0);
    cases++;
}
for (const full_name of ["\u00c9lodie O'Neill",'Jean-Luc St. Pierre','\u674e','\u9648\u4f1f','\u0645\u062d\u0645\u062f \u0639\u0644\u064a','\u0906\u0930\u0935 \u0936\u0930\u094d\u092e\u093e','A. Com']) {
    const normal = backend();
    assert.equal(normal.post({...payload,full_name,business_name:'$5 Pizza & Caf\u00e9 Inc.',email_address:'owner+quote@gmail.com',business_url:'',review_links:'',reason:'The review contains $4,000 casino bonus text and https://www.google.com/share.google?q=EVIDENCE'}).result,'success',full_name);
    assert.equal(normal.calls.rows.length,1); cases++;
}
for (const email_address of ['owner@notfldubai.com','owner@fldubai.com.example.ca','owner+case@outlook.com']) {
    assert.equal(backend().post({...payload,email_address,business_url:'https://share.google/real-profile'}).result,'success'); cases++;
}

function reject(options, data = payload) {
    const app = backend(options),
        result = app.post(data);
    assert.equal(result.result, 'error');
    assert.equal(result.code, 'verification_failed');
    assert.equal(app.calls.sheets, 0);
    assert.equal(app.calls.mail, 0);
    assert.equal(JSON.stringify(result).includes('LOCAL_TEST_SECRET'), false);
    cases++;
    return app;
}
for (const token of[undefined, '', ' ', 12, ['token'], 'x'.repeat(2049)]) {
    assert.equal(reject({}, {...payload, 'cf-turnstile-response': token }).calls.verify.length, 0);
}
for (const properties of[{}, { TURNSTILE_SECRET: ' ' }, { TURNSTILE_SECRET: 'LOCAL' }, { TURNSTILE_SECRET: 'LOCAL', TURNSTILE_HOSTNAMES: 'localhost' }, { TURNSTILE_SECRET: 'LOCAL', TURNSTILE_HOSTNAMES: 'reviewremoval.ca,127.0.0.1' }, { TURNSTILE_SECRET: 'LOCAL', TURNSTILE_HOSTNAMES: 'reviewsboost.ca' }]) reject({ properties });
for (const result of[null, {}, { success: false }, { success: 'true', action: 'quote_request', hostname: 'reviewremoval.ca' }, { success: true, action: 'login', hostname: 'reviewremoval.ca' },
        ...['reviewsboost.ca', 'reviewremoval.ca.attacker.example', 'localhost', '127.0.0.1'].map(hostname => ({ success: true, action: 'quote_request', hostname }))]) reject({ provider: () => result });
reject({ provider: () => { throw Error('provider unavailable'); } });
reject({ malformed: true });
reject({ responseCode: 503 });
reject({}, { selected_plan: 'ReviewsBoost', submission_page: 'https://reviewsboost.ca/', action: 'quote_request' });
const app = backend();
assert.equal(app.post(payload).result, 'success');
assert.equal(app.calls.rows.length, 1);
assert.equal(app.calls.rows[0][12], 'Direct / unknown', 'Older clients keep submitting without attribution');
for (const [traffic_source, label] of [
    ['paid_google','Paid - Google Ads'], ['paid_other','Paid - Other campaign'],
    ['organic_google','Organic - Google'], ['organic_bing','Organic - Bing'],
    ['organic_other','Organic - Other search'], ['referral','Referral / other'],
    ['=HYPERLINK("private")','Direct / unknown'], ['__proto__','Direct / unknown'],
    [{source:'paid_google'},'Direct / unknown']
]) {
    const attributed=backend();assert.equal(attributed.post({...payload,traffic_source}).result,'success');
    assert.equal(attributed.calls.rows[0].length,13);assert.equal(attributed.calls.rows[0][12],label);
    assert.ok(attributed.calls.mailBodies[0].includes('Traffic Source: '+label+'\n'));cases++;
}
assert.equal(app.calls.mail, 1);
assert.equal(app.calls.rows[0][2], "'=formula", 'Existing spreadsheet formula protection is preserved');
assert.equal(app.post(payload).code, 'verification_failed', 'Provider replay rejection must prevent another lead');
assert.equal(app.calls.rows.length, 1);
assert.equal(app.calls.mail, 1);
cases += 2;
// Even an unexpected second provider success must not save or notify twice.
const providerAlwaysAccepts = () => ({success:true, action:'quote_request', hostname:'reviewremoval.ca'});
const guarded = backend({provider: providerAlwaysAccepts});
assert.equal(guarded.post(payload).result,'success');
assert.equal(guarded.post(payload).code,'verification_failed');
assert.equal(guarded.calls.rows.length,1); assert.equal(guarded.calls.mail,1);
assert.equal(guarded.calls.claims.length,1); assert.equal(guarded.calls.releases,2);
assert.equal(JSON.stringify(guarded.calls.claims).includes('LOCAL_TOKEN'),false,'Never persist raw tokens');
const otherExecution = backend({provider:providerAlwaysAccepts, sharedState:guarded.state});
assert.equal(otherExecution.post({...payload, full_name:'Different posted fields'}).code,'verification_failed');
assert.equal(otherExecution.calls.rows.length,0,'Replay protection persists across execution contexts');
assert.equal(otherExecution.calls.mail,0);
assert.equal(otherExecution.post({...payload,'cf-turnstile-response':'ANOTHER_TOKEN'}).result,'success','A fresh verified token can submit');
cases += 3;
reject({provider:providerAlwaysAccepts, lockUnavailable:true});
const persistenceFailure=reject({provider:providerAlwaysAccepts, propertyFailure:true});
assert.equal(persistenceFailure.state.locked,false,'Release the lock after a failed write');
// A second request arriving inside the first claim cannot pass the held lock.
let concurrent;
const firstExecution=backend({provider:providerAlwaysAccepts,onClaim(){assert.equal(concurrent.post(payload).code,'verification_failed');}});
concurrent=backend({provider:providerAlwaysAccepts,sharedState:firstExecution.state});
assert.equal(firstExecution.post(payload).result,'success');
assert.equal(firstExecution.calls.rows.length,1); assert.equal(concurrent.calls.rows.length,0);
cases++;
// Expired markers are pruned without changing secrets or configuration.
const markerClock={now:Date.now()};
const pruning=backend({provider:providerAlwaysAccepts,clock:markerClock});
pruning.state.properties.TURNSTILE_USED_KEEP_SETTING='not a runtime hash marker';
assert.equal(pruning.post(payload).result,'success');
const expiredMarker=pruning.calls.claims[0].name;
markerClock.now+=6*60*1000+1;
assert.equal(pruning.post({...payload,'cf-turnstile-response':'FRESH_AFTER_EXPIRY'}).result,'success');
assert.equal(pruning.state.properties[expiredMarker],undefined);
assert.equal(pruning.state.properties.TURNSTILE_SECRET,'LOCAL_TEST_SECRET');
assert.equal(pruning.state.properties.TURNSTILE_USED_KEEP_SETTING,'not a runtime hash marker');
cases++;
const notification = backend({ mailFailure: true });
assert.equal(notification.post(payload).notification_sent, false);
assert.equal(notification.calls.rows.length, 1);
cases++;
const configured = { TURNSTILE_SECRET: 'LOCAL_TEST_SECRET', TURNSTILE_HOSTNAMES: 'reviewremoval.ca', SPREADSHEET_ID: 'LOCAL_SHEET_ID', SHEET_NAME: 'Leads', NOTIFICATION_EMAIL: 'test@example.invalid' };
for (const name of['SPREADSHEET_ID', 'SHEET_NAME']) {
    const broken = backend({ properties: {...configured, [name]: '' } });
    assert.equal(broken.post(payload).result, 'error');
    assert.equal(broken.calls.sheets, 0);
    assert.equal(broken.calls.rows.length, 0);
    assert.equal(broken.calls.mail, 0);
    cases++;
}
const absentTab = backend({ missingSheet: true });
assert.equal(absentTab.post(payload).result, 'error');
assert.equal(absentTab.calls.rows.length, 0);
assert.equal(absentTab.calls.mail, 0);
cases++;
const setup = backend();
assert.equal(setup.check().configuration, 'passed');
assert.equal(setup.calls.rows.length, 0);
assert.equal(setup.calls.mail, 0);
cases++;
for (const name of Object.keys(configured)) {
    const broken = backend({ properties: {...configured, [name]: '' } });
    assert.throws(() => broken.check(), new RegExp(name));
    assert.equal(broken.calls.rows.length, 0);
    assert.equal(broken.calls.mail, 0);
    cases++;
}
assert.throws(() => backend({ badHeaders: true }).check(), /Traffic Source in M1/);
cases++;
assert.throws(() => backend({ provider: () => ({ success: false, 'error-codes': ['invalid-input-secret'] }) }).check(), /secret check failed/);
cases++;
console.log(`PASS: ${cases} backend cases; token/action/hostname checks, spam/domain/input rejection before storage/mail, international names and optional links, replay protection and existing lead handling.`);

const server = http.createServer((req, res) => {
    if (req.method !== 'GET') { res.writeHead(405).end(); return; }
    const file = path.resolve(root, '.' + (new URL(req.url, 'http://local').pathname === '/' ? '/index.html' : new URL(req.url, 'http://local').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    });
});
(async() => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/`;
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
        const page = await browser.newPage(),
            errors = [],
            externalPosts = [];
        let blocked = false,
            apiLoads = 0;
        await page.setViewport({ width: 390, height: 844 });
        await page.setRequestInterception(true);
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', request => {
            if (request.method() !== 'GET') { externalPosts.push(request.url());
                request.abort(); } else if (isTurnstileApi(request.url())) { apiLoads++;
                blocked ? request.abort() : request.respond({ status: 200, contentType: 'text/javascript', body: turnstileApiFixture }); } else if (request.url().startsWith(base)) request.continue();
            else request.abort();
        });
        await page.goto(base, { waitUntil: 'load' });
        assert.equal(apiLoads, 0, 'Widget must not load on the first screen');
        await page.evaluate(() => {
            const form = document.querySelector('#assessment-form');
            for (const [name, value] of Object.entries({ full_name: 'Local Test', business_name: 'Test Business', email_address: 'local@example.invalid', business_url: 'https://example.invalid/' })) form.elements[name].value = value;
            window.__sent = [];
            window.__targets = [];
            window.__mode = 'reject';
            window.__leads = 0;
            window.ReviewRemovalMeasurement = { confirmedLead() { window.__leads++; } };
            window.fetch = async(url, options) => {
                window.__targets.push(String(url));
                window.__sent.push(options.body.toString());
                if (window.__mode === 'network') throw Error('local network error');
                return { ok: true, json: async() => window.__mode === 'success' ? { result: 'success' } : window.__mode === 'invalid_input' ? { result: 'error', code: 'invalid_input', field: 'email_address' } : { result: 'error', code: 'verification_failed' } };
            };
            form.requestSubmit();
        });
        assert.equal(await page.evaluate(() => window.__sent.length), 0, 'No token means no POST');
        await completeSecurityCheck(page);
        assert.equal(await page.evaluate(() => window.__turnstileFixture.sitekey), '0x4AAAAAAFy2ZmcJCPhgxNBL');
        assert.equal(await page.evaluate(() => window.__turnstileFixture.action), 'quote_request');
        assert.equal(await page.$$eval('input[name="cf-turnstile-response"]', nodes => nodes.length), 1);
        for (const [name, bad, good] of [
            ['full_name','$4,000 PROMO https://example.invalid','Local Test'],
            ['email_address','bot@sub.fldubai.com','local@example.invalid'],
            ['business_url','https://www.google.com/share.google?q=TEST','https://example.invalid/']
        ]) {
            await page.evaluate(({name,value})=>{const f=document.querySelector('form'),input=f.elements.namedItem(name);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));f.requestSubmit();},{name,value:bad});
            assert.equal(await page.evaluate(()=>window.__sent.length),0,'Invalid input must not be sent even with a valid token');
            assert.equal(await page.$eval('[name="'+name+'"]',input=>input.checkValidity()),false);
            assert.equal(await page.$eval('[name="'+name+'"]',input=>input.value),bad,'Keep invalid answers available to correct');
            await page.evaluate(({name,value})=>{const input=document.querySelector('form').elements.namedItem(name);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},{name,value:good});
        }
        await page.evaluate(() => { window.__turnstileFixture.expire();
            document.querySelector('form').requestSubmit(); });
        assert.equal(await page.evaluate(() => window.__sent.length), 0, 'Expired tokens cannot be submitted');
        await page.click('#verification-retry');
        await completeSecurityCheck(page);
        await page.evaluate(() => document.querySelector('form').requestSubmit());
        await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('was not accepted'));
        assert.equal(await page.evaluate(() => window.__leads), 0);
        assert.equal(await page.$eval('[name="full_name"]', node => node.value), 'Local Test');
        await completeSecurityCheck(page);
        await page.evaluate(()=>{window.__mode='invalid_input';document.querySelector('form').requestSubmit();});
        await page.waitForFunction(()=>document.querySelector('#form-message').textContent.includes('check your details'));
        assert.equal(await page.evaluate(()=>window.__leads),0,'A definitive input rejection is not a lead');
        assert.equal(await page.$eval('[name="email_address"]',input=>input.checkValidity()),false);
        await page.$eval('[name="email_address"]',input=>{input.value='local+retry@example.invalid';input.dispatchEvent(new Event('input',{bubbles:true}));});
        await completeSecurityCheck(page);
        await page.evaluate(() => { window.__mode = 'network';
            document.querySelector('form').requestSubmit(); });
        await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('could not confirm'));
        await completeSecurityCheck(page);
        await page.evaluate(() => { window.__mode = 'success';
            document.querySelector('form').requestSubmit(); });
        await page.waitForSelector('#submission-success:not([hidden])');
        assert.equal(await page.evaluate(() => window.__leads), 1);
        const tokens = await page.evaluate(() => window.__sent.map(body => new URLSearchParams(body).get('cf-turnstile-response')));
        assert.equal(tokens.length, 4);
        assert.equal(new Set(tokens).size, 4, 'Every retry uses a fresh token');
        assert.deepEqual(await page.evaluate(() => window.__targets), Array(4).fill(protectedEndpoint), 'Security/input rejection, network error and success all use the separate backend');
        assert.ok(await page.evaluate(() => window.__turnstileFixture.resets >= 4));
        blocked = true;
        await page.goto(base, { waitUntil: 'load' });
        await page.focus('[name="full_name"]');
        await page.waitForSelector('#verification-retry:not([hidden])');
        blocked = false;
        await page.click('#verification-retry');
        await completeSecurityCheck(page);
        for (const width of[320, 390, 768, 1440, 320]) {
            await page.setViewport({ width, height: 900 });
            await completeSecurityCheck(page);
            await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
        }
        await page.setViewport({ width: 1440, height: 900 });
        await page.waitForFunction(() => document.querySelector('#assessment-verification').style.minHeight === '65px');
        await completeSecurityCheck(page);
        await page.evaluate(() => {
            const form = document.querySelector('form');
            for (const [name, value] of Object.entries({ full_name: 'Local Test', business_name: 'Test', email_address: 'test@example.invalid', business_url: 'https://example.invalid/' })) form.elements[name].value = value;
            window.fetch = () => new Promise(resolve => { window.__finishRequest = () => resolve({ ok: true, json: async() => ({ result: 'error', code: 'verification_failed' }) }); });
            form.requestSubmit();
        });
        await page.waitForFunction(() => Boolean(window.__finishRequest));
        await page.setViewport({ width: 320, height: 900 });
        await page.evaluate(() => window.__finishRequest());
        await page.waitForFunction(() => document.querySelector('#assessment-verification').style.minHeight === '140px' && document.documentElement.scrollWidth <= innerWidth + 1);
        const output = path.join(root, '.seo-private', 'turnstile-2026-11-03');
        fs.mkdirSync(output, { recursive: true });
        await page.$eval('.form-verification', element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
        await page.screenshot({ path: path.join(output, 'form-320.png') });
        await page.goto(base + 'about.html', { waitUntil: 'load' });
        assert.equal(await page.$$eval('script[src*="challenges.cloudflare.com"]', nodes => nodes.length), 0);
        assert.deepEqual(errors, []);
        assert.deepEqual(externalPosts, []);
        console.log('PASS: all eight forms use the separate tested backend and fresh script; lazy loading, token gate, expiration, script failure/retry, fresh tokens after rejection/network/success, lead tracking, responsive widget, no loader on other pages. All provider responses mocked; zero real submissions.');
    } finally {
        if (browser) await browser.close();
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error);
    process.exitCode = 1; });
