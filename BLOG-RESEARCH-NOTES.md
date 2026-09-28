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
