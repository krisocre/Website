/* Run once a production domain exists, after building the platform and blog pages.
   Example: node set-live-domain.cjs https://www.example.com */
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
  'index.html', 'platforms.html',
  'remove-facebook-reviews.html', 'remove-yelp-reviews.html', 'remove-trustpilot-reviews.html', 'remove-tripadvisor-reviews.html', 'remove-glassdoor-reviews.html',
  'blog/index.html', 'blog/google-review-moderation-2019-2025.html', 'blog/trustpilot-fake-reviews-by-star-rating.html',
  'blog/review-removal-questions-answered.html', 'blog/review-report-evidence-checklist.html'
];
const escapeAttr = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const marker = /\n  <!-- production URL metadata start -->[\s\S]*?<!-- production URL metadata end -->/;
const shareImages = {
  'blog/google-review-moderation-2019-2025.html': 'blog/assets/google-moderation-2019-2025.png',
  'blog/trustpilot-fake-reviews-by-star-rating.html': 'blog/assets/trustpilot-fake-reviews-by-star.png'
};
const decodeEntities = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');

for (const relative of pages) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { console.error(`Missing ${relative}. Run the build scripts first.`); process.exit(1); }
  let html = fs.readFileSync(file, 'utf8').replace(marker, '');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  if (!title || !description || !html.includes('</head>')) { console.error(`Missing metadata in ${relative}`); process.exit(1); }
  const canonical = `${origin}/${relative === 'index.html' ? '' : relative}`;
  const isArticle = relative.startsWith('blog/') && relative !== 'blog/index.html';
  const shareImage = shareImages[relative] ? `${origin}/${shareImages[relative]}` : null;
  let schemaTag = '';
  if (relative === 'index.html' || relative.startsWith('remove-')) {
    const platform = relative === 'index.html' ? 'Google' : relative.match(/^remove-(.+)-reviews\.html$/)?.[1];
    const service = {
      '@type': 'Service', '@id': `${canonical}#service`, url: canonical,
      name: `${platform[0].toUpperCase()}${platform.slice(1)} review removal service`,
      serviceType: `${platform[0].toUpperCase()}${platform.slice(1)} review removal assistance`,
      description: decodeEntities(description),
      areaServed: { '@type': 'Country', name: 'Canada' },
      provider: { '@id': `${origin}/#organization`, '@type': 'Organization', name: 'ReviewRemoval', url: origin }
    };
    const schema = relative === 'index.html'
      ? { '@context': 'https://schema.org', '@graph': [
          { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'ReviewRemoval', url: origin },
          service
        ] }
      : { '@context': 'https://schema.org', ...service };
    schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
  }
  if (isArticle) {
    const published = html.match(/<time datetime="([0-9-]+)"/)?.[1];
    if (!published) { console.error(`Missing article publication date in ${relative}`); process.exit(1); }
    const citations = [...new Set([...html.matchAll(/<a href="(https:\/\/[^\"]+)"/g)].map(match => decodeEntities(match[1])))];
    const schema = {
      '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${canonical}#article`,
      mainEntityOfPage: canonical, headline: decodeEntities(title.replace(/ \| ReviewRemoval$/, '')),
      description: decodeEntities(description), datePublished: published, dateModified: published,
      author: { '@type': 'Organization', name: 'ReviewRemoval', url: origin },
      publisher: { '@type': 'Organization', name: 'ReviewRemoval', url: origin },
      isAccessibleForFree: true, citation: citations
    };
    if (shareImage) schema.image = shareImage;
    schemaTag = `\n  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
  }
  const tags = `\n  <!-- production URL metadata start -->\n  <link rel="canonical" href="${escapeAttr(canonical)}">\n  <meta property="og:type" content="${isArticle ? 'article' : 'website'}">\n  <meta property="og:url" content="${escapeAttr(canonical)}">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${description}">${shareImage ? `\n  <meta property="og:image" content="${escapeAttr(shareImage)}">` : ''}\n  <meta name="twitter:card" content="${shareImage ? 'summary_large_image' : 'summary'}">${schemaTag}\n  <!-- production URL metadata end -->`;
  html = html.replace('</head>', `${tags}\n</head>`);
  fs.writeFileSync(file, html, 'utf8');
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(relative => `  <url><loc>${escapeAttr(`${origin}/${relative === 'index.html' ? '' : relative}`)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
console.log(`Set canonical and social URLs on ${pages.length} pages; wrote sitemap.xml and robots.txt for ${origin}`);
