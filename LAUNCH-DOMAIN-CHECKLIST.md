# ReviewRemoval production SEO and launch checklist

The preferred public origin is **https://reviewremoval.ca**. The site contains 27 indexable pages: the original 21 pages, five Google resources covering pricing, fake reviews, reporting/appeals, missing reviews and evidence preparation, and the October 24 denominator audit. `CNAME` identifies the apex domain for GitHub Pages. `404.html` provides a useful error page and is excluded from the sitemap.

## Rebuild order

Run these commands after changing generated platform or blog content, then publish the resulting files:

```powershell
node build-platform-pages.cjs
node blog/data/build-rating-study.cjs
node blog/data/audit-rating-study.cjs
node blog/data/build-google-removal-audit.cjs
node blog/data/audit-google-removal-audit.cjs
python blog/data/plot-google-removal-audit.py
python blog/data/plot-rating-study.py
node build-blog.cjs
node build-research-assets.cjs
node build-blog-images.cjs
python build-social-image.py
node build-google-guides.cjs
node apply-google-focus.cjs
node set-live-domain.cjs https://reviewremoval.ca
node site-check.cjs
node launch-check.cjs
node seo-audit.cjs
```

The domain script is repeatable. It adds unique canonical and social URLs, a social image, Organization/WebSite/Service and article structured data where appropriate, installs Google tag `AW-18449308865` once in the head of all 31 indexable pages, and writes `sitemap.xml` and `robots.txt`. Article, homepage and blog-index sitemap entries use their recorded modification dates; unrelated pages receive no invented freshness date. The same tag is installed directly in `404.html`. Generated HTML loses the domain metadata and tag when rebuilt, so run the Google focus script and then the domain script afterward. Keep the apex domain as the canonical host.

The supplied Google tag loads the Google Ads base tag. It does not define a quote-submission conversion event; that requires the specific conversion event snippet or conversion label from Google Ads. Do not send form contents to the tag.

## Tasks requiring site-owner access or verified details

1. Publish the updated files to the live site. Verify HTTPS and the preferred-domain redirect, then check the live homepage, Canada page, Canadian research article, charts, sitemap, and 404 response.
2. Verify `reviewremoval.ca` in Google Search Console and submit `https://reviewremoval.ca/sitemap.xml`. Check indexing and search queries after Google crawls the pages. A sitemap helps discovery; it does not force indexing or ranking.
3. Redeploy the corrected `google-apps-script.gs` and set its `NOTIFICATION_EMAIL` property before relying on owner email notifications from the quote forms. See `FORM-SETUP.md`. The supplied deployment previously accepted the sheet row but reported an email-recipient error.
4. Complete the actual legal supplier name, mailing address and monitored public contact in `legal-settings.json` and rebuild. Bilingual terms/privacy pages and compact form notices are implemented. Confirm that real data-handling, retention, access and cancellation practices match them, identify the legal supplier in every paid order, and obtain Canadian legal review. See `LEGAL-SETUP.md` for sources and outstanding operational details.
5. Maintain the research articles when source reports change. Update text, source tables, charts, and visible revision dates together after a material edit. For the rating model, also preserve or clearly revise the rounding assumption and version. Do not change dates merely to appear fresh.
6. If ReviewRemoval serves customers in person and meets Google Business Profile eligibility rules, create a profile with the real business details. An online-only service should not claim a physical local presence.
7. Share the cited research and practical guides with relevant Canadian publications and business groups. Monitor earned links, citations, search queries, and indexing reports, then improve pages based on actual reader questions.

Search ranking depends on many factors outside this site. These changes improve technical access and page relevance but cannot guarantee a top position.


October 27 SEO follow-up: the domain pass also generates the editorial-standards
page, normalizes homepage links and preserves source/publication dates. See
`SEO-AUDIT-2026-10-27.md` for live findings, publication exclusions, the exact
homepage redirect condition and separate webmaster-account tasks.
