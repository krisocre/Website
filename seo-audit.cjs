const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const origin = 'https://reviewremoval.ca';
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const errors = [];
const publishConfig=fs.readFileSync(path.join(root,'_config.yml'),'utf8');
for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.md'))){
 if(!publishConfig.split(/\r?\n/).some(line=>line.trim()===`- ${file}`))errors.push(`${file}: internal notes must be excluded from publication`);
}
const titles = new Set();
const descriptions = new Set();
const googleTagUrl = 'https://www.googletagmanager.com/gtag/js?id=AW-18449308865';
const googleTagConfig = "gtag('config', 'AW-18449308865');";
function checkGoogleTag(html, name) {
  const head = html.split('</head>')[0];
  if ((head.split(googleTagUrl).length - 1) !== 1 || (head.split(googleTagConfig).length - 1) !== 1) {
    errors.push(`${name}: Google tag must appear once in the head`);
  }
}

if (new Set(pages).size !== pages.length) errors.push('Sitemap URLs must be unique');
const htmlFiles = [...fs.readdirSync(root).filter(name => name.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'blog')).filter(name => name.endsWith('.html')).map(name => `blog/${name}`)];
const indexableFiles = htmlFiles.filter(name => !/name="robots" content="noindex/.test(fs.readFileSync(path.join(root, name), 'utf8')));
const sitemapFiles = pages.map(url => url === `${origin}/` ? 'index.html' : url.slice(origin.length + 1));
for (const name of indexableFiles) if (!sitemapFiles.includes(name)) errors.push(`${name}: indexable page missing from sitemap`);
for (const name of sitemapFiles) if (!indexableFiles.includes(name)) errors.push(`${name}: sitemap includes a missing or non-indexable page`);
if (fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim() !== 'reviewremoval.ca') errors.push('CNAME does not match the canonical host');
if (!fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt has the wrong sitemap URL');
const notFoundHtml = fs.readFileSync(path.join(root, '404.html'), 'utf8');
if (!notFoundHtml.includes('name="robots" content="noindex')) errors.push('404 page must be noindex');
checkGoogleTag(notFoundHtml, '404.html');
for(const match of notFoundHtml.matchAll(/\b(?:href|src)="([^"]+)"/g))if(!/^(?:\/|#|https?:|mailto:|tel:|data:)/.test(match[1]))errors.push(`404.html: relative link breaks on nested missing URLs: ${match[1]}`);

for (const url of pages) {
  if (!url.startsWith(`${origin}/`)) { errors.push(`Wrong sitemap host: ${url}`); continue; }
  const relative = url === `${origin}/` ? 'index.html' : url.slice(origin.length + 1);
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { errors.push(`Missing sitemap target: ${relative}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  checkGoogleTag(html, relative);
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
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${relative}: duplicate HTML IDs`);
  for (const match of html.matchAll(/<(?:a|link|script|img|source)\b[^>]*\b(?:href|src|srcset)="([^"]+)"/g)) {
    const link = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|blob:)/.test(link)) continue;
    const [target, hash] = link.split('#');
    const targetUrl=new URL(link,url);
    const targetFile=path.join(root,decodeURIComponent(targetUrl.pathname).replace(/^\//,'')||'index.html');
    if (!fs.existsSync(targetFile)) { errors.push(`${relative}: missing internal target ${link}`); continue; }
    if (hash && targetFile.endsWith('.html') && !fs.readFileSync(targetFile, 'utf8').includes(`id="${hash}"`)) errors.push(`${relative}: missing anchor ${link}`);
  }
}

// Branded identity and public links must stay within this site's own origin.
for(const relative of indexableFiles){
 const html=fs.readFileSync(path.join(root,relative),'utf8');
 if(/https?:\/\/(?:www\.)?reviewsboost\.ca\b/i.test(html))errors.push(`${relative}: foreign brand URL`);
 if((relative.startsWith('blog/')? /href="\.\.\/index\.html(?:[?#"])/ : /href="(?:\.\/)?index\.html(?:[?#"])/).test(html))errors.push(`${relative}: noncanonical homepage link`);
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const guide of require('./google-guides.cjs')) {
  if (!home.includes(`href="${guide.file}"`)) errors.push(`${guide.file}: missing homepage discovery link`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} unique indexable URLs, metadata, social images, JSON-LD, sitemap, robots and 404`);
}
