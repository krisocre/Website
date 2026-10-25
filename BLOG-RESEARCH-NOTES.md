# Research posts added 27 September 2026

## Topic selection

The public search-result review covered these query families:

- Yelp reviews disappearing, returning, not recommended, recommendation reclassification and the 41.3% historical result.
- Tripadvisor fake-review statistics, reported-review removal percentages, pre-publication blocking, and the 7.3% / 4.9% / 13.5% moderation figures.
- Google rating calculators and review-removal rating arithmetic as an alternative topic.

Many Google rating-calculator results already offer formulas and worked examples, so that broad topic was not selected. Yelp results often explain the recommendation system but rarely reconstruct the historical transition matrix. Tripadvisor results often repeat the 2.7 million fraud total without distinguishing initial screening, reports and publication status.

These observations describe the search results inspected, not a measured keyword-volume or keyword-difficulty study. We have no Search Console history or paid search-volume dataset for ReviewRemoval. The new articles target observable questions; their topics do not guarantee traffic, citations or ranking.

## What is original

1. **Yelp:** reconstruction of the matched transition table; source-state conditional percentages; gross movement versus net change; downloadable observations template; practical workflow for Canadian listings. Underlying review counts and cohort data belong to the cited researchers.
2. **Tripadvisor:** four-period compilation with separate reported/calculated fields; a documented 2018 source disagreement (original 2.1%, later retrospective 2.4%); 1,000-submission normalization; 2020 community-report denominator example; a diagram separating initial outcomes from the broader human-moderation measure. Underlying data are company self-reports.

Both are secondary data analyses. ReviewRemoval did not conduct the original study, inspect private moderation records, measure client outcomes or establish Canadian fraud rates.

## Reproduction

```powershell
node build-research-assets.cjs
node build-blog.cjs
node build-platform-pages.cjs
node build-blog-images.cjs
node set-live-domain.cjs https://reviewremoval.ca
node site-check.cjs
node launch-check.cjs
node seo-audit.cjs
```

Source values live in `blog/research-data.cjs`; article copy lives in `blog/research-posts.cjs`. Rebuild the CSV, SVG and PNG outputs after a data edit. Do not silently change historical figures when a newer report arrives: add the new activity period and explain changes in definition.

## Verification scope

Checks cover local links, images, tables, page widths, article metadata, structured data, sitemap coverage and quote forms. The new matrix arithmetic and normalized examples were independently recalculated. Publication, Google crawling and ranking remain separate steps.

## October 8, 2026: rounded-score uncertainty analysis

The new article adds a specific angle beyond a generic star-rating calculator: integer-feasible ranges after review removal, rather than treating the rounded display as an exact starting average. Search results inspected included several existing recovery calculators; this is not a claim that no other uncertainty calculator exists, nor a keyword-volume study. The contribution is our open 1,625-input grid, feasibility exclusions, three downloadable figures, reproducible source code and an independent histogram audit.

Primary guidance checked: Google score definition (4801187), reporting process (4596773), Maps policy (7400114), review requests (3474122), local ranking (7091), and the Competition Bureau's October 14, 2015 Bell announcement. The Bell example is historical app-review context, not a Google Maps case or a current legal-penalty schedule.

Google's cited scoring page confirms an average but does not document the tie-rounding rule. All display boundaries use an explicit nearest-tenth, half-up assumption. New-review update guidance is not presented as a removal deadline. Simulated inputs are not described as empirical Canadian data; grid frequencies are not probabilities. Citation language, Dataset schema and visible methods preserve these limits. Original data/code/figures are licensed CC BY 4.0.

Reproduction: `node blog/data/build-rating-study.cjs`, `node blog/data/audit-rating-study.cjs`, `python blog/data/plot-rating-study.py`, `node build-blog.cjs`, then `node set-live-domain.cjs https://reviewremoval.ca`. The article is linked from the homepage, blog archive and related article cards. The sitemap records article and blog-index modification dates from their existing schema instead of stamping every page with today's date.


## October 24, 2026: Google removal denominator audit

New article: `blog/google-review-removal-denominator-audit.html`. An original
compilation of 34 source records and 13 nominal comparisons distinguishes
contribution-based reason rates, count units, announcement thresholds and
superseded/revised reporting values. The new article is featured in the blog,
linked from the homepage and included in the sitemap with three figure entries.

Primary sources are Google's 2024/2025 overview and enforcement exhibits, report
FAQ, March 2026 correction notice and 2025/2026 company announcements. Localo's
original review-velocity study provides separate selection-method context; its
counts are not merged into this dataset. Captured source text is kept privately
in the ignored `.seo-private/maps-source/` directory. Four release fingerprints
are preserved in the public input JSON.

The current display magnitudes 245M and 292M yield a nominal 19.2% change. They
are not exact counts. The >240M and >292M announcement thresholds remain separate
records. Reason percentages use all contributed reviews. Harm stays a strict
<0.1% bound; there is no inferred zero, point estimate or unchanged-rate claim.
The correction from 70M to 82M reverses the nominal direction of the comparison
with 2025's 79M removed place edits. Accounts/profiles use action-year timing,
not the content contribution snapshot date.

Reproduce the dataset with `node blog/data/build-google-removal-audit.cjs`, audit
with `node blog/data/audit-google-removal-audit.cjs`, and plot with
`python blog/data/plot-google-removal-audit.py`. The optional
`node blog/data/collect-google-removal-sources.cjs` needs Puppeteer and Chrome;
it checks current public displays and writes new live-check files without
overwriting release captures. It fails on changed values. Then rebuild the
blog, apply the Google focus changes and run the domain script, in the launch
checklist's documented order.

The three figures are 1200 by 720 pixels plus accessible-text SVGs with font
fallbacks. CSV/JSON, CSVW definitions, CFF/BibTeX and scripts are downloadable.
Original compilation, calculations and figures: CC BY 4.0; external sources
retain their rights. This is global company-reported data, not a Canadian
case-success dataset, original user survey or independently audited Google
moderation log. No ranking or citation outcome is guaranteed.

### Research-page SEO additions (October 24, 2026)

The audit now has a statistics-focused title, connected BlogPosting/Dataset
identifiers, explicit source derivation and named, licensed downloads. All three
original graphs have ImageObject captions, creator credits, dimensions and licence
links. Both CSVs have downloadable column definitions. Contextual links from the
fake-review and report-evidence guides lead readers to the audit.

`set-live-domain.cjs` also generates `feed.xml` from the twelve dated blog articles
and guides; the blog pages advertise it and the index provides a visible RSS link.
The feed uses canonical URLs and recorded publication dates. The domain launch
check verifies the feed when changing hosts. After publishing, inspect the new
article in Search Console and Bing Webmaster Tools and verify that the article,
images, datasets and feed return successfully on the live domain.
