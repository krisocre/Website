# ReviewRemoval.ca SEO audit

November 24, 2026 · Local implementation and live public HTTP checks

The attached brief specifies changes for ReviewRemoval.ca. ReviewsBoost.ca served as the comparison site. The commercial focus is paid help with Google review removal for Canadian businesses. The existing assessment, pricing, visual design and Google-only scope were used as the baseline.

## Findings and actions

| Priority | Finding | Evidence and action |
| --- | --- | --- |
| High | Duplicate HTTP and homepage URLs | Live HTTP on the apex returned 200. HTTPS `/index.html` also returned 200. Both declare the preferred HTTPS root. `https://www.reviewremoval.ca/` returned 301 to the HTTPS apex, while the HTTP www variant redirected to the HTTP apex. Cloudflare rules are listed below. |
| Medium | Duplicate blog URL | Live `/blog/` and `/blog/index.html` both returned 200 and declare `/blog/index.html`. Retained the latter as the canonical and sitemap URL. |
| Medium | Internal build files were public | Live `build-blog.cjs`, `build-google-guides.cjs`, `google-guides.cjs` and `blog/google-ranking-post.cjs` returned 200. Excluded these authoring tools through Jekyll. Preserved the source code, charts and datasets linked from studies for reproduction. |
| High | Generic headings weakened the service proposition | The old homepage slogan occupied the second H1 line. Replaced it with the location of service and moved the slogan to the existing eyebrow. Clarified the distinction between the free assessment and the work clients hire ReviewRemoval to do. |
| Medium | Policy guidance was distributed across separate resources | Added a source-linked eligibility guide with a policy and evidence matrix, legitimate negative review examples and routes for ordinary reports, eligible appeals and extortion demands. Linked it from the home, resource directories and relevant existing guides. |
| Medium | French discoverability | The French page already returned 200, used a self-canonical, had reciprocal language annotations and appeared in the live sitemap. The supplied export did not include it. Updated Canadian French service copy and linked to it from the English coverage section. Confirm current indexing using URL Inspection. |
| Low | Reported desktop ranking gap | The historical mobile and desktop aggregate positions may reflect different queries. Checked responsive parity, CTA position, navigation and horizontal overflow. No layout evidence of a device-specific indexing issue. |
| Low | About page horizontal overflow | The About hero had a 328 px scroll width at a 320 px viewport because the brand name determined the minimum grid width. Adjusted only the About heading on narrow screens. |
| Owner verification | Homepage customer rating and testimonial | The existing 4.9/5, 5,000+ count and testimonial are visible legacy claims. No underlying rating source or consent record was verifiable in the repository or live checks. Keep their source and date range on file. No Review or AggregateRating markup was added. |

The live sitemap returned HTTP 200 and contained 25 URLs during the audit. All 25 returned 200 with matching canonicals and no `X-Robots-Tag: noindex`. The local sitemap now has 27 URLs, including the previously prepared service process page and the new policy guide. Live `/platforms.html` and `/remove-yelp-reviews.html` returned 404. Previously retired service pages remain retired under the Google-only service decision. Missing test URLs returned a proper 404. No sitemap entries were removed in this pass.

The brief's September 28–November 22 figures are historical. ReviewRemoval.ca had 18 clicks, 1,399 impressions and a 37.02 average position, with a latest weekly position of 21.16. Those data do not identify a present technical cause or establish keyword cannibalization. Collect page-filtered query data before considering URL consolidation.

## Homepage copy and metadata

| Element | Before | After |
| --- | --- | --- |
| Title, Open Graph title and X title | Google Review Removal Service Canada \| ReviewRemoval.ca | Google Review Removal Service in Canada \| ReviewRemoval |
| Meta description, Open Graph description and X description | Google review removal help for Canadian businesses. Get a free assessment. Approved work is CAD $50 per review upfront, plus $125 if removed. | Professional Google review removal help for Canadian businesses. We assess reviews, prepare reports and manage follow-up. Request a free assessment. |
| Canonical | `https://reviewremoval.ca/` | `https://reviewremoval.ca/` |
| H1 | Google review removal. Leave it with us. | Google review removal in Canada. |
| Hero introduction | We assess Google reviews that may violate policy and handle the reporting and follow-up for your Canadian business. | We assess suspected fake or abusive reviews for free. Hire us to prepare the report and handle follow-up. |
| Pricing H2 | Clear pricing, per review. | Google review removal pricing. |
| Assessment H2 | Start with the review. | Request a free assessment. |
| Service H2 | Three steps. One point of contact. | How our removal service works. |
| Policy H2 | A specific concern. A carefully prepared report. | Which Google reviews can be removed? |
| Coverage H2 | For businesses across Canada. | Serving businesses across Canada. |
| Resource H2 | A little clarity before you decide. | Google review guides and tools. |
| FAQ H2 | A few useful answers. | Google review removal FAQs. |

The policy and service sections explain eligible follow-up and where to compare evidence requirements. The homepage still presents its three-step process, estimate and quote controls in the existing layout. The pricing guide answers the single-review and partial-success cases up front. The rate is CAD $50 upfront per accepted review and $125 per successful removal, before applicable taxes.

The French page retains its self-canonical with reciprocal `en-CA`, `fr-CA` and `x-default` annotations. The title now begins “Service de suppression d’avis Google au Canada”. Its introduction and FAQ describe the managed service and what to include for a report already submitted. The English and French WebPage modification dates reflect these substantive edits. Article metadata for the policy guide draws on the visible publication date and linked official sources. Publisher descriptions in regenerated JSON-LD use the same Organization ID and Google-focused wording as the homepage.

## Search intent and internal link inventory

Counts show unique other canonical pages linking to each destination, followed by the subset with a link inside `main`. This measures crawlable discovery, not backlink or click volume. There are 330 → 358 sitewide internal page pairs and 213 → 237 contextual pairs.

| Canonical path | Primary intent | Before total / contextual | After total / contextual |
| --- | --- | ---: | ---: |
| `/` | Hire managed Google review removal in Canada | 25 / 24 | 26 / 25 |
| `/suppression-avis-google.html` | Service de suppression d’avis Google au Canada et au Québec | 25 / 1 | 26 / 2 |
| `/review-removal-canada.html` | Remote service areas, Canadian cities and multiple locations | 24 / 3 | 25 / 3 |
| `/about.html` | ReviewRemoval team scope and brand information | 24 / 19 | 25 / 20 |
| `/terms-of-service.html` | Service terms and fee triggers | 25 / 6 | 26 / 6 |
| `/privacy-policy.html` | Privacy and data handling | 25 / 4 | 26 / 4 |
| `/editorial-policy.html` | Editorial standards, sourcing and corrections | 15 / 15 | 15 / 15 |
| `/blog/index.html` | Google review guides and research directory | 25 / 19 | 26 / 20 |
| `/blog/google-review-moderation-2019-2025.html` | Historical Maps review moderation counts | 8 / 8 | 8 / 8 |
| `/blog/canadian-tourism-google-reviews-2023.html` | Google review usage by tourism SMEs in Canada | 6 / 6 | 6 / 6 |
| `/blog/review-removal-questions-answered.html` | Customer questions before hiring | 3 / 3 | 3 / 3 |
| `/blog/review-report-evidence-checklist.html` | What to gather for a Google review report | 11 / 11 | 11 / 11 |
| `/blog/google-review-removal-rating-impact-study.html` | Model rating ranges after removal | 11 / 11 | 11 / 11 |
| `/google-review-removal-cost-canada.html` | CAD pricing, paid assistance and fee examples | 21 / 11 | 25 / 13 |
| `/remove-fake-google-reviews.html` | Assess suspected fake reviews and document the facts | 7 / 7 | 9 / 9 |
| `/blog/report-google-review-appeal.html` | File reports, check status and pursue eligible appeals | 12 / 12 | 13 / 13 |
| `/google-review-removal-checker.html` | Interactive policy check and downloadable worksheet | 24 / 14 | 25 / 16 |
| `/blog/google-reviews-not-showing.html` | Diagnose missing or delayed reviews | 5 / 5 | 6 / 6 |
| `/google-review-removal-process.html` | Understand the work before approving paid service | 6 / 6 | 8 / 8 |
| `/google-review-removal-policy.html` | Determine which Google Maps policies may apply | — | 10 / 10 |
| `/google-review-case-tracker.html` | Track cases, locations and reporting stages | 2 / 2 | 2 / 2 |
| `/blog/google-review-removal-denominator-audit.html` | Denominators in Google removal statistics | 10 / 10 | 10 / 10 |
| `/blog/google-review-risk-score-denominator-study.html` | Limits of risk estimates based on deleted reviews | 7 / 7 | 7 / 7 |
| `/blog/google-review-removal-appeals-data.html` | Platform-wide appeals data and outcomes by direction | 6 / 6 | 6 / 6 |
| `/blog/google-review-removal-time-data.html` | Published legal-notice timing data and its limits | 1 / 1 | 1 / 1 |
| `/blog/google-review-removal-local-ranking-study.html` | Relationship between displayed ratings and sampled rankings | 1 / 1 | 1 / 1 |
| `/blog/google-reviews-without-text-data-study.html` | Historical review text coverage | 1 / 1 | 1 / 1 |

The policy guide links to the checker, evidence worksheet, appeals guide, pricing and service process. The checker explains the separate worksheet and links to the policy matrix and live report-status instructions. The denominator and appeals studies add one practical link each without changing the research or data. The rating study's existing calculator models rounding uncertainty and remains linked from the homepage and journal. Three newer studies have one inbound page each via the journal and are two clicks from home.

Primary policy references are [Google Maps content policies](https://support.google.com/contributionpolicy/answer/7400114?hl=en), [Google Business Profile reporting and appeals](https://support.google.com/business/answer/4596773?hl=en) and [Google’s extortion reporting guidance](https://support.google.com/business/answer/16404809). The policy guide covers eligibility while the reporting guide covers execution. The Canadian coverage page remains the destination for regional searches.

## Remaining Cloudflare configuration

In the `reviewremoval.ca` Cloudflare zone, use **Rules → Redirect Rules → Single Redirects**. Check that the apex and www DNS records are proxied. Put exact path redirects ahead of the general hostname and HTTPS rule, and review existing rules for overlap. Use **301** and **Preserve query string** for each rule.

| Order | Custom filter expression | Target |
| --- | --- | --- |
| 1 | `(http.host in {"reviewremoval.ca" "www.reviewremoval.ca"} and http.request.uri.path eq "/index.html")` | Static `https://reviewremoval.ca/` |
| 2 | `(http.host in {"reviewremoval.ca" "www.reviewremoval.ca"} and http.request.uri.path in {"/blog" "/blog/"})` | Static `https://reviewremoval.ca/blog/index.html` |
| 3 | `(http.host eq "www.reviewremoval.ca" or (http.host eq "reviewremoval.ca" and not ssl))` | Dynamic `concat("https://reviewremoval.ca", http.request.uri.path)` |

Verify a single hop for `http://www.reviewremoval.ca/index.html?utm_source=redirect-test`, with the query preserved at the HTTPS root. Test `/blog/` and an ordinary French deep link over HTTP, and verify that `https://reviewremoval.ca/blog/index.html` and the apex HTTPS root still return 200. Test the same path and parameter preservation with a representative click ID and the existing pricing shortcut. Verify the existing worker route separately without sending lead data. These rules are account-side work and have not been activated. [Cloudflare Single Redirects setup](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/) · [Google canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

After publishing, verify the excluded generator URLs and this report return 404. Research files intentionally linked in articles should still return 200. Keep canonical and sitemap signals consistent and leave previously indexed development URLs crawlable long enough for Google to see the 404.

## Lab performance

Local Chrome over a loopback HTTP server. Three cold browser contexts per width, 4× CPU throttle, reduced motion and third-party requests blocked. Reported LCP is the median. CTA position is measured from the top of the viewport. These runs describe the checked build under these lab conditions. Field Core Web Vitals and INP were unavailable.

| Width | LCP before | LCP after | CLS before / after | Primary CTA top before / after |
| --- | ---: | ---: | ---: | ---: |
| 390 px | 1,004 ms | 1,036 ms | 0 / 0 | 383 / 383 px |
| 1,440 px | 1,108 ms | 1,104 ms | 0 / 0 | 517 / 517 px |

Both builds loaded 131,303 encoded bytes of first-party resources aside from the main HTML in this setup. The homepage has 453 DOM nodes in each build, and the H1 remained the measured LCP element. Small timing deltas were within run variation. The final copy stayed within the prior first-screen layout.

## Validation

- Production URL generation passed twice in a temporary checkout. The local SEO audit passed for all 27 canonical pages, including unique titles, descriptions, social previews, JSON-LD, sitemap and robots directives. The Google-only scope and press banner checks passed.
- The browser crawl passed for all 27 pages at 320, 390 and 1,440 px. It checked internal links, anchors, image loads, headings and the rating study calculator. The older crawl test was still referencing retired platform assets and is now driven by the active sitemap.
- The homepage regression passed at 320, 375, 390, 768, 1,024, 1,440 and 1,920 px. It checked CTA visibility, the calculator, keyboard navigation and reduced motion. Both language forms passed using mocked Turnstile and submission responses. Before-and-after visuals were inspected at 390 and 1,440 px. The consent control remained visible and clear of the primary CTA.
- Evidence checker and worksheet tests passed, including the two-question limit, official route links, downloads and static checklists with JavaScript disabled. Ads, consent, attribution and Turnstile checks passed with mocked providers. All 14 backend and worker unit tests passed. No real lead or conversion events were sent.
- JavaScript syntax checks and `git diff --check` passed. Ruby/Jekyll was unavailable in the local shell. The Node-generated website and its browser output were validated, with final publishing exclusions to verify after the hosted build.

## Measurement after publication

1. Submit the live sitemap in Google Search Console. Inspect the HTTPS root, French landing page, policy guide, process page, pricing and appeals guide for the crawl date, index status and Google-selected canonical. Inspect representative aliases after adding the edge rules.
2. Compare equivalent 28-day ranges before and after the changes settle. Filter Search performance to Canada. Split desktop and mobile, then break out homepage, pricing, policy, appeals and French URLs.
3. Track impressions, clicks, CTR and average position for non-branded commercial groups. Include paid or hire language, removal service or company, negative or bad review removal, country and city modifiers, costs, and fake reviews. Track branded searches and educational research separately.
4. Compare organic assessment submissions and qualified organic leads with the existing attribution records. Use manual qualification for genuine business inquiries and report unclassified leads separately. Reconcile the attribution totals with lead records because some referrers and consent-gated events will be missing.
5. Recheck page-filtered query exports for pages trading impressions on the same terms. Review external referring pages for retired URLs and investigate outlier changes before reworking content. URL Inspection, country and page-filtered exports, Google-selected canonicals, field Core Web Vitals and backlink or qualified lead records require the relevant account access.

## Files in this update

- Homepage, French and narrow-screen About content `index.html`, `suppression-avis-google.html`, `about.html`, `about.css`.
- Guide source and public output `google-guides.cjs`, `build-google-guides.cjs`, `google-review-removal-policy.html` (new), `google-review-removal-cost-canada.html`, `google-review-removal-checker.html`, `google-review-removal-process.html`, `remove-fake-google-reviews.html`, `blog/report-google-review-appeal.html`, `blog/google-reviews-not-showing.html`.
- Discovery and metadata `apply-google-focus.cjs`, `apply-service-positioning.cjs`, `set-live-domain.cjs`, `review-removal-canada.html`, `google-review-case-tracker.html`, `blog/index.html`, `sitemap.xml`, `feed.xml`.
- Research article metadata or navigation `blog/canadian-tourism-google-reviews-2023.html`, `blog/google-review-moderation-2019-2025.html`, `blog/google-review-removal-appeals-data.html`, `blog/google-review-removal-denominator-audit.html`, `blog/google-review-removal-local-ranking-study.html`, `blog/google-review-removal-rating-impact-study.html`, `blog/google-review-removal-time-data.html`, `blog/google-review-risk-score-denominator-study.html`, `blog/google-reviews-without-text-data-study.html`, `blog/review-report-evidence-checklist.html`, `blog/review-removal-questions-answered.html`.
- Publication exclusions and validation `_config.yml`, `homepage-check.cjs`, `launch-check.cjs`, `site-check.cjs`, `SEO-AUDIT.md` (new, excluded from Jekyll).

The working tree also contained earlier changes to `about.html`, `build-blog.cjs`, `home.css` and some of the generated pages listed above. Existing Google Ads, analytics, attribution, Turnstile, Apps Script and legal terms stayed in place. No production form submissions or live changes were made.
