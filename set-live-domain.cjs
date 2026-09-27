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
  'blog/canadian-tourism-google-reviews-2023.html', 'blog/review-removal-questions-answered.html', 'blog/review-report-evidence-checklist.html'
];
const escapeAttr = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const marker = /\n  <!-- production URL metadata start -->[\s\S]*?<!-- production URL metadata end -->/;
const shareImages = {
  'blog/google-review-moderation-2019-2025.html': 'blog/assets/google-moderation-2019-2025.png',
  'blog/trustpilot-fake-reviews-by-star-rating.html': 'blog/assets/trustpilot-fake-reviews-by-star.png',
  'blog/canadian-tourism-google-reviews-2023.html': 'blog/assets/canadian-sme-online-activities-2023.png'
};
const shareImageAlts = {
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
  let html = fs.readFileSync(file, 'utf8').replace(/\r+\n/g, '\n').replace(/\r/g, '\n').replace(marker, '').replace(/\n(?:[ \t]*\n)*(?=<\/head>)/, '\n');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  if (!title || !description || !html.includes('</head>')) { console.error(`Missing metadata in ${relative}`); process.exit(1); }
  const canonical = `${origin}/${relative === 'index.html' ? '' : relative}`;
  const isArticle = relative.startsWith('blog/') && relative !== 'blog/index.html';
  const shareImage = `${origin}/${shareImages[relative] || 'assets/reviewremoval-social.png'}`;
  let schemaTag = '';
  if (relative === 'index.html' || relative === 'review-removal-canada.html' || relative.startsWith('remove-')) {
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
    const schema = relative === 'index.html'
      ? { '@context': 'https://schema.org', '@graph': [
          organization,
          { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'ReviewRemoval', publisher: { '@id': `${origin}/#organization` }, inLanguage: 'en-CA' },
          service
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
  if (isArticle) {
    const published = html.match(/<time datetime="([0-9-]+)"/)?.[1];
    if (!published) { console.error(`Missing article publication date in ${relative}`); process.exit(1); }
    const citations = [...new Set([...html.matchAll(/<a href="(https:\/\/[^\"]+)"/g)].map(match => decodeEntities(match[1])))];
    const schema = {
      '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${canonical}#article`,
      mainEntityOfPage: canonical, headline: decodeEntities(title.replace(/ \| ReviewRemoval$/, '')),
      description: decodeEntities(description), datePublished: published,
      dateModified: html.match(/<time data-updated datetime="([0-9-]+)"/)?.[1] || published,
      author: { '@type': 'Organization', name: 'ReviewRemoval', url: `${origin}/about.html` },
      publisher: { '@type': 'Organization', name: 'ReviewRemoval', url: origin },
      isAccessibleForFree: true, citation: citations
    };
    schema.image = shareImage;
    schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
    const breadcrumbs = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Research and guides', item: `${origin}/blog/index.html` },
        { '@type': 'ListItem', position: 3, name: decodeEntities(title.replace(/ \| ReviewRemoval$/, '')), item: canonical }
      ]
    };
    schemaTag += `\n  <script type="application/ld+json">${JSON.stringify(breadcrumbs).replaceAll('<', '\\u003c')}</script>`;
  }
  const imageAlt = shareImageAlts[relative] || 'ReviewRemoval: review concerns, handled for you';
  const tags = `\n  <!-- production URL metadata start -->\n  <link rel="canonical" href="${escapeAttr(canonical)}">\n  <meta name="robots" content="index, follow, max-image-preview:large">\n  <meta property="og:type" content="${isArticle ? 'article' : 'website'}">\n  <meta property="og:site_name" content="ReviewRemoval">\n  <meta property="og:locale" content="en_CA">\n  <meta property="og:url" content="${escapeAttr(canonical)}">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${description}">\n  <meta property="og:image" content="${escapeAttr(shareImage)}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="${shareImages[relative] ? '672' : '630'}">\n  <meta property="og:image:alt" content="${escapeAttr(imageAlt)}">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${title}">\n  <meta name="twitter:description" content="${description}">\n  <meta name="twitter:image" content="${escapeAttr(shareImage)}">${schemaTag}\n  <!-- production URL metadata end -->`;
  html = html.replace('</head>', `${tags}\n</head>`);
  fs.writeFileSync(file, html, 'utf8');
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(relative => `  <url><loc>${escapeAttr(`${origin}/${relative === 'index.html' ? '' : relative}`)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
console.log(`Set canonical and social URLs on ${pages.length} pages; wrote sitemap.xml and robots.txt for ${origin}`);
