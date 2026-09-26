# ReviewRemoval production SEO and launch checklist

The preferred public origin is **https://reviewremoval.ca**. The site contains 15 indexable pages: the homepage, platform directory, About page, seven platform service pages, blog index, and four articles. `CNAME` identifies the apex domain for GitHub Pages. `404.html` provides a useful error page and is excluded from the sitemap.

## Rebuild order

Run these commands after changing generated platform or blog content, then publish the resulting files:

```powershell
node build-platform-pages.cjs
node build-blog.cjs
node build-blog-images.cjs
python build-social-image.py
node set-live-domain.cjs https://reviewremoval.ca
node site-check.cjs
node launch-check.cjs
node seo-audit.cjs
```

The domain script is repeatable. It adds unique canonical and social URLs, a social image, Organization/WebSite/Service and article structured data where appropriate, and writes `sitemap.xml` and `robots.txt`. Generated HTML loses this metadata when rebuilt, so always run the domain script afterward. Keep the apex domain as the canonical host.

## Tasks requiring site-owner access or verified details

1. Publish the updated files to the live site. Verify HTTPS and the preferred-domain redirect, then check the live homepage, two new service pages, charts, sitemap, and 404 response.
2. Verify `reviewremoval.ca` in Google Search Console and submit `https://reviewremoval.ca/sitemap.xml`. Check indexing and search queries after Google crawls the pages. A sitemap helps discovery; it does not force indexing or ranking.
3. Redeploy the corrected `google-apps-script.gs` and set its `NOTIFICATION_EMAIL` property before relying on owner email notifications from the quote forms. See `FORM-SETUP.md`. The supplied deployment previously accepted the sheet row but reported an email-recipient error.
4. Supply a real public business contact address or email and the verified legal business name. Add them to the About page and Organization data when confirmed. Publish a privacy notice explaining the quote data sent to Google Apps Script and stored in Google Sheets, who can access it, its actual retention period, and how clients can request access or deletion; link it beside each form.
5. Maintain the two research articles when source reports change. Update text, source tables, charts, and visible revision dates together after a material edit. Do not change dates merely to appear fresh.
6. If ReviewRemoval serves customers in person and meets Google Business Profile eligibility rules, create a profile with the real business details. An online-only service should not claim a physical local presence.
7. Share the cited research and practical guides with relevant Canadian publications and business groups. Monitor earned links, citations, search queries, and indexing reports, then improve pages based on actual reader questions.

Search ranking depends on many factors outside this site. These changes improve technical access and page relevance but cannot guarantee a top position.
