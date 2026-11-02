# Google Maps appeals direction audit

Published locally November 2, 2026. ReviewRemoval only. No push or deployment.

Article: `blog/google-review-removal-appeals-data.html`. Source module:
`blog/google-maps-appeals-post.cjs`. Featured in the blog; a contextual homepage
research link, RSS item, article canonical and three sitemap image entries are included.

This is an original secondary compilation and descriptive analysis of two Google
Maps DSA releases published February 27 and August 28, 2026. Activity periods:
July–December 2025 and January–June 2026. The source-input JSON records the actual
URLs, archive/member SHA-256 fingerprints and original row locations.

The release preserves 74 source indicator cells: 36 numbers and 38 blanks.
It calculates eight category summaries and two category contrasts. Source blanks
remain null, not zero. The overall row overlaps its categories. The outcome
denominator is upheld plus fully reversed decisions, not receipts. Receipt counts
and outcome counts need not describe the same cohort. Reported median units were
verified as hours in both qualitative CSVs. The independent audit checks all 74
cells against both CSV and XLSX data without importing the builder.

H1 2026 descriptive shares: overall 56.033047617%; Article 16 non-action
4.469193974%. These are different complaint categories, not Canadian removal
probabilities. The activity covers Maps content and service decisions, not
reviews alone, unique businesses or ReviewRemoval client cases. No causal,
representative-sample, significance, independent peer-review, service-outcome or
ranking claim is made. Both official releases, EC context, three current Google
help pages and the Trujillo/Tessa/Cresci 2026 preprint are cited with their scope.

## Reproduction

From `blog/data`:

```
python build-google-maps-appeals.py
python audit-google-maps-appeals.py
python audit-google-maps-appeals.py --fetch
python plot-google-maps-appeals.py
```

Data generation/auditing use the Python standard library. Plotting uses
Matplotlib locally; no frontend dependency was added. Optional `--source-dir`
accepts a folder containing `2025H2.zip` and `2026H1.zip`. Downloads are read in
memory, not extracted to arbitrary filesystem paths. Raw archives are retained
privately for verification and linked publicly, not republished.

From the repository root, the existing production pipeline remains:

```
node build-blog.cjs
node apply-google-focus.cjs
node set-live-domain.cjs https://reviewremoval.ca
```

The implementation was generated twice in an isolated copy, checked for identical
output, and only the intentional article/discovery artifacts were copied back.
The homepage receives only a link inside its existing research row. Existing
metadata, form markup, pricing, analytics settings, the restored platform banner
and other article pages are preserved.

The isolated build revealed duplicate `aria-describedby` attributes when the legal
builder appended an ID to the homepage button's existing descriptions. The builder
now merges unique IDs, preserving both the legal and form-help references. The
launch check covers this regression; legal wording and submission integrations did
not change.

## Verification

- Independent numeric, null-preservation, CSV/CSVW and archive/CSV/XLSX audit.
- Repeated isolated blog/focus/metadata build and site-wide SEO audit.
- Existing homepage, launch, site and consent/conversion checks, with traffic mocked.
- Additional article/blog visual checks, heading/metadata/schema checks, graph
  decoding and no-JavaScript access.
- No real form POST, email, analytics collection, commit, push or deployment.

Full task-start hashes, private source captures, build logs, preview screenshots
and the final per-file change report are under the ignored
`.seo-private/google-maps-appeals-2026-11-02/` directory. The original compilation
and figures are CC BY 4.0; source publishers retain their underlying rights.
