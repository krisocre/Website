const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');

const workspace = __dirname;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reviewremoval-launch-'));
const pages = [
  'index.html','platforms.html','remove-facebook-reviews.html','remove-yelp-reviews.html','remove-trustpilot-reviews.html','remove-tripadvisor-reviews.html','remove-glassdoor-reviews.html',
  'blog/index.html','blog/google-review-moderation-2019-2025.html','blog/trustpilot-fake-reviews-by-star-rating.html','blog/review-removal-questions-answered.html','blog/review-report-evidence-checklist.html'
];

try {
  fs.copyFileSync(path.join(workspace, 'set-live-domain.cjs'), path.join(tempRoot, 'set-live-domain.cjs'));
  for (const relative of pages) {
    fs.mkdirSync(path.dirname(path.join(tempRoot, relative)), {recursive: true});
    fs.copyFileSync(path.join(workspace, relative), path.join(tempRoot, relative));
  }
  for (let pass = 0; pass < 2; pass++) {
    const result = spawnSync(process.execPath, [path.join(tempRoot, 'set-live-domain.cjs'), 'https://example.com'], {encoding: 'utf8'});
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  }
  const html = fs.readFileSync(path.join(tempRoot, 'blog/google-review-moderation-2019-2025.html'), 'utf8');
  if ((html.match(/rel="canonical"/g) || []).length !== 1) throw new Error('Canonical tag was duplicated');
  const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  const schema = JSON.parse(json);
  if (schema['@type'] !== 'BlogPosting' || schema.citation.length < 7 || !schema.image.endsWith('.png')) throw new Error('Article schema is incomplete');
  const home = fs.readFileSync(path.join(tempRoot, 'index.html'), 'utf8');
  const homeSchema = JSON.parse(home.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (homeSchema['@graph']?.[0]?.['@type'] !== 'Organization' || homeSchema['@graph']?.[1]?.['@type'] !== 'Service' || homeSchema['@graph']?.[1]?.areaServed?.name !== 'Canada') throw new Error('Home service schema is incomplete');
  const facebook = fs.readFileSync(path.join(tempRoot, 'remove-facebook-reviews.html'), 'utf8');
  const facebookSchema = JSON.parse(facebook.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (facebookSchema['@type'] !== 'Service' || facebookSchema.name !== 'Facebook review removal service') throw new Error('Platform service schema is incomplete');
  const sitemap = fs.readFileSync(path.join(tempRoot, 'sitemap.xml'), 'utf8');
  if ((sitemap.match(/<loc>/g) || []).length !== pages.length) throw new Error('Sitemap does not list every page');
  console.log('PASS: production URL script is repeatable, with 12 sitemap URLs and article/service schema');
} finally {
  const resolved = fs.realpathSync(tempRoot);
  const safeParent = path.resolve(os.tmpdir()) + path.sep;
  if (!resolved.startsWith(safeParent) || !path.basename(resolved).startsWith('reviewremoval-launch-')) throw new Error('Unsafe temporary directory; not removing it');
  fs.rmSync(resolved, {recursive: true, force: true});
}
