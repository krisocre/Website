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
function checkGoogleTag(html, name) {
  const head = html.split('</head>')[0];
  for (const file of ['measurement-config.js','measurement.js','measurement.css'])
    if ((head.match(new RegExp('(?:src|href)="[^"\\s]*'+file.replace('.','\\.')+'(?:\\?v=[A-Za-z0-9-]+)?"','g'))||[]).length!==1)errors.push(`${name}: exactly one ${file} bootstrap required`);
  if (/googletagmanager\.com\/(?:gtag\/js|gtm\.js)/.test(head)) errors.push(`${name}: direct Google loader bypasses consent`);
}
if (!fs.readFileSync(path.join(root,'measurement-config.js'),'utf8').includes("googleAdsId: 'AW-18449308865'")) errors.push('Existing Google Ads destination must be preserved');

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
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
  const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
  const twitterTitle = html.match(/<meta name="twitter:title" content="([^"]+)"/)?.[1];
  const twitterDesc = html.match(/<meta name="twitter:description" content="([^"]+)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  const twitterImage = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];
  const schemaTags = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match => match[1]);

  if (!title || titles.has(title) || (html.match(/<title>/g) || []).length !== 1) errors.push(`${relative}: missing or duplicate title`);
  if (!desc || descriptions.has(desc) || (html.match(/<meta name="description"/g) || []).length !== 1 || desc.length < 80 || desc.length > 185) errors.push(`${relative}: missing, duplicate, or poorly sized description (${desc?.length || 0})`);
  if (title !== ogTitle || title !== twitterTitle || desc !== ogDesc || desc !== twitterDesc) errors.push(`${relative}: search and social snippets disagree`);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${relative}: expected one H1`);
  if ((html.match(/rel="canonical"/g) || []).length !== 1 || canonical !== url || ogUrl !== url) errors.push(`${relative}: canonical and OG URL mismatch`);
  const socialLocale = /<html\b[^>]*\blang="fr-CA"/.test(html) ? 'fr_CA' : 'en_CA';
  if (!html.includes('property="og:site_name" content="ReviewRemoval"') || !html.includes(`property="og:locale" content="${socialLocale}"`)) errors.push(`${relative}: missing site social metadata`);
  if (!ogImage?.startsWith(`${origin}/`) || ogImage !== twitterImage || !fs.existsSync(path.join(root, ogImage?.slice(origin.length + 1) || ''))) errors.push(`${relative}: missing social image`);
  if (!html.includes('name="twitter:card" content="summary_large_image"')) errors.push(`${relative}: missing large social card`);
  if (html.includes('name="keywords"')) errors.push(`${relative}: obsolete keyword meta tag`);
  const schemas = [];
  for (const tag of schemaTags) {
    try { schemas.push(JSON.parse(tag)); } catch { errors.push(`${relative}: invalid JSON-LD`); }
  }
  if (schemaTags.some(tag => /"@type"\s*:\s*"(?:AggregateRating|Review)"/.test(tag))) errors.push(`${relative}: unexpected rating or review markup`);
  const entities = schemas.flatMap(schema => schema['@graph'] || [schema]);
  for (const breadcrumb of entities.filter(entity => entity['@type'] === 'BreadcrumbList')) {
    const items = breadcrumb.itemListElement || [];
    if (items.length < 2 || items.at(-1)?.item !== url || items.some((item, i) =>
      item.position !== i + 1 || !item.name || !pages.includes(item.item))) {
      errors.push(`${relative}: breadcrumb does not follow canonical pages`);
    }
  }
  if (relative === 'index.html') {
    const site = entities.find(entity => entity['@type'] === 'WebSite');
    const organization = entities.find(entity => entity['@type'] === 'Organization');
    if (site?.name !== 'ReviewRemoval' || site?.url !== url || site?.alternateName !== 'ReviewRemoval.ca' ||
        organization?.name !== site?.name || organization?.['@id'] !== `${origin}/#organization` ||
        site?.publisher?.['@id'] !== organization?.['@id'] || organization?.logo !== `${origin}/assets/reviewremoval-logo.svg`) {
      errors.push('index.html: WebSite and Organization must identify the same brand');
    }
    const favicon = fs.readFileSync(path.join(root, 'favicon.svg'), 'utf8');
    if (!html.includes('rel="icon" href="favicon.svg"') || !/viewBox="0 0 (\d+) \1"/.test(favicon)) errors.push('index.html: expected a square SVG favicon');
  }
  if (relative.startsWith('blog/') && relative !== 'blog/index.html' &&
      (!schemas.some(schema => schema['@type'] === 'BlogPosting') || !schemas.some(schema => schema['@type'] === 'BreadcrumbList'))) {
    errors.push(`${relative}: missing article or breadcrumb schema`);
  }
  titles.add(title);
  descriptions.add(desc);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${relative}: duplicate HTML IDs`);
  for (const tag of html.matchAll(/<(?:a|link|script|img|source)\b[^>]*>/g)) {
    for (const [,attribute,value] of tag[0].matchAll(/\b(href|src|srcset)="([^"]+)"/g)) {
      if (/^(?:data:|blob:)/.test(value)) continue;
      const links = attribute === 'srcset' ? value.split(',').map(candidate => candidate.trim().split(/\s+/)[0]) : [value];
      for (const link of links) {
        if (/^(?:https?:|mailto:|tel:|data:|blob:)/.test(link)) continue;
        const hash = link.split('#')[1];
        const targetUrl=new URL(link,url);
        const targetFile=path.join(root,decodeURIComponent(targetUrl.pathname).replace(/^\//,'')||'index.html');
        if (!fs.existsSync(targetFile)) { errors.push(`${relative}: missing internal target ${link}`); continue; }
        if (hash && targetFile.endsWith('.html') && !fs.readFileSync(targetFile, 'utf8').includes(`id="${hash}"`)) errors.push(`${relative}: missing anchor ${link}`);
      }
    }
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
