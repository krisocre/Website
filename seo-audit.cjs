const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const origin = 'https://reviewremoval.ca';
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const errors = [];
const titles = new Set();
const descriptions = new Set();

if (pages.length !== 17 || new Set(pages).size !== pages.length) errors.push('Sitemap must contain 17 unique pages');
if (fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim() !== 'reviewremoval.ca') errors.push('CNAME does not match the canonical host');
if (!fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt has the wrong sitemap URL');
if (!fs.readFileSync(path.join(root, '404.html'), 'utf8').includes('name="robots" content="noindex')) errors.push('404 page must be noindex');

for (const url of pages) {
  if (!url.startsWith(`${origin}/`)) { errors.push(`Wrong sitemap host: ${url}`); continue; }
  const relative = url === `${origin}/` ? 'index.html' : url.slice(origin.length + 1);
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { errors.push(`Missing sitemap target: ${relative}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  const twitterImage = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];
  const schemaTags = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match => match[1]);

  if (!title || titles.has(title)) errors.push(`${relative}: missing or duplicate title`);
  if (!desc || descriptions.has(desc) || desc.length < 80 || desc.length > 185) errors.push(`${relative}: missing, duplicate, or poorly sized description (${desc?.length || 0})`);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${relative}: expected one H1`);
  if ((html.match(/rel="canonical"/g) || []).length !== 1 || canonical !== url || ogUrl !== url) errors.push(`${relative}: canonical and OG URL mismatch`);
  if (!html.includes('property="og:site_name" content="ReviewRemoval"') || !html.includes('property="og:locale" content="en_CA"')) errors.push(`${relative}: missing site social metadata`);
  if (!ogImage?.startsWith(`${origin}/`) || ogImage !== twitterImage || !fs.existsSync(path.join(root, ogImage?.slice(origin.length + 1) || ''))) errors.push(`${relative}: missing social image`);
  if (!html.includes('name="twitter:card" content="summary_large_image"')) errors.push(`${relative}: missing large social card`);
  if (html.includes('name="keywords"')) errors.push(`${relative}: obsolete keyword meta tag`);
  const schemas = [];
  for (const tag of schemaTags) {
    try { schemas.push(JSON.parse(tag)); } catch { errors.push(`${relative}: invalid JSON-LD`); }
  }
  if (relative.startsWith('blog/') && relative !== 'blog/index.html' &&
      (!schemas.some(schema => schema['@type'] === 'BlogPosting') || !schemas.some(schema => schema['@type'] === 'BreadcrumbList'))) {
    errors.push(`${relative}: missing article or breadcrumb schema`);
  }
  titles.add(title);
  descriptions.add(desc);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} unique indexable URLs, metadata, social images, JSON-LD, sitemap, robots and 404`);
}
