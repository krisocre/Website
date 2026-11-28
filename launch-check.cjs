const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');

const workspace = __dirname;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reviewremoval-launch-'));
const industryPosts = 'blog/industry-review-removal-post.cjs';
const pages = [
  'index.html','suppression-avis-google.html','review-removal-canada.html','about.html','terms-of-service.html','privacy-policy.html','editorial-policy.html',
  'blog/index.html','blog/google-review-moderation-2019-2025.html','blog/canadian-tourism-google-reviews-2023.html','blog/review-removal-questions-answered.html','blog/review-report-evidence-checklist.html', 'blog/google-review-removal-rating-impact-study.html',
  ...require('./google-guides.cjs').map(guide => guide.file),
  'google-review-case-tracker.html',
  'blog/google-review-removal-denominator-audit.html', 'blog/google-review-risk-score-denominator-study.html',
  'blog/google-review-removal-appeals-data.html', 'blog/google-review-removal-time-data.html',
  'blog/google-review-removal-local-ranking-study.html',
  'blog/google-reviews-without-text-data-study.html',
  'blog/google-review-removal-physiotherapy-clinics.html',
  ...require('./' + industryPosts).map(article => `blog/${article.slug}.html`)
];

try {
  fs.copyFileSync(path.join(workspace, 'set-live-domain.cjs'), path.join(tempRoot, 'set-live-domain.cjs'));
  fs.copyFileSync(path.join(workspace, 'google-guides.cjs'), path.join(tempRoot, 'google-guides.cjs'));
  for (const name of ['apply-service-positioning.cjs','build-legal-pages.cjs','legal-settings.json','build-editorial-page.cjs','install-measurement.cjs','measurement-config.js','measurement.js','measurement.css']) fs.copyFileSync(path.join(workspace,name),path.join(tempRoot,name));
  for (const relative of pages) {
    fs.mkdirSync(path.dirname(path.join(tempRoot, relative)), {recursive: true});
    fs.copyFileSync(path.join(workspace, relative), path.join(tempRoot, relative));
  }
  fs.copyFileSync(path.join(workspace, industryPosts), path.join(tempRoot, industryPosts));
  for (let pass = 0; pass < 2; pass++) {
    const result = spawnSync(process.execPath, [path.join(tempRoot, 'set-live-domain.cjs'), 'https://example.com'], {encoding: 'utf8'});
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  }
  const privacyRelease = '2026-11-23';
  const oldPolicy = 'legal-versions/policies-2026-10-27.json';
  const policyPath = `legal-versions/policies-${privacyRelease}.json`;
  const publishedPrivacy = fs.readFileSync(path.join(tempRoot, 'privacy-policy.html'), 'utf8');
  const snapshot = JSON.parse(fs.readFileSync(path.join(tempRoot, policyPath), 'utf8'));
  const internalDetails = /Google (?:Sheets|Apps Script|Ads)|Cloudflare|Microsoft Clarity|\b(?:AW-\d+|GTM-[A-Z0-9]+)\b|https?:\/\/[^"<\s]+(?:myadcenter|partner-sites)/i;
  if (internalDetails.test(publishedPrivacy) || internalDetails.test(JSON.stringify(snapshot.privacy))) throw new Error('The privacy policy exposes implementation details');
  if (snapshot.termsVersion !== '2026-10-27' || snapshot.privacyVersion !== privacyRelease) throw new Error('The policy snapshot must identify both versions');
  if (!fs.readFileSync(path.join(workspace, '_config.yml'), 'utf8').split(/\r?\n/).some(line => line.trim() === `- ${oldPolicy}`)) throw new Error('The historical policy snapshot is still configured for publication');
  for (const relative of pages) {
    const html = fs.readFileSync(path.join(tempRoot, relative), 'utf8');
    const expectedShortcuts = ['index.html','suppression-avis-google.html','google-review-removal-cost-canada.html'].includes(relative) ? 0 : 1;
    if ((html.match(/class="assessment-shortcut" href="\/#quote"/g) || []).length !== expectedShortcuts) throw new Error(`${relative}: incorrect fixed assessment shortcut count`);
    if ((html.match(/class="site-language"/g) || []).length !== 1) throw new Error(`${relative}: expected one visible language link`);
    const alternateLinks = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
    if (relative === 'index.html' || relative === 'suppression-avis-google.html') {
      if (alternateLinks.map(match => match.slice(1).join('=')).join(' ') !== 'en-CA=https://example.com/ fr-CA=https://example.com/suppression-avis-google.html x-default=https://example.com/') throw new Error(`${relative}: localized homepage alternates are incomplete`);
      const french = relative === 'suppression-avis-google.html';
      if (!html.includes(`<html lang="${french ? 'fr-CA' : 'en-CA'}">`) || !html.includes(`<link rel="canonical" href="https://example.com/${french ? relative : ''}">`)) throw new Error(`${relative}: invalid canonical or document language`);
      if (!html.includes(`name="terms_language" value="${french ? 'fr-CA' : 'en-CA'}"`)) throw new Error(`${relative}: assessment terms use the wrong language`);
      if (!html.includes(`name="privacy_version" value="${privacyRelease}"`) || !html.includes(`name="terms_snapshot_url" value="https://example.com/${policyPath}"`)) throw new Error(`${relative}: the assessment uses an outdated policy record`);
    } else if (alternateLinks.length) throw new Error(`${relative}: unexpected hreflang on a page without a translation`);
    for(const file of ['measurement-config.js','measurement.js','measurement.css'])if((html.match(new RegExp('(?:src|href)="[^"\\s]*'+file.replace('.','\\.')+'(?:\\?v=[A-Za-z0-9-]+)?"','g'))||[]).length!==1)throw new Error(`${relative}: measurement bootstrap missing or duplicated: ${file}`);
    if(/googletagmanager\.com\/(?:gtag\/js|gtm\.js)/.test(html.split('</head>')[0]))throw new Error(`${relative}: direct tag bypasses consent`);
    if (['about.html','blog/index.html'].includes(relative) && (html.match(/<section class="wrap editorial-disclosure">/g)||[]).length !== 1) throw new Error(`${relative}: research disclosure duplicated by rebuild`);
  }
  const feed = fs.readFileSync(path.join(tempRoot, 'feed.xml'), 'utf8');
  const feedPages = pages.filter(name => name.startsWith('blog/') && name !== 'blog/index.html');
  if ((feed.match(/<item>/g) || []).length !== feedPages.length || !feed.includes('href="https://example.com/feed.xml"')) throw new Error('Research RSS feed is missing items or its canonical self URL');
  for (const name of feedPages) if (!feed.includes(`<link>https://example.com/${name}</link>`)) throw new Error(`RSS canonical host was not updated: ${name}`);
  const html = fs.readFileSync(path.join(tempRoot, 'blog/google-review-moderation-2019-2025.html'), 'utf8');
  if ((html.match(/rel="canonical"/g) || []).length !== 1) throw new Error('Canonical tag was duplicated');
  const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  const schema = JSON.parse(json);
  if (schema['@type'] !== 'BlogPosting' || schema.citation.length < 7 || !schema.image.endsWith('.png')) throw new Error('Article schema is incomplete');
  const articleSchemas = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match => JSON.parse(match[1]));
  if (articleSchemas[1]?.['@type'] !== 'BreadcrumbList' || articleSchemas[1]?.itemListElement?.length !== 3) throw new Error('Article breadcrumb schema is incomplete');
  const home = fs.readFileSync(path.join(tempRoot, 'index.html'), 'utf8');
  const quoteButton=home.match(/<button\b[^>]*class="[^"]*submit-button[^>]*>/)?.[0] || '';
  if((quoteButton.match(/\baria-describedby=/g)||[]).length!==1 || !quoteButton.includes('submission-legal assessment-help')) throw new Error('Quote button must preserve legal/help descriptions without duplicate attributes');
  const homeSchema = JSON.parse(home.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (homeSchema['@graph']?.[0]?.['@type'] !== 'Organization' || !homeSchema['@graph']?.[0]?.logo?.endsWith('reviewremoval-logo.svg') || homeSchema['@graph']?.[1]?.['@type'] !== 'WebSite' || homeSchema['@graph']?.[2]?.['@type'] !== 'Service' || homeSchema['@graph']?.[2]?.areaServed?.name !== 'Canada') throw new Error('Home service schema is incomplete');
  const canada = fs.readFileSync(path.join(tempRoot, 'review-removal-canada.html'), 'utf8');
  const canadaSchema = JSON.parse(canada.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (canadaSchema['@graph']?.[0]?.name !== 'Google review removal service across Canada' || canadaSchema['@graph']?.[0]?.areaServed?.name !== 'Canada') throw new Error('Canada Google service schema is incomplete');
  const canadaArticle = fs.readFileSync(path.join(tempRoot, 'blog/canadian-tourism-google-reviews-2023.html'), 'utf8');
  const canadaArticleSchema = JSON.parse(canadaArticle.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]);
  if (canadaArticleSchema.datePublished !== '2026-09-26' || !canadaArticleSchema.citation?.some(url => url.includes('ised-isde.canada.ca'))) throw new Error('Canadian research schema is incomplete');
  const sitemap = fs.readFileSync(path.join(tempRoot, 'sitemap.xml'), 'utf8');
  if ((sitemap.match(/<loc>/g) || []).length !== pages.length) throw new Error('Sitemap does not list every page');
  if(!sitemap.includes('<loc>https://example.com/blog/google-review-removal-rating-impact-study.html</loc><lastmod>2026-10-08</lastmod>')) throw new Error('Rating study sitemap date or URL is incorrect');
  if(!sitemap.includes('<loc>https://example.com/blog/index.html</loc><lastmod>2026-11-27</lastmod>')) throw new Error('Blog index sitemap date is incorrect');
  const physioUrl = 'https://example.com/blog/google-review-removal-physiotherapy-clinics.html';
  const physioEntry = sitemap.split('\n').find(line => line.includes(`<loc>${physioUrl}</loc>`));
  if (!physioEntry?.includes('/blog/assets/physio-google-rating-comparison.webp') ||
      !physioEntry?.includes('/blog/assets/physio-patient-reviewing-options.webp')) throw new Error('Physiotherapy article image discovery is incomplete');
  const timingHtml = fs.readFileSync(path.join(tempRoot,'blog/google-review-removal-time-data.html'),'utf8');
  const timingSchemas = [...timingHtml.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match=>JSON.parse(match[1]));
  const timingArticle = timingSchemas.find(schema=>schema['@type']==='BlogPosting');
  if(timingArticle?.mainEntity?.['@id']!=='https://example.com/blog/google-review-removal-time-data.html#dataset' || timingArticle?.image?.length!==3 || timingArticle?.datePublished!=='2026-11-05') throw new Error('Notice timing article metadata is incomplete');
  if(!sitemap.includes('<loc>https://example.com/blog/google-review-removal-time-data.html</loc><lastmod>2026-11-05</lastmod>') || !sitemap.includes('google-notice-median-tail-examples.svg')) throw new Error('Notice timing article or chart discovery is incomplete');
  console.log(`PASS: production URL script is repeatable, with ${pages.length} sitemap URLs and article/service schema`);
} finally {
  const resolved = fs.realpathSync(tempRoot);
  const safeParent = path.resolve(os.tmpdir()) + path.sep;
  if (!resolved.startsWith(safeParent) || !path.basename(resolved).startsWith('reviewremoval-launch-')) throw new Error('Unsafe temporary directory; not removing it');
  fs.rmSync(resolved, {recursive: true, force: true});
}
