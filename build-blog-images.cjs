const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('C:/Users/alkhi/node_modules/puppeteer');

const assets = path.join(__dirname, 'blog', 'assets');
const charts = ['google-moderation-2019-2025', 'trustpilot-fake-reviews-by-star'];

(async () => {
  const browser = await puppeteer.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox']});
  try {
    for (const name of charts) {
      const svg = fs.readFileSync(path.join(assets, `${name}.svg`), 'utf8');
      const page = await browser.newPage();
      await page.setViewport({width: 1200, height: 672, deviceScaleFactor: 1});
      await page.setContent(`<style>html,body{margin:0;width:1200px;height:672px;overflow:hidden}img{width:1200px;height:672px;display:block}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
      await page.waitForFunction(() => document.querySelector('img').complete);
      await page.screenshot({path: path.join(assets, `${name}.png`)});
      await page.close();
    }
  } finally { await browser.close(); }
  console.log('Built two 1200×672 article images from the original SVG charts');
})();
