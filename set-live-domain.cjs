/* Run after building the platform and blog pages.
   Production: node set-live-domain.cjs https://reviewremoval.ca */
const fs = require('node:fs');
const path = require('node:path');

const input = process.argv[2];
if (!input) { console.error('Usage: node set-live-domain.cjs https://your-domain.example'); process.exit(1); }
let parsed;
try { parsed = new URL(input); } catch { console.error('Enter a complete HTTPS origin.'); process.exit(1); }
if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) {
  console.error('Use an HTTPS origin only, with no path, query, credentials or fragment.');
  process.exit(1);
}
const origin = parsed.origin;
const root = __dirname;
const pages = [
  'index.html', 'platforms.html', 'review-removal-canada.html', 'about.html',
  'remove-facebook-reviews.html', 'remove-yelp-reviews.html', 'remove-trustpilot-reviews.html', 'remove-tripadvisor-reviews.html', 'remove-booking-com-reviews.html', 'remove-glassdoor-reviews.html', 'remove-indeed-reviews.html',
  'blog/index.html', 'blog/google-review-moderation-2019-2025.html', 'blog/trustpilot-fake-reviews-by-star-rating.html',
  'blog/canadian-tourism-google-reviews-2023.html', 'blog/review-removal-questions-answered.html', 'blog/review-report-evidence-checklist.html', 'blog/yelp-reviews-disappear-reappear-data.html', 'blog/tripadvisor-fake-review-statistics-removal-rates.html', 'blog/trustpilot-appeal-outcomes-2025.html', 'blog/google-review-removal-rating-impact-study.html',
  ...require('./google-guides.cjs').map(guide => guide.file),
  'blog/google-review-removal-denominator-audit.html'
];
const escapeAttr = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const marker = /\n  <!-- production URL metadata start -->[\s\S]*?<!-- production URL metadata end -->/;
const googleTagMarker = /\n  <!-- Google tag \(gtag\.js\) -->[\s\S]*?<!-- \/Google tag \(gtag\.js\) -->/;
const googleTag = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18449308865"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-18449308865');
  </script>
  <!-- /Google tag (gtag.js) -->`;
const shareImages = {
  'blog/google-review-removal-denominator-audit.html': 'blog/assets/google-removal-reasons-denominators.png',
  'blog/google-review-removal-rating-impact-study.html': 'blog/assets/rating-removal-uncertainty.png',
  'blog/trustpilot-appeal-outcomes-2025.html': 'blog/assets/trustpilot-appeals-2025.png',
  'blog/yelp-reviews-disappear-reappear-data.html': 'blog/assets/yelp-review-transitions.png',
  'blog/tripadvisor-fake-review-statistics-removal-rates.html': 'blog/assets/tripadvisor-fraud-series.png',
  'blog/google-review-moderation-2019-2025.html': 'blog/assets/google-moderation-2019-2025.png',
  'blog/trustpilot-fake-reviews-by-star-rating.html': 'blog/assets/trustpilot-fake-reviews-by-star.png',
  'blog/canadian-tourism-google-reviews-2023.html': 'blog/assets/canadian-sme-online-activities-2023.png'
};
const shareImageAlts = {
  'blog/google-review-removal-denominator-audit.html': 'Google removal-reason rates for 2024 and 2025, as a share of all contributed reviews',
  'blog/google-review-removal-rating-impact-study.html': 'Original mathematical ranges for star ratings after removing one one-star Google review',
  'blog/trustpilot-appeal-outcomes-2025.html': 'Trustpilot 2025 reversal counts separated by the decision being challenged',
  'blog/yelp-reviews-disappear-reappear-data.html': 'Historical Yelp review recommendation transitions in a matched sample of 66,922 reviews',
  'blog/tripadvisor-fake-review-statistics-removal-rates.html': 'Tripadvisor detected fraud figures for four activity years, with a calculated 2024 ratio',
  'blog/google-review-moderation-2019-2025.html': 'Chart of published Google Maps review moderation figures from 2019 to 2025',
  'blog/trustpilot-fake-reviews-by-star-rating.html': 'Chart of Trustpilot fake review removals by star rating in 2024',
  'blog/canadian-tourism-google-reviews-2023.html': 'Chart comparing online activities of Canadian tourism and all-industry SMEs in 2023'
};
const decodeEntities = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const organization = {
  '@type': 'Organization', '@id': `${origin}/#organization`, name: 'ReviewRemoval', url: origin,
  logo: `${origin}/assets/reviewremoval-logo.svg`,
  description: 'Independent review reporting service for businesses in Canada.'
};

for (const relative of pages) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { console.error(`Missing ${relative}. Run the build scripts first.`); process.exit(1); }
  let html = fs.readFileSync(file, 'utf8').replace(/\r+\n/g, '\n').replace(/\r/g, '\n').replace(marker, '').replace(googleTagMarker, '').replace(/\n(?:[ \t]*\n)*(?=<\/head>)/, '\n');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  if (!title || !description || !html.includes('</head>')) { console.error(`Missing metadata in ${relative}`); process.exit(1); }
  const canonical = `${origin}/${relative === 'index.html' ? '' : relative}`;
  const isGuide = require('./google-guides.cjs').some(guide => guide.file === relative);
  const isArticle = (relative.startsWith('blog/') && relative !== 'blog/index.html') || isGuide;
  const shareImage = `${origin}/${shareImages[relative] || 'assets/reviewremoval-social.png'}`;
  let schemaTag = '';
  if (relative === 'index.html' || relative === 'review-removal-canada.html' || (relative.startsWith('remove-') && !isGuide)) {
    const isCanada = relative === 'review-removal-canada.html';
    const platform = relative === 'index.html' ? 'Google' : isCanada ? 'Canadian business' : decodeEntities(html.match(/<body data-platform="([^"]+)"/)?.[1] || '');
    if (!platform) { console.error(`Missing platform name in ${relative}`); process.exit(1); }
    const service = {
      '@type': 'Service', '@id': `${canonical}#service`, url: canonical,
      name: isCanada ? 'Review removal service across Canada' : `${platform} review removal service`,
      serviceType: isCanada ? 'Multi-platform review removal assistance' : `${platform} review removal assistance`,
      description: decodeEntities(description),
      areaServed: { '@type': 'Country', name: 'Canada' },
      provider: { '@id': `${origin}/#organization`, '@type': 'Organization', name: 'ReviewRemoval', url: origin }
    };
    if (relative === 'index.html') {
      service.name = 'Google review removal service in Canada';
      service.offers = { '@type': 'Offer', price: '50', priceCurrency: 'CAD', eligibleRegion: 'CA',
        description: 'CAD $50 upfront per review, plus CAD $125 for each review successfully removed. Applicable taxes and written terms confirmed before payment.', url: `${origin}/#pricing` };
    }
    const schema = relative === 'index.html'
      ? { '@context': 'https://schema.org', '@graph': [
          organization,
          { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'ReviewRemoval', publisher: { '@id': `${origin}/#organization` }, inLanguage: 'en-CA' },
          service,
          { '@type': 'WebPage', '@id': `${origin}/#webpage`, url: `${origin}/`, name: decodeEntities(title),
            description: decodeEntities(description), inLanguage: 'en-CA', dateModified: '2026-10-24',
            isPartOf: { '@id': `${origin}/#website` }, mainEntity: { '@id': `${origin}/#service` } }
        ] }
      : isCanada ? { '@context': 'https://schema.org', '@graph': [service, {
          '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: 'Review removal across Canada', item: canonical }
          ]
        }] }
      : { '@context': 'https://schema.org', '@graph': [service, {
          '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'All platforms', item: `${origin}/platforms.html` },
            { '@type': 'ListItem', position: 2, name: platform, item: canonical }
          ]
        }] };
    schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
  }
  let articleTimeTags = "";
  if (isArticle) {
    const published = html.match(/<time datetime="([0-9-]+)"/)?.[1];
    if (!published) { console.error(`Missing article publication date in ${relative}`); process.exit(1); }
    const citations = [...new Set([...html.matchAll(/<a href="(https:\/\/[^\"]+)"/g)].map(match => decodeEntities(match[1])))];
    const schema = {
      '@context': 'https://schema.org', '@type': relative.startsWith('blog/') ? 'BlogPosting' : 'Article', '@id': `${canonical}#article`,
      mainEntityOfPage: canonical, headline: decodeEntities(title.replace(/ \| ReviewRemoval$/, '')),
      description: decodeEntities(description), datePublished: published,
      dateModified: html.match(/<time data-updated datetime="([0-9-]+)"/)?.[1] || published,
      author: { '@type': 'Organization', name: 'ReviewRemoval', url: `${origin}/about.html` },
      publisher: { '@type': 'Organization', name: 'ReviewRemoval', url: origin },
      isAccessibleForFree: true, inLanguage: 'en-CA', citation: citations
    };
    articleTimeTags = `\n  <meta property="article:published_time" content="${schema.datePublished}">\n  <meta property="article:modified_time" content="${schema.dateModified}">`;
    schema.image = shareImage;
    if (relative === 'blog/google-review-removal-denominator-audit.html') {
      schema.mainEntity = { '@id': `${canonical}#dataset` };
      schema.articleSection = 'Original research / Google removal data';
      schema.image = [
        ['google-removal-reasons-denominators','Google review removal reason rates, 2024–2025; denominator: all contributed reviews'],
        ['google-removal-metric-changes','Nominal changes in eight separate Google Maps metrics, calculated from rounded displays'],
        ['google-removal-source-corrections','Google reporting corrections: superseded and revised 2024 place-edit values']
      ].map(([name,caption]) => ({ '@type':'ImageObject', '@id':`${origin}/blog/assets/${name}.png#image`,
        contentUrl:`${origin}/blog/assets/${name}.png`, url:`${origin}/blog/assets/${name}.png`,
        width:1200,height:720,caption,creditText:'ReviewRemoval; underlying disclosures: Google',
        creator:{'@type':'Organization',name:'ReviewRemoval',url:`${origin}/`},
        license:'https://creativecommons.org/licenses/by/4.0/',acquireLicensePage:`${canonical}#downloads`
      }));
    }
    schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
    const breadcrumbs = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Research and guides', item: `${origin}/blog/index.html` },
        { '@type': 'ListItem', position: 3, name: decodeEntities(title.replace(/ \| ReviewRemoval$/, '')), item: canonical }
      ]
    };
    schemaTag += `\n  <script type="application/ld+json">${JSON.stringify(breadcrumbs).replaceAll('<', '\\u003c')}</script>`;
    if (relative === 'google-review-removal-checker.html') {
      schemaTag += `\n  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication',
        name: 'Google review removal evidence checker', url: canonical, applicationCategory: 'BusinessApplication', operatingSystem: 'Any',
        isAccessibleForFree: true, browserRequirements: 'JavaScript for tailored worksheets; static checklists available without JavaScript',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
        description: 'Seven concerns and four reporting stages create preparation worksheets. No removal probability or eligibility score.',
        publisher: { '@id': `${origin}/#organization` } }).replaceAll('<', '\\u003c')}</script>`;
    }
  }
  const imageAlt = shareImageAlts[relative] || 'ReviewRemoval: review concerns, handled for you';
  const tags = `\n  <!-- production URL metadata start -->\n  <link rel="canonical" href="${escapeAttr(canonical)}">\n  <meta name="robots" content="index, follow, max-image-preview:large">\n  <meta property="og:type" content="${isArticle ? 'article' : 'website'}">\n  <meta property="og:site_name" content="ReviewRemoval">\n  <meta property="og:locale" content="en_CA">\n  <meta property="og:url" content="${escapeAttr(canonical)}">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${description}">\n  <meta property="og:image" content="${escapeAttr(shareImage)}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="${['blog/trustpilot-appeal-outcomes-2025.html','blog/google-review-removal-denominator-audit.html'].includes(relative) ? '720' : shareImages[relative] ? '672' : '630'}">\n  <meta property="og:image:alt" content="${escapeAttr(imageAlt)}">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${title}">\n  <meta name="twitter:description" content="${description}">\n  <meta name="twitter:image" content="${escapeAttr(shareImage)}">\n  <meta name="twitter:image:alt" content="${escapeAttr(imageAlt)}">${articleTimeTags}${schemaTag}\n  <!-- production URL metadata end -->`;
  html = html.replace('</head>', `${tags}${googleTag}\n</head>`);
  fs.writeFileSync(file, html, 'utf8');
}

const sitemapEntries = pages.map(relative => {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match => JSON.parse(match[1]));
  const modified = schemas.find(schema => ['BlogPosting','Article','CollectionPage'].includes(schema['@type']))?.dateModified
    || schemas.flatMap(schema => schema['@graph'] || []).find(schema => schema['@type'] === 'WebPage')?.dateModified;
  const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(modified || '') ? `<lastmod>${modified}</lastmod>` : '';
  const images = relative === 'blog/google-review-removal-denominator-audit.html'
    ? ['google-removal-reasons-denominators','google-removal-metric-changes','google-removal-source-corrections'].map(name => `<image:image><image:loc>${origin}/blog/assets/${name}.svg</image:loc></image:image>`).join('') : '';
  return `  <url><loc>${escapeAttr(`${origin}/${relative === 'index.html' ? '' : relative}`)}</loc>${lastmod}${images}</url>`;
});
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
// Publish a crawlable feed of dated blog articles; regenerate it with the canonical domain.
const xml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const feedItems = pages.filter(name => name.startsWith('blog/') && name !== 'blog/index.html').map(name => {
  const html = fs.readFileSync(path.join(root,name),'utf8');
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
  const article = schemas.find(schema=>schema['@type']==='BlogPosting');
  if (!article) throw new Error(`Missing BlogPosting for feed item ${name}`);
  return { ...article,url:`${origin}/${name}` };
}).sort((a,b)=>b.datePublished.localeCompare(a.datePublished)||a.url.localeCompare(b.url));
const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>ReviewRemoval Research and Guides</title><link>${origin}/blog/index.html</link><description>Original review moderation research and practical reporting guides for Canadian businesses.</description><language>en-CA</language><atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>${feedItems.map(article=>`<item><title>${xml(article.headline)}</title><link>${xml(article.url)}</link><guid isPermaLink="true">${xml(article.url)}</guid><description>${xml(article.description)}</description><pubDate>${new Date(article.datePublished+'T00:00:00Z').toUTCString()}</pubDate></item>`).join('')}</channel></rss>\n`;
fs.writeFileSync(path.join(root,'feed.xml'),rss,'utf8');
console.log(`Set canonical and social URLs on ${pages.length} pages; wrote sitemap.xml and robots.txt for ${origin}`);
