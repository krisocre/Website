# Google Maps notice timing research — November 5, 2026

ReviewRemoval publication: `blog/google-review-removal-time-data.html`.
Source module: `blog/google-notice-timing-post.cjs`.

## Contribution and scope

This is secondary research, not a new customer outcome study. It extracts 2,800 numeric indicator positions from two Google Maps EU-focused legal-notice reports (July–December 2025 and January–June 2026). The release preserves 251 published numbers, 1,291 explicit empty fields and 1,258 omitted trailing fields. It includes 32 total/parent-category summaries, two period summaries and four separately labelled constructed median/tail examples. No Canadian cohort, individual review durations, removal-only median, success rate or customer results were observed.

The source methodology includes decisions not to act in its timing measure. Notice receipts, items, processing observations, appeals and successful removals must remain distinct. Receipt shares cannot establish the processed-case timing distribution or explain an overall median causally. Published parent receipt sums match each total; this does not establish that missing fields are zero or justify adding overlapping hierarchy levels.

Three original SVG/PNG figures show selected category medians, receipt composition, and constructed examples sharing a one-hour median. The teaching examples are not estimates of Google's actual tail. Google Business Profile guidance, the European Commission, NIST and a clearly identified 2026 preprint provide context. No claim of guaranteed ranking, citation uptake, removal or timing is made.

## Reproduce and audit

From the repository root:

```powershell
python blog/data/build-google-notice-timing.py
python blog/data/audit-google-notice-timing.py --fetch
python blog/data/plot-google-notice-timing.py
```

Compilation and independent auditing need only the Python standard library; graphs need Matplotlib. The auditor imports no builder code and checks every numeric/missing position against both the official CSV and companion XLSX, source/member fingerprints, arithmetic and release-file parity. Raw archives are stored under `.seo-private/google-notice-timing-2026-11-05/sources`; public data include their URLs, hashes and source row/column locations.

Public downloads include four CSVs, four CSVW definitions, the complete JSON release, reproduction/audit/plot scripts, BibTeX and Citation File Format. The compilation and original figures are CC BY 4.0; underlying source material retains its publishers' rights.

## Publication integration

The article uses the existing blog layout, navigation, assessment links and consent-based measurement bootstrap. The blog index features it. Its canonical, article/dataset/image metadata, RSS entry and sitemap image entries are generated through the existing builders. Article dates use November 5, 2026, the client date.

Register the source in `build-blog.cjs`; `set-live-domain.cjs`, `launch-check.cjs` and `site-check.cjs` include its URL. This notes file is excluded from Jekyll publication in `_config.yml`.

Build in an isolated repository copy and copy back only the new article, blog index, sitemap and feed. Existing homepage visuals, prices, forms, endpoint, tracking configuration and unrelated pages must remain untouched. Do not deploy automatically.
