# Add the production domain when ReviewRemoval goes live

The site has no live domain yet, so its HTML intentionally has no canonical URL, `og:url`, XML sitemap, or sitemap line in `robots.txt`. Relative internal links already work.

## Exact files needing production URLs

The launch script updates the `<head>` of all 12 public pages:

- `index.html`
- `platforms.html`
- `remove-facebook-reviews.html`
- `remove-yelp-reviews.html`
- `remove-trustpilot-reviews.html`
- `remove-tripadvisor-reviews.html`
- `remove-glassdoor-reviews.html`
- `blog/index.html`
- `blog/google-review-moderation-2019-2025.html`
- `blog/trustpilot-fake-reviews-by-star-rating.html`
- `blog/review-removal-questions-answered.html`
- `blog/review-report-evidence-checklist.html`

After the live HTTPS domain is final, run the build scripts and then the launch script, substituting the real origin:

```powershell
node build-platform-pages.cjs
node build-blog.cjs
node build-blog-images.cjs
node set-live-domain.cjs https://www.example.com
```

`set-live-domain.cjs` adds a canonical URL, `og:url`, title/description sharing metadata, and Twitter card metadata to every page. It adds Organization and Service structured data to the homepage, Service data to the five platform pages, article structured data to the four blog posts, and chart images as sharing images for the two research posts. It creates `sitemap.xml` with all 12 absolute URLs and `robots.txt` with the sitemap address. It can be rerun when the domain or generated pages change; run it **after** the build scripts because rebuilding pages replaces generated HTML.

## Launch checks outside this workspace

1. Confirm that the site serves the same preferred domain and HTTPS URL used in the launch script, with redirects from other hostnames and HTTP.
2. Open the live sitemap and a few article URLs in a browser. Check that pages, charts, and CSV downloads return successfully.
3. Verify the domain in Google Search Console and submit `https://YOUR-DOMAIN/sitemap.xml`. Request indexing for the homepage, blog hub, and two research pages after publication.
4. Keep the research pages current. If platform reports change, update the article, source table and charts together, then update the visible publication/revision date only when the content actually changes.
5. Redeploy the corrected `google-apps-script.gs` before relying on owner email notifications from quote forms; see `FORM-SETUP.md`.
6. Create and verify a Google Business Profile only if ReviewRemoval has a location customers can visit or meets customers in person. An online-only service is not eligible. If eligible, use the real name, contact details and service area, and keep them consistent wherever the business is listed. Do not create profiles for places without a genuine business presence.
7. Earn relevant Canadian links and mentions by sharing the cited research and useful guides with real industry publications or local business groups. Review search queries and indexing reports in Search Console, then improve pages based on the terms and questions people actually use.

Publishing and Search Console submission make the pages discoverable; they do not guarantee rankings or citations.
