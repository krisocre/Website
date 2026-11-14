# Google stored-text coverage study — 13 November 2026

Site: ReviewRemoval.ca only. Article: `blog/google-reviews-without-text-data-study.html`.
No deployment, commit or push is part of this change.

## Original contribution

New record-level reanalysis of UCSD's historical Google Local Data (2021), Alaska
10-core file. The work measures how requiring nonblank stored text changes rating
coverage, one-star shares and within-place means. It is not another annual
moderation-count article, a removal-success study or a Canadian prevalence survey.

Input: 521,515 records, 36,962,271 compressed bytes.
SHA-256: `c2dba3acd27e8d2d661fe4ee9a58bb8f392172af7261a0e42b072f5dfc86de31`.
Source: https://mcauleylab.ucsd.edu/public_datasets/gdrive/googlelocal/
File: https://mcauleylab.ucsd.edu/public_datasets/gdrive/googlelocal/review-Alaska_10.json.gz

Cleaning: 516,289 distinct user/place/time keys; 5,226 repeated-key occurrences.
Compare the full canonical JSON objects, retain one copy of identical objects,
and exclude all eight keys with conflicting versions. Primary analysis: 516,281
records and 6,019 places. Do not describe the input's rows as unique reviews.
Do not rerun the 10-core selection after cleaning.

Findings:

- 223,154 / 516,281 = 43.2234% lack nonblank stored text.
- All-record one-star share: 19,306 / 516,281 = 3.7394%.
- Text-bearing one-star share: 13,992 / 293,127 = 4.7734%.
- Difference: 1.0339 percentage points, 27.6491% relative change in share.
- Pooled means: 4.2842289373 and 4.2890078362.
- Within-place means under text filter: 2,971 higher, 267 equal, 2,781 lower.
- 2,047 no-text records have nonempty photo metadata; no images inspected.
- Raw-input sensitivity included in the JSON; not substituted for cleaned counts.

## Primary sources checked

- UCSD dataset description and download, accessed 13 November 2026.
- Li, Shang and McAuley, UCTopic, ACL 2022:
  https://aclanthology.org/2022.acl-long.426/
- Yan et al., Personalized Showcases, SIGIR 2023:
  https://arxiv.org/abs/2207.00422
- Google Maps contribution instructions:
  https://support.google.com/maps/answer/6230175?hl=en
- Google removal eligibility:
  https://support.google.com/business/answer/4596773?hl=en
- Google score denominator:
  https://support.google.com/business/answer/4801187?hl=en
- Google contribution policy:
  https://support.google.com/contributionpolicy/answer/7400114?hl=en

The two papers are cited as the dataset requests. Their authors did not publish
these new aggregate findings or endorse ReviewRemoval. Only 11 words are quoted
directly from Google's reporting guidance; no reviewer text is quoted.

## Limitations and rights

Selected, dense US histories up to September 2021, not representative/current
Canada data. Null text can reflect collection missingness; do not call every such
record a proven originally wordless review. No authenticity labels, live scores,
complete account histories, removal decisions or causal effects are available.
Archived place IDs are not verified active businesses. No reviewer names, IDs,
comments, photos or per-place records are published. Raw archive remains ignored
under `.seo-private/`. No licence for the original Google content is asserted.
Only our original aggregates/figures are offered for citation with attribution.

## Files and build

New article module: `blog/google-text-coverage-post.cjs`.
Generated article: `blog/google-reviews-without-text-data-study.html`.
Four aggregate CSVs, combined JSON, standard-library reproduction script, BibTeX
and a practical export checklist are under `blog/data/google-text-coverage-*`
and `blog/data/google-review-export-checklist.txt`.
Three charts each have desktop/mobile SVG and PNG variants; one social PNG.
Chart builder: `build-text-coverage-assets.py` (Matplotlib, static output only).

Existing files changed:

- `build-blog.cjs`: register article and make it featured in the journal.
- `blog/index.html`: featured article and collection list; keep previous posts.
- `set-live-domain.cjs`: new URL, social image dimensions, article/dataset/image
  relationships and sitemap image discovery for this article.
- `feed.xml`: add the new article, preserve existing feed items.
- `sitemap.xml`: add the new URL/images and update actual blog-index date.
- `launch-check.cjs`: include the article and current journal date in validation.
- `_config.yml`: exclude new internal build/check/research files from publication.

Build in an ignored staging copy and copy back only the new article, blog index,
feed and sitemap. This avoids rewriting protected old articles through older
generator templates. The regular full builder also knows the new module.
Do not run the full blog generator against the working site just to add this post.

## Verification

Run `node text-coverage-check.cjs`, `node seo-audit.cjs`, `node launch-check.cjs`.
The focused check validates aggregate arithmetic, all 16 CSV rows, schema links,
download targets, figures, internal links and discovery. Where a private baseline
is present, it also verifies protected source files byte-for-byte.
Browser and independent source-audit results are recorded in the private task
report after validation. Live customer leads must not be submitted for this task.

Research and accurate metadata can support discovery and citation. They cannot
guarantee that Google ranks the article first or that other sites cite it.

## Completed validation

All focused data checks, independent SQLite source audit, scoped build, 35-URL SEO
audit, repeated production-metadata build, Node/Python syntax checks and browser
checks passed. Article and journal tested at 375, 768 and 1440 px. The existing
homepage passed its five-width form/Turnstile regression with mocked traffic.
100 existing files are byte-identical, including all 16 prior article HTML files.
No live customer lead was submitted, and nothing was deployed.

## Complete changed/new file inventory

- `_config.yml` ? updated.
- `blog/index.html` ? updated.
- `build-blog.cjs` ? updated.
- `feed.xml` ? updated.
- `launch-check.cjs` ? updated.
- `set-live-domain.cjs` ? updated.
- `sitemap.xml` ? updated.
- `GOOGLE-TEXT-COVERAGE-RESEARCH-NOTES.md` ? new.
- `blog/assets/google-text-coverage-cover.png` ? new.
- `blog/assets/google-text-coverage-frames-mobile.png` ? new.
- `blog/assets/google-text-coverage-frames-mobile.svg` ? new.
- `blog/assets/google-text-coverage-frames.png` ? new.
- `blog/assets/google-text-coverage-frames.svg` ? new.
- `blog/assets/google-text-coverage-places-mobile.png` ? new.
- `blog/assets/google-text-coverage-places-mobile.svg` ? new.
- `blog/assets/google-text-coverage-places.png` ? new.
- `blog/assets/google-text-coverage-places.svg` ? new.
- `blog/assets/google-text-coverage-ratings-mobile.png` ? new.
- `blog/assets/google-text-coverage-ratings-mobile.svg` ? new.
- `blog/assets/google-text-coverage-ratings.png` ? new.
- `blog/assets/google-text-coverage-ratings.svg` ? new.
- `blog/data/google-review-export-checklist.txt` ? new.
- `blog/data/google-text-coverage-analysis.py` ? new.
- `blog/data/google-text-coverage-citation.bib` ? new.
- `blog/data/google-text-coverage-frames.csv` ? new.
- `blog/data/google-text-coverage-photos.csv` ? new.
- `blog/data/google-text-coverage-places.csv` ? new.
- `blog/data/google-text-coverage-ratings.csv` ? new.
- `blog/data/google-text-coverage-study.json` ? new.
- `blog/google-reviews-without-text-data-study.html` ? new.
- `blog/google-text-coverage-post.cjs` ? new.
- `build-text-coverage-assets.py` ? new.
- `text-coverage-check.cjs` ? new.
