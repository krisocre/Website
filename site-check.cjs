const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require('C:/Users/alkhi/node_modules/puppeteer');

const root = __dirname;
const pages = [
  'index.html', 'platforms.html', 'review-removal-canada.html', 'about.html', 'remove-facebook-reviews.html', 'remove-yelp-reviews.html', 'remove-trustpilot-reviews.html', 'remove-tripadvisor-reviews.html', 'remove-booking-com-reviews.html', 'remove-glassdoor-reviews.html', 'remove-indeed-reviews.html',
  'blog/index.html', 'blog/google-review-moderation-2019-2025.html', 'blog/trustpilot-fake-reviews-by-star-rating.html', 'blog/canadian-tourism-google-reviews-2023.html', 'blog/review-removal-questions-answered.html', 'blog/review-report-evidence-checklist.html', 'blog/yelp-reviews-disappear-reappear-data.html', 'blog/tripadvisor-fake-review-statistics-removal-rates.html'
];
const errors = [];
const titles = new Set();
for (const name of pages) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if (!title || !description || titles.has(title)) errors.push(`${name}: missing or duplicate search metadata`);
  titles.add(title);
}
const homeHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!homeHtml.includes('Google Review Removal Canada') || !homeHtml.includes('id="service-area"') || !homeHtml.includes('id="policy-title"')) errors.push('Homepage search landing content is incomplete');
const googleRows = fs.readFileSync(path.join(root, 'blog/data/google-review-moderation-2019-2025.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
const trustRows = fs.readFileSync(path.join(root, 'blog/data/trustpilot-fake-reviews-by-star-2024.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
const canadaRows = fs.readFileSync(path.join(root, 'blog/data/canadian-sme-online-activities-2023.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
if (googleRows.length !== 7 || googleRows.map(row => Number(row.split(',')[1])).join(',') !== '75,55,95,115,170,240,292') errors.push('Google source table mismatch');
if (trustRows.length !== 5 || trustRows.reduce((sum, row) => sum + Number(row.split(',')[1]), 0) !== 4483000) errors.push('Trustpilot source table mismatch');
if (canadaRows.length !== 7 || !canadaRows.find(row => row.startsWith('Google Reviews,63.8,47.0,16.8,https://www.ised-isde.canada.ca/'))) errors.push('Canadian source table mismatch');
for (const name of ['google-moderation-2019-2025.png', 'trustpilot-fake-reviews-by-star.png', 'canadian-sme-online-activities-2023.png', 'yelp-review-transitions.png', 'tripadvisor-fraud-series.png', 'tripadvisor-screening-2024.png']) {
  const image = fs.readFileSync(path.join(root, 'blog/assets', name));
  if (image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 672) errors.push(`${name}: incorrect sharing image size`);
}

(async () => {
  const browser = await puppeteer.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox']});
  try {
    for (const name of pages) {
      const page = await browser.newPage();
      page.on('pageerror', err => errors.push(`${name}: ${err.message}`));
      await page.goto(`file:///${path.join(root, name).replaceAll('\\','/')}`, {waitUntil: 'load'});
      await page.evaluate(async () => {
        await Promise.all([...document.images].map(img => {
          img.loading = 'eager';
          return img.decode?.().catch(() => {});
        }));
      });
      const links = await page.$$eval('a[href]', nodes => nodes.map(n => n.getAttribute('href')).filter(h => h && !h.startsWith('http') && !h.startsWith('mailto:')));
      for (const link of links) {
        const target = link.split('#')[0];
        const resolved = target ? path.resolve(root, path.dirname(name), target) : path.join(root, name);
        if (target && !fs.existsSync(resolved)) errors.push(`${name}: broken link ${link}`);
        const hash = link.split('#')[1];
        if (hash && fs.existsSync(resolved)) {
          const targetHtml = resolved === path.join(root, name) ? await page.content() : fs.readFileSync(resolved, 'utf8');
          if (!targetHtml.includes(`id="${hash}"`)) errors.push(`${name}: broken anchor ${link}`);
        }
      }
      const pageBasics = await page.evaluate(() => ({h1: document.querySelectorAll('h1').length, description: !!document.querySelector('meta[name="description"]'), badImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.getAttribute('src'))}));
      if (pageBasics.h1 !== 1 || !pageBasics.description || pageBasics.badImages.length) errors.push(`${name}: page basics ${JSON.stringify(pageBasics)}`);
      if (name === 'index.html') {
        const sectionIds = await page.$$eval('main > section', els => els.slice(0,3).map(el => el.id || el.className));
        if (sectionIds[1] !== 'pricing' || sectionIds[2] !== 'quote') errors.push(`${name}: section order ${sectionIds}`);
        const marquee = await page.evaluate(() => ({
          names: [...document.querySelectorAll('.marquee-group:first-child [role="listitem"]')].map(el => el.textContent.trim()),
          animation: getComputedStyle(document.querySelector('.marquee-track')).animationName
        }));
        if (marquee.names.length !== 8 || new Set(marquee.names).size !== 8 || marquee.animation !== 'platform-scroll') errors.push(`${name}: eight-platform banner is incomplete`);
        await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
        const reducedAnimation = await page.$eval('.marquee-track', el => getComputedStyle(el).animationName);
        if (reducedAnimation !== 'none') errors.push(`${name}: banner ignores reduced motion`);
        await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'no-preference'}]);
      }
      for (const width of [1440, 390, 320]) {
        await page.setViewport({width, height: 900, deviceScaleFactor: 1});
        const layout = await page.evaluate(() => ({scroll: document.documentElement.scrollWidth, viewport: innerWidth, heading: document.querySelector('h1')?.getBoundingClientRect().width}));
        if (layout.scroll > layout.viewport + 1) errors.push(`${name} @${width}: horizontal overflow ${layout.scroll}`);
        if (name === 'index.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'home-desktop.png'), fullPage: true});
        if (name === 'index.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'home-desktop-top.png')});
        if (name === 'index.html' && width === 390) await page.screenshot({path: path.join(root, 'previews', 'home-mobile.png'), fullPage: true});
        if (name === 'index.html' && width === 390) await page.screenshot({path: path.join(root, 'previews', 'home-mobile-top.png')});
        if (name === 'about.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'about-desktop.png'), fullPage: true});
        if (name === 'about.html' && width === 390) await page.screenshot({path: path.join(root, 'previews', 'about-mobile-top.png')});
        if (name === 'platforms.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'platforms-desktop.png'), fullPage: true});
        if (name === 'review-removal-canada.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'canada-desktop.png'), fullPage: true});
        if (name === 'review-removal-canada.html' && width === 390) await page.screenshot({path: path.join(root, 'previews', 'canada-mobile.png'), fullPage: true});
        if (name === 'remove-facebook-reviews.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'facebook-desktop.png'), fullPage: true});
        if (name === 'remove-trustpilot-reviews.html' && width === 390) await page.screenshot({path: path.join(root, 'previews', 'trustpilot-mobile.png'), fullPage: true});
        if (name === 'blog/index.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'blog-desktop.png'), fullPage: true});
        if (name === 'blog/google-review-moderation-2019-2025.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'google-study-desktop.png'), fullPage: true});
        if (name === 'blog/trustpilot-fake-reviews-by-star-rating.html' && width === 390) await page.screenshot({path: path.join(root, 'previews', 'trustpilot-study-mobile.png'), fullPage: true});
        if (name === 'blog/yelp-reviews-disappear-reappear-data.html' && width === 1440) await page.screenshot({path:path.join(root,'previews','yelp-research-desktop.png'),fullPage:true});
        if (name === 'blog/yelp-reviews-disappear-reappear-data.html' && width === 390) await page.screenshot({path:path.join(root,'previews','yelp-research-mobile.png'),fullPage:true});
        if (name === 'blog/tripadvisor-fake-review-statistics-removal-rates.html' && width === 1440) await page.screenshot({path:path.join(root,'previews','tripadvisor-research-desktop.png'),fullPage:true});
        if (name === 'blog/tripadvisor-fake-review-statistics-removal-rates.html' && width === 390) await page.screenshot({path:path.join(root,'previews','tripadvisor-research-mobile.png'),fullPage:true});
        if (name === 'blog/canadian-tourism-google-reviews-2023.html' && width === 1440) await page.screenshot({path: path.join(root, 'previews', 'canada-study-desktop.png'), fullPage: true});
      }
      if (name.startsWith('remove-')) {
        const platform = await page.$eval('body', el => el.dataset.platform.toLowerCase());
        const sectionIds = await page.$$eval('main > section', els => els.slice(0,3).map(el => el.id || el.className));
        if (sectionIds[1] !== 'pricing' || sectionIds[2] !== 'quote') errors.push(`${name}: section order ${sectionIds}`);
        await page.evaluate(() => { document.querySelector('#priceQuantity').value = '3'; document.querySelector('#priceQuantity').dispatchEvent(new Event('input', {bubbles:true})); });
        const quote = await page.evaluate(() => ({count: document.querySelector('#formQuantity').value, start: document.querySelector('[data-quote="start"]').textContent, success: document.querySelector('[data-quote="success"]').textContent, plan: document.querySelector('#selectedPlan').value}));
        if (quote.count !== '3' || quote.start !== '$150' || quote.success !== '$375' || !quote.plan.toLowerCase().includes(platform)) errors.push(`${name}: quote mismatch ${JSON.stringify(quote)}`);
        await page.evaluate(() => {
          window.__submitted = null;
          window.fetch = async (endpoint, options) => { window.__submitted = {endpoint, body: options.body.toString()}; return {ok: true, json: async () => ({result: 'success'})}; };
          const form = document.querySelector('#assessment-form');
          form.querySelector('[name=full_name]').value = 'Test Person';
          form.querySelector('[name=business_name]').value = 'Test Business';
          form.querySelector('[name=email_address]').value = 'test@example.com';
          form.querySelector('[name=business_url]').value = 'https://example.com/review';
          form.requestSubmit();
        });
        await page.waitForSelector('#submission-success:not([hidden])');
        const submitted = await page.evaluate(() => window.__submitted);
        const body = new URLSearchParams(submitted.body);
        if (body.get('review_count') !== '3' || !body.get('selected_plan').toLowerCase().includes(platform) || body.get('contact_detail') !== 'test@example.com') errors.push(`${name}: payload mismatch`);
      }
      await page.close();
    }
  } finally { await browser.close(); }
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`PASS: ${pages.length} pages, links, anchors, images, desktop/mobile widths, service quotes and form payloads`);
})();
