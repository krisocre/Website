# ReviewRemoval.ca ? Google-primary / Yelp-secondary SEO update

Date: November 5, 2026. Local implementation only. Nothing deployed, committed or pushed.

## Outcome and scope

Google review removal assistance for Canadian businesses is the primary commercial service. Yelp review reporting remains the only secondary service. Existing Google resources keep distinct pricing, fake-review evidence, free-tool and Canadian coverage intents rather than competing with an identical homepage title.

The homepage body is byte-for-byte unchanged. Full-page before/after screenshots at 1440, 390 and 320 pixels have **zero changed pixels**, with image sizes 1440?5210, 390?7974 and 320?8957. Screenshots used the same browser, reduced motion, fresh consent state and mocked Turnstile responses. Reduced motion controlled animation timing for a stable comparison; no production styles or animation code changed. Separate homepage regression tests exercised five widths and the existing five-second carousel.

All **147 existing blog files** match pre-task hashes, including every article, blog index, image, dataset and article module. No new blog article was created in this task. Earlier unpublished research work was already present when this task began; it was preserved separately from these changes.

No frontend JavaScript, CSS, images, form HTML, payment flow, endpoints, Apps Script, Turnstile configuration, consent implementation, analytics IDs or conversion code changed. Every original form and its fields are byte-for-byte unchanged. The six unavailable services retain their existing forms in collapsed native details sections for previous-request enquiries; surrounding text makes clear that these forms do not offer new orders. Existing price fields remain historical references, not active service advertisements. The current Google/Yelp price remains CAD $50 upfront per review plus CAD $125 for each successfully removed review.

## Homepage metadata before and after

| Element | Before | After |
|---|---|---|
| Title | Google Review Removal Service in Canada | ReviewRemoval | Google Review Removal Service Canada | ReviewRemoval.ca |
| Description | Policy-based Google review removal help for businesses in Toronto and across Canada. CAD $50 upfront per review + $125 if removed. Get a quote. | Professional Google review removal assistance for Canadian businesses. Help reporting fake, spam and policy-violating reviews. Get a free assessment. |
| Open Graph title | Same as previous title | Same as new title |
| Open Graph description | Same as previous description | Same as new description |
| Twitter/X title and description | Same as previous title and description | Same as new title and description |
| Canonical | https://reviewremoval.ca/ | Unchanged; one tag |
| Robots | index, follow, max-image-preview:large | Unchanged |
| H1 | Google review removal. Leave it with us. | Unchanged |
| Social image and alt text | Existing ReviewRemoval branded image | Unchanged |

The homepage Organization description now states Google review removal assistance for Canadian businesses with Yelp support. The existing Google Service description accurately describes assessment, evidence/report preparation and reporting assistance; provider identity, Canada coverage and legitimate offer pricing remain intact. WebPage title/description match the new search metadata. No fabricated location, LocalBusiness office, credentials, review/aggregate rating or guarantee was added. The existing H1 already clearly describes Google review removal and did not require an exception.

The title and description are concise, page-specific proposals. Google can choose a different title or snippet; neither the exact display nor an improvement in rankings or CTR is guaranteed. Sources: [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link), [Google snippet guidance](https://developers.google.com/search/docs/appearance/snippet).

## Discontinued service references

Removed active non-blog promotion and obsolete service/offer markup for Facebook, Trustpilot, Tripadvisor, Glassdoor, Booking.com and Indeed. Sitejabber had no existing offering to remove. The directory has two services, Google first and Yelp second. Canada/about copy no longer claims eight supported platforms. Yelp's related-services section now points only to Google. Existing historical research links about other platforms remain research references, not service advertisements.

Each retired URL still exists, retains its self-canonical and indexability, and explains that new platform-specific requests are no longer accepted. These pages describe availability with WebPage/BreadcrumbList schema, not an active Service or purchasable Offer. No redirect, canonical consolidation, noindex or deletion was introduced.

**Homepage restriction conflict intentionally preserved:** its moving eight-platform banner still links to Facebook, Trustpilot, Tripadvisor, Booking.com, Glassdoor and Indeed. Their labels, destinations, visual appearance and animation were not changed. They now lead to the corresponding availability notices. Removing these last visible promotions requires explicit permission to change the homepage. Historical blog text, metadata, article CTAs and links to earlier service URLs also remain unchanged under the blog protection requirement.

## Technical SEO decisions

- All 33 sitemap URLs remain intact; no page URL or canonical value changed. `robots.txt`, CNAME, existing indexing directives, 404 template and feed are unchanged.
- Sitemap changes are limited to lastmod dates on ten materially changed service/about/coverage pages. Blog entries and image references are byte-for-byte unchanged. The date reflects this actual content/service-availability change, rather than a routine date refresh. [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) supports accurate dates for significant content, link or structured-data changes.
- Build metadata-block removal now accepts indentation and removes repeated blocks. An isolated build exposed the existing exact-two-space matcher duplicating canonicals on formatted homepage HTML. Two full build passes now yield one canonical per page and identical checked outputs.
- Shared service policy explicitly returns blog HTML untouched. Existing article-specific metadata remains protected; no generic Google service keyword replacement was applied inside blog files.
- Kept national/city targeting on the existing Canadian coverage page, including Toronto, Mississauga, Vancouver, Calgary, Edmonton, Ottawa, Montr?al, Winnipeg, Hamilton and Halifax. No artificial city pages, physical office claims, keyword tags or hidden keyword paragraphs were added.
- Structured data stays tied to displayed services, prices and availability. [Google's structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) require accurate, relevant content rather than misleading service claims.

## Validation results

| Check | Result |
|---|---|
| Pre-task file snapshot/hashes | Saved before editing; 272 files |
| `node service-positioning-check.cjs` with baseline | PASS: 17 non-blog pages; every original form, homepage body, blog file, canonical/indexing directive and sitemap URL/blog entry protected |
| Before/after screenshots | PASS: zero changed pixels at 1440/390/320px |
| Dedicated HTTP browser checks | PASS: homepage plus ten service/about/coverage pages; HTTP 200 locally; one H1 and canonical; no overflow or script exceptions across four widths |
| Isolated platform ? Google-focus ? production build, twice | PASS: identical checked outputs; no protected production pages copied back |
| `node launch-check.cjs` | PASS: repeated URL generation, 33 sitemap URLs and service/article metadata |
| `node seo-audit.cjs` | PASS: 33 unique indexable URLs, metadata, images, JSON-LD, sitemap, robots and 404 |
| `node site-check.cjs` | PASS: 33 pages, internal links/anchors, images, layouts, service quote arithmetic and mocked form payloads |
| `node homepage-check.cjs` | PASS: five widths; carousel/buttons/menu/banner; quote, legal payload and security behaviour with mocks |
| `node google-focus-check.cjs` | PASS: guide layouts, worksheet downloads, evidence paths and no-JavaScript content |
| `node turnstile-check.cjs` | PASS: 46 backend cases and browser security lifecycle; provider responses mocked |
| `node measurement-check.cjs` | PASS: consent, privacy, single loader, CTA/start events and confirmed-only lead tracking with mocks |

No real customer leads, notification emails, Cloudflare provider checks or Google Ads conversions were sent during verification. Tests do **not** establish that a live Apps Script deployment, real Turnstile secret or production conversion action is correctly configured. Browser HTTP status checks above concern the local server; new SEO changes are not live yet. There is no configured package.json/linter command; changed JavaScript build/test files were checked with Node syntax validation and whitespace checks.

## Every modified or added source/output file in this task

- `SERVICE-POSITIONING-SEO-REPORT.md` ? This reviewable scope, evidence, validation and file manifest.
- `_config.yml` ? Exclude the build-time service policy, regression check and internal report from Jekyll publication.
- `about.html` ? Clarify Google specialisation and Yelp-only secondary support in the existing introduction; remove the obsolete eight-platform claim and align non-blog metadata.
- `apply-google-focus.cjs` ? Use the shared homepage SEO values and prevent the existing modern homepage body from being regenerated during future Google-focus builds.
- `apply-service-positioning.cjs` ? New repeatable build-time policy for root-page metadata/schema, Google/Yelp directories and retired-service availability notices. It skips all blog paths and preserves the homepage body.
- `build-platform-pages.cjs` ? Generate only Google/Yelp promotional cards and apply the availability policy to retained legacy URLs; keep legacy form field definitions.
- `editorial-policy.html` ? Update the embedded organisation description only; visible research standards and historical research links unchanged.
- `google-review-removal-checker.html` ? Update the embedded publisher/organisation service description only; tool, visible content and JavaScript unchanged.
- `google-review-removal-cost-canada.html` ? Improve the existing pricing-guide search description and align OG/Twitter/article/organisation metadata; visible guide content unchanged.
- `homepage-check.cjs` ? Trim formatting whitespace when comparing the unchanged testimonial text; the exact visible wording assertion remains.
- `index.html` ? Head only: Google/Canada commercial title, description, matching OG/Twitter values, factual Organization/Service/WebPage descriptions. Body bytes unchanged.
- `launch-check.cjs` ? Include the service policy in isolated build fixtures; assert availability-page schema instead of obsolete active offerings and verify Google-focused Canadian schema.
- `platforms.html` ? Replace eight-platform promotion with Google first and Yelp second, retain the existing design/prices, and describe the two current services in CollectionPage/ItemList metadata.
- `privacy-policy.html` ? Update the embedded organisation description only; privacy text and consent implementation unchanged.
- `remove-booking-com-reviews.html` ? Retain the URL and indexability; replace sales content with an availability notice and Google/Yelp links; remove Service/Offer schema. Preserve the original form and success state inside a previous-request details panel, with historical-pricing context outside the form.
- `remove-facebook-reviews.html` ? Retain the URL and indexability; replace sales content with an availability notice and Google/Yelp links; remove Service/Offer schema. Preserve the original form and success state inside a previous-request details panel, with historical-pricing context outside the form.
- `remove-fake-google-reviews.html` ? Clarify Canadian reporting/evidence/paid-help intent in its description and matching non-blog metadata; visible guide content unchanged.
- `remove-glassdoor-reviews.html` ? Retain the URL and indexability; replace sales content with an availability notice and Google/Yelp links; remove Service/Offer schema. Preserve the original form and success state inside a previous-request details panel, with historical-pricing context outside the form.
- `remove-indeed-reviews.html` ? Retain the URL and indexability; replace sales content with an availability notice and Google/Yelp links; remove Service/Offer schema. Preserve the original form and success state inside a previous-request details panel, with historical-pricing context outside the form.
- `remove-tripadvisor-reviews.html` ? Retain the URL and indexability; replace sales content with an availability notice and Google/Yelp links; remove Service/Offer schema. Preserve the original form and success state inside a previous-request details panel, with historical-pricing context outside the form.
- `remove-trustpilot-reviews.html` ? Retain the URL and indexability; replace sales content with an availability notice and Google/Yelp links; remove Service/Offer schema. Preserve the original form and success state inside a previous-request details panel, with historical-pricing context outside the form.
- `remove-yelp-reviews.html` ? Keep Yelp-specific content, forms and prices; refine Yelp-only metadata and retain Google as the sole related service.
- `review-removal-canada.html` ? Remove discontinued-platform promotions/links, retain Canadian city coverage and CAD fees, and change the former multi-platform Service definition to Google assistance.
- `service-positioning-check.cjs` ? New regression checks for Google/Yelp intent, unavailable-service schema, idempotency, canonical/indexing preservation and optional pre-task hashes/forms/blog protection.
- `set-live-domain.cjs` ? Apply the root-page service policy after normal generation, use Google-specific Canadian Service definitions, and fix metadata-marker removal so formatted HTML cannot acquire duplicate canonicals.
- `site-check.cjs` ? Exercise retained legacy forms after opening their native details panels and verify active Yelp pricing separately; keep mocked payload/security checks.
- `sitemap.xml` ? Change lastmod only for ten pages whose visible service content changed. All 33 URLs, image entries and protected blog entries remain unchanged.
- `terms-of-service.html` ? Update the embedded organisation description only; contractual text, notices and pricing unchanged.

Private audit artifacts under `.seo-private/google-yelp-positioning-2026-11-05/` contain the pre-task snapshot/hashes, screenshots, rendering/pixel-comparison results, an isolated build and this task's browser harness. They are ignored by Git and are not publication assets.

## Protected blog and functionality inventory

The following blog paths are unchanged, including metadata, content, internal links and image/data bytes:

- `blog/assets/canadian-sme-online-activities-2023.png`
- `blog/assets/canadian-sme-online-activities-2023.svg`
- `blog/assets/google-maps-appeals-direction.png`
- `blog/assets/google-maps-appeals-direction.svg`
- `blog/assets/google-maps-appeals-median-hours.png`
- `blog/assets/google-maps-appeals-median-hours.svg`
- `blog/assets/google-maps-appeals-receipt-share.png`
- `blog/assets/google-maps-appeals-receipt-share.svg`
- `blog/assets/google-moderation-2019-2025.png`
- `blog/assets/google-moderation-2019-2025.svg`
- `blog/assets/google-notice-category-medians.png`
- `blog/assets/google-notice-category-medians.svg`
- `blog/assets/google-notice-median-tail-examples.png`
- `blog/assets/google-notice-median-tail-examples.svg`
- `blog/assets/google-notice-receipt-mix.png`
- `blog/assets/google-notice-receipt-mix.svg`
- `blog/assets/google-removal-metric-changes.png`
- `blog/assets/google-removal-metric-changes.svg`
- `blog/assets/google-removal-reasons-denominators.png`
- `blog/assets/google-removal-reasons-denominators.svg`
- `blog/assets/google-removal-source-corrections.png`
- `blog/assets/google-removal-source-corrections.svg`
- `blog/assets/google-risk-deleted-share.png`
- `blog/assets/google-risk-deleted-share.svg`
- `blog/assets/google-risk-identification-bounds.png`
- `blog/assets/google-risk-identification-bounds.svg`
- `blog/assets/google-risk-same-subset.png`
- `blog/assets/google-risk-same-subset.svg`
- `blog/assets/google-user-reported-2019-2021.svg`
- `blog/assets/rating-recovery-range.png`
- `blog/assets/rating-recovery-range.svg`
- `blog/assets/rating-removal-threshold-map.png`
- `blog/assets/rating-removal-threshold-map.svg`
- `blog/assets/rating-removal-uncertainty.png`
- `blog/assets/rating-removal-uncertainty.svg`
- `blog/assets/tripadvisor-fraud-series.png`
- `blog/assets/tripadvisor-fraud-series.svg`
- `blog/assets/tripadvisor-screening-2024.png`
- `blog/assets/tripadvisor-screening-2024.svg`
- `blog/assets/trustpilot-appeals-2025.png`
- `blog/assets/trustpilot-appeals-2025.svg`
- `blog/assets/trustpilot-detection.svg`
- `blog/assets/trustpilot-fake-reviews-by-star.png`
- `blog/assets/trustpilot-fake-reviews-by-star.svg`
- `blog/assets/yelp-review-transitions.png`
- `blog/assets/yelp-review-transitions.svg`
- `blog/blog.css`
- `blog/canadian-tourism-google-reviews-2023.html`
- `blog/data/README.md`
- `blog/data/audit-google-maps-appeals.py`
- `blog/data/audit-google-notice-timing.py`
- `blog/data/audit-google-removal-audit.cjs`
- `blog/data/audit-google-risk-study.py`
- `blog/data/audit-rating-study.cjs`
- `blog/data/audit-trustpilot-appeals.cjs`
- `blog/data/build-google-maps-appeals.py`
- `blog/data/build-google-notice-timing.py`
- `blog/data/build-google-removal-audit.cjs`
- `blog/data/build-google-risk-study.py`
- `blog/data/build-rating-study.cjs`
- `blog/data/canadian-sme-online-activities-2023.csv`
- `blog/data/collect-google-removal-sources.cjs`
- `blog/data/google-maps-appeals-categories.csv`
- `blog/data/google-maps-appeals-categories.csv-metadata.json`
- `blog/data/google-maps-appeals-contrasts.csv`
- `blog/data/google-maps-appeals-contrasts.csv-metadata.json`
- `blog/data/google-maps-appeals-indicators.csv`
- `blog/data/google-maps-appeals-indicators.csv-metadata.json`
- `blog/data/google-maps-appeals-source-values.json`
- `blog/data/google-maps-appeals-study.bib`
- `blog/data/google-maps-appeals-study.cff`
- `blog/data/google-maps-appeals-study.json`
- `blog/data/google-notice-category-summary.csv`
- `blog/data/google-notice-category-summary.csv-metadata.json`
- `blog/data/google-notice-median-examples.csv`
- `blog/data/google-notice-median-examples.csv-metadata.json`
- `blog/data/google-notice-period-summary.csv`
- `blog/data/google-notice-period-summary.csv-metadata.json`
- `blog/data/google-notice-source-cells.csv`
- `blog/data/google-notice-source-cells.csv-metadata.json`
- `blog/data/google-notice-timing-study.bib`
- `blog/data/google-notice-timing-study.cff`
- `blog/data/google-notice-timing-study.json`
- `blog/data/google-removal-comparisons-2026.csv`
- `blog/data/google-removal-comparisons-2026.csv-metadata.json`
- `blog/data/google-removal-denominator-audit-2026.csv`
- `blog/data/google-removal-denominator-audit-2026.csv-metadata.json`
- `blog/data/google-removal-denominator-audit-2026.json`
- `blog/data/google-removal-denominator-audit.bib`
- `blog/data/google-removal-denominator-audit.cff`
- `blog/data/google-removal-source-values-2026.json`
- `blog/data/google-review-moderation-2019-2025.csv`
- `blog/data/google-risk-bounds.csv`
- `blog/data/google-risk-bounds.csv-metadata.json`
- `blog/data/google-risk-denominator-study.bib`
- `blog/data/google-risk-denominator-study.json`
- `blog/data/google-risk-examples.csv`
- `blog/data/google-risk-examples.csv-metadata.json`
- `blog/data/google-risk-quintiles.csv`
- `blog/data/google-risk-quintiles.csv-metadata.json`
- `blog/data/google-risk-source-values.json`
- `blog/data/google-risk-velocity.csv`
- `blog/data/google-risk-velocity.csv-metadata.json`
- `blog/data/plot-google-maps-appeals.py`
- `blog/data/plot-google-notice-timing.py`
- `blog/data/plot-google-removal-audit.py`
- `blog/data/plot-google-risk-study.py`
- `blog/data/plot-rating-study.py`
- `blog/data/plot-trustpilot-appeals.py`
- `blog/data/rating-model.js`
- `blog/data/rating-removal-sensitivity-2026.csv`
- `blog/data/rating-removal-sensitivity-2026.json`
- `blog/data/review-status-tracking-template.csv`
- `blog/data/tripadvisor-review-fraud-2018-2024.csv`
- `blog/data/tripadvisor-screening-2024.csv`
- `blog/data/tripadvisor-source-differences.csv`
- `blog/data/trustpilot-appeal-outcomes-2025.bib`
- `blog/data/trustpilot-appeal-outcomes-2025.cff`
- `blog/data/trustpilot-appeals-2025.csv`
- `blog/data/trustpilot-appeals-2025.json`
- `blog/data/trustpilot-fake-reviews-by-star-2024.csv`
- `blog/data/yelp-longitudinal-cohorts.csv`
- `blog/data/yelp-reclassification-2012-2020.csv`
- `blog/google-denominator-post.cjs`
- `blog/google-maps-appeals-post.cjs`
- `blog/google-notice-timing-post.cjs`
- `blog/google-review-moderation-2019-2025.html`
- `blog/google-review-removal-appeals-data.html`
- `blog/google-review-removal-denominator-audit.html`
- `blog/google-review-removal-rating-impact-study.html`
- `blog/google-review-removal-time-data.html`
- `blog/google-review-risk-score-denominator-study.html`
- `blog/google-reviews-not-showing.html`
- `blog/google-risk-post.cjs`
- `blog/index.html`
- `blog/rating-calculator.js`
- `blog/rating-impact-post.cjs`
- `blog/report-google-review-appeal.html`
- `blog/research-data.cjs`
- `blog/research-posts.cjs`
- `blog/review-removal-questions-answered.html`
- `blog/review-report-evidence-checklist.html`
- `blog/tripadvisor-fake-review-statistics-removal-rates.html`
- `blog/trustpilot-appeal-outcomes-2025.html`
- `blog/trustpilot-appeals-post.cjs`
- `blog/trustpilot-fake-reviews-by-star-rating.html`
- `blog/yelp-reviews-disappear-reappear-data.html`

Also protected: `build-blog.cjs`, all frontend `.js` and `.css` files, all image/font assets, `google-apps-script.gs`, `legal-settings.json`, `robots.txt`, `CNAME`, `feed.xml`, every original form block, every canonical value and every existing robots directive. Runtime Google Ads and Turnstile identifiers and submission URLs were not changed. ReviewsBoost was not edited.

## Risks and follow-up requiring separate approval

1. Discontinued-platform queries may lose impressions/rankings when sales content is replaced with availability notices. This is an intentional relevance change. Retaining a URL and its backlinks does not preserve its former rankings or automatically transfer those signals to Google service pages. Google may treat some notice pages as low-value availability pages; we have not redirected them to unrelated services or hidden their status.
2. The protected homepage banner still suggests eight services. Approve a separate homepage content change if it should list only Google/Yelp. No such change was made here.
3. Blog CTAs may lead to retired service pages. Those URLs now explain the status, but the protected blog links were not edited. Any editorial update would need separate authorization.
4. Legacy forms still use their original labels, historical plan fields, endpoints and lead tracking. Their enclosing availability/previous-request context distinguishes them from new orders. Disabling them or changing how previous-client enquiries count as conversions would require a separate functional change.
5. Review and approve publication separately. After publication, verify the homepage/Yelp/availability URLs in Search Console and Bing Webmaster Tools, request appropriate recrawls and monitor Canadian Google-service query groups, CTR and qualified leads against a dated pre-release baseline. No ranking lift was measured or promised in this local task.
