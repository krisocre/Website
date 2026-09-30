const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');

const workspace = __dirname;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reviewremoval-launch-'));
const pages = [
  'index.html','platforms.html','review-removal-canada.html','about.html','remove-facebook-reviews.html','remove-yelp-reviews.html','remove-trustpilot-reviews.html','remove-tripadvisor-reviews.html','remove-booking-com-reviews.html','remove-glassdoor-reviews.html','remove-indeed-reviews.html',
  'blog/index.html','blog/google-review-moderation-2019-2025.html','blog/trustpilot-fake-reviews-by-star-rating.html','blog/canadian-tourism-google-reviews-2023.html','blog/review-removal-questions-answered.html','blog/review-report-evidence-checklist.html', 'blog/yelp-reviews-disappear-reappear-data.html', 'blog/tripadvisor-fake-review-statistics-removal-rates.html'
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
  for (const relative of pages) {
    const html = fs.readFileSync(path.join(tempRoot, relative), 'utf8');
    if ((html.match(/googletagmanager\.com\/gtag\/js\?id=AW-18449308865/g) || []).length !== 1 ||
        (html.match(/gtag\('config', 'AW-18449308865'\)/g) || []).length !== 1) {
      throw new Error(`${relative}: Google tag was omitted or duplicated`);
    }
  }
  const html = fs.readFileSync(path.join(tempRoot, 'blog/google-review-moderation-2019-2025.html'), 'utf8');
  if ((html.match(/rel="canonical"/g) || []).length !== 1) throw new Error('Canonical tag was duplicated');
  const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  const schema = JSON.parse(json);
  if (schema['@type'] !== 'BlogPosting' || schema.citation.length < 7 || !schema.image.endsWith('.png')) throw new Error('Article schema is incomplete');
  const articleSchemas = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match => JSON.parse(match[1]));
  if (articleSchemas[1]?.['@type'] !== 'BreadcrumbList' || articleSchemas[1]?.itemListElement?.length !== 3) throw new Error('Article breadcrumb schema is incomplete');
  const home = fs.readFileSync(path.join(tempRoot, 'index.html'), 'utf8');
  const homeSchema = JSON.parse(home.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (homeSchema['@graph']?.[0]?.['@type'] !== 'Organization' || !homeSchema['@graph']?.[0]?.logo?.endsWith('reviewremoval-logo.svg') || homeSchema['@graph']?.[1]?.['@type'] !== 'WebSite' || homeSchema['@graph']?.[2]?.['@type'] !== 'Service' || homeSchema['@graph']?.[2]?.areaServed?.name !== 'Canada') throw new Error('Home service schema is incomplete');
  const facebook = fs.readFileSync(path.join(tempRoot, 'remove-facebook-reviews.html'), 'utf8');
  const facebookSchema = JSON.parse(facebook.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (facebookSchema['@graph']?.[0]?.['@type'] !== 'Service' || facebookSchema['@graph']?.[0]?.name !== 'Facebook review removal service' || facebookSchema['@graph']?.[1]?.['@type'] !== 'BreadcrumbList') throw new Error('Platform service schema is incomplete');
  const booking = fs.readFileSync(path.join(tempRoot, 'remove-booking-com-reviews.html'), 'utf8');
  const bookingSchema = JSON.parse(booking.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (bookingSchema['@graph']?.[0]?.name !== 'Booking.com review removal service' || bookingSchema['@graph']?.[1]?.itemListElement?.[1]?.name !== 'Booking.com') throw new Error('Booking.com schema is incomplete');
  const canada = fs.readFileSync(path.join(tempRoot, 'review-removal-canada.html'), 'utf8');
  const canadaSchema = JSON.parse(canada.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (canadaSchema['@graph']?.[0]?.name !== 'Review removal service across Canada' || canadaSchema['@graph']?.[0]?.areaServed?.name !== 'Canada') throw new Error('Canada service schema is incomplete');
  const canadaArticle = fs.readFileSync(path.join(tempRoot, 'blog/canadian-tourism-google-reviews-2023.html'), 'utf8');
  const canadaArticleSchema = JSON.parse(canadaArticle.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (canadaArticleSchema.datePublished !== '2026-09-26' || !canadaArticleSchema.citation?.some(url => url.includes('ised-isde.canada.ca'))) throw new Error('Canadian research schema is incomplete');
  const sitemap = fs.readFileSync(path.join(tempRoot, 'sitemap.xml'), 'utf8');
  if ((sitemap.match(/<loc>/g) || []).length !== pages.length) throw new Error('Sitemap does not list every page');
  console.log(`PASS: production URL script is repeatable, with ${pages.length} sitemap URLs and article/service schema`);
} finally {
  const resolved = fs.realpathSync(tempRoot);
  const safeParent = path.resolve(os.tmpdir()) + path.sep;
  if (!resolved.startsWith(safeParent) || !path.basename(resolved).startsWith('reviewremoval-launch-')) throw new Error('Unsafe temporary directory; not removing it');
  fs.rmSync(resolved, {recursive: true, force: true});
}
