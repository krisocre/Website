const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require('C:/Users/alkhi/node_modules/puppeteer');
const {turnstileApiFixture,isTurnstileApi}=require('./turnstile-test-fixture.cjs');

const root = __dirname;
const previewRoot=path.resolve(root,process.env.SITE_CHECK_PREVIEWS||'.seo-private/site-check');
fs.mkdirSync(previewRoot,{recursive:true});
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname.slice(1) || 'index.html');
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
if (!/<title>Google Review Removal[^<]*Canada[^<]*<\/title>/.test(homeHtml) || !homeHtml.includes('id="service-area"') || !homeHtml.includes('<details id="policy">')) errors.push('Homepage search landing content or policy FAQ link target is missing');
const googleRows = fs.readFileSync(path.join(root, 'blog/data/google-review-moderation-2019-2025.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
const canadaRows = fs.readFileSync(path.join(root, 'blog/data/canadian-sme-online-activities-2023.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
if (googleRows.length !== 7 || googleRows.map(row => Number(row.split(',')[1])).join(',') !== '75,55,95,115,170,240,292') errors.push('Google source table mismatch');
if (canadaRows.length !== 7 || !canadaRows.find(row => row.startsWith('Google Reviews,63.8,47.0,16.8,https://www.ised-isde.canada.ca/'))) errors.push('Canadian source table mismatch');
for (const name of ['google-moderation-2019-2025.png', 'canadian-sme-online-activities-2023.png','rating-removal-uncertainty.png','rating-removal-threshold-map.png','rating-recovery-range.png']) {
  const image = fs.readFileSync(path.join(root, 'blog/assets', name));
  if (image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 672) errors.push(`${name}: incorrect sharing image size`);
}

(async () => {
  const browser = await puppeteer.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox']});
  try {
    for (const name of pages) {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.method() !== 'GET') request.abort();
        else if (isTurnstileApi(request.url())) request.respond({status:200,contentType:'text/javascript',body:turnstileApiFixture});
        else if (/^(?:file|data):/.test(request.url())) request.continue();
        else request.abort();
      });
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
        const linkUrl=new URL(link,`https://reviewremoval.ca/${name}`);
        const resolved=path.join(root,linkUrl.pathname.replace(/^\//,'')||'index.html');
        if (target && !fs.existsSync(resolved)) errors.push(`${name}: broken link ${link}`);
        const hash = link.split('#')[1];
        if (hash && fs.existsSync(resolved)) {
          const targetHtml = resolved === path.join(root, name) ? await page.content() : fs.readFileSync(resolved, 'utf8');
          if (!targetHtml.includes(`id="${hash}"`)) errors.push(`${name}: broken anchor ${link}`);
        }
      }
      const pageBasics = await page.evaluate(() => ({h1: document.querySelectorAll('h1').length, description: !!document.querySelector('meta[name="description"]'), badImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.getAttribute('src'))}));
      if (pageBasics.h1 !== 1 || !pageBasics.description || pageBasics.badImages.length) errors.push(`${name}: page basics ${JSON.stringify(pageBasics)}`);
      if (name === 'blog/google-review-removal-rating-impact-study.html') {
        const cases = [
          {count:100,rating:4.4,removed:1,stars:1,expected:'4.4–4.5'},
          {count:20,rating:4.4,removed:1,stars:1,expected:'4.5–4.6'},
          {count:10,rating:4.9,removed:1,stars:1,expected:'cannot coexist'},
          {count:20,rating:4.4,removed:1,stars:4,expected:'after removal: 4.4.'},
          {count:100,rating:4.4,removed:100,stars:1,expected:'fewer removals'}
        ];
        for (const test of cases) {
          await page.evaluate(test => {
            document.querySelector('#rating-count').value=test.count;
            document.querySelector('#rating-display').value=test.rating;
            document.querySelector('#rating-removed').value=test.removed;
            document.querySelector('#rating-stars').value=test.stars;
            document.querySelector('[data-rating-calculator]').requestSubmit();
          }, test);
          const result=await page.$eval('[data-rating-result]',el=>el.textContent);
          if(!result.includes(test.expected)) errors.push(`${name}: calculator result ${result}`);
        }
        await page.evaluate(() => {
          document.querySelector('#rating-count').value=100;
          document.querySelector('#rating-display').value=4.4;
          document.querySelector('#rating-removed').value=1;
          document.querySelector('#rating-stars').value=1;
          document.querySelector('[data-rating-calculator]').requestSubmit();
        });
      }
      if (name === 'index.html') {
        const sectionIds = await page.$$eval('main > section', els => els.slice(0,3).map(el => el.id || el.className));
        if (sectionIds[1] !== 'pricing' || sectionIds[2] !== 'quote') errors.push(`${name}: section order ${sectionIds}`);
        const marquee = await page.evaluate(() => ({
          names: [...document.querySelectorAll('.platform-list:not([aria-hidden]) li')].map(el => el.textContent.trim()),
          animation: getComputedStyle(document.querySelector('.platform-track')).animationName
        }));
        if (marquee.names.length !== 7 || new Set(marquee.names).size !== 7 || marquee.animation !== 'review-platform-loop') errors.push(`${name}: seven press mentions must be complete and scroll`);
        await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
        const reducedAnimation = await page.$eval('.platform-track', el => getComputedStyle(el).animationName);
        if (reducedAnimation !== 'none') errors.push(`${name}: banner ignores reduced motion`);
        await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'no-preference'}]);
      }
      for (const width of [1440, 390, 320]) {
        await page.setViewport({width, height: 900, deviceScaleFactor: 1});
        const layout = await page.evaluate(() => ({scroll: document.documentElement.scrollWidth, viewport: innerWidth, heading: document.querySelector('h1')?.getBoundingClientRect().width}));
        if (layout.scroll > layout.viewport + 1) errors.push(`${name} @${width}: horizontal overflow ${layout.scroll}`);
        if (name === 'blog/google-review-removal-rating-impact-study.html' && width === 1440) await page.screenshot({path:path.join(previewRoot,'rating-study-desktop.png'),fullPage:true});
        if (name === 'blog/google-review-removal-rating-impact-study.html' && width === 390) await page.screenshot({path:path.join(previewRoot,'rating-study-mobile.png'),fullPage:true});
        if (name === 'index.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'home-desktop.png'), fullPage: true});
        if (name === 'index.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'home-desktop-top.png')});
        if (name === 'index.html' && width === 390) await page.screenshot({path: path.join(previewRoot, 'home-mobile.png'), fullPage: true});
        if (name === 'index.html' && width === 390) await page.screenshot({path: path.join(previewRoot, 'home-mobile-top.png')});
        if (name === 'about.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'about-desktop.png'), fullPage: true});
        if (name === 'about.html' && width === 390) await page.screenshot({path: path.join(previewRoot, 'about-mobile-top.png')});
        if (name === 'review-removal-canada.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'canada-desktop.png'), fullPage: true});
        if (name === 'review-removal-canada.html' && width === 390) await page.screenshot({path: path.join(previewRoot, 'canada-mobile.png'), fullPage: true});
        if (name === 'blog/index.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'blog-desktop.png'), fullPage: true});
        if (name === 'blog/google-review-moderation-2019-2025.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'google-study-desktop.png'), fullPage: true});
        if (name === 'blog/canadian-tourism-google-reviews-2023.html' && width === 1440) await page.screenshot({path: path.join(previewRoot, 'canada-study-desktop.png'), fullPage: true});
      }
      await page.close();
    }
  } finally { await browser.close(); }
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`PASS: ${pages.length} pages, links, anchors, images, desktop/mobile widths and the rating study calculator`);
})();
