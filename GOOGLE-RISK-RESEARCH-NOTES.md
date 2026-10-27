# ReviewRemoval risk-denominator research

Published October 27, 2026, version 1.0. Brand: ReviewRemoval only.
Article: `/blog/google-review-risk-score-denominator-study.html`.

## Original contribution

Eleven attributed rows (seven velocity bins, four risk-quintile contrasts) are kept
separate from four identification-bound models and two synthetic integer examples.
The source explicitly defines its correlation set as 5,804 profiles with more than
ten deleted reviews, and its percentage fields against each profile's deleted set.
The 26.04% relationship to the broader 22,292-profile study is a selected-scope
comparison, not unexplained missing data.

Our fixed-set derivation is `q*r <= p <= q*r + 1-q`. Four constructed 10,000-review
sets fix the deleted-set share at exactly 467/500 (93.4%). Two constructed
2,000-review examples have original five-star shares of 48.35% and 95.85% despite
the same deleted-set share, an exact 47.5 percentage-point difference. Source
profile-level percentage summaries are not treated as pooled review counts.

The observed numerical rows come from Localo's May 29, 2026 publication. A fresh
October 27 capture matches SHA-256
`3a4f5051be6e999f87168b151bb13b17e23162134cde4f08e5857f71f1b7a273`.
Raw source captures remain ignored under `.seo-private/risk-study/`. Public input
JSON contains the selected facts, definitions, URL and fingerprint. Google policy
and reporting documents plus Hernán et al.'s selection-bias paper are cited.

## Reproduce

```
python blog/data/build-google-risk-study.py
python blog/data/audit-google-risk-study.py
python blog/data/plot-google-risk-study.py
node build-blog.cjs
node build-google-guides.cjs
node apply-google-focus.cjs
node set-live-domain.cjs https://reviewremoval.ca
node seo-audit.cjs
node launch-check.cjs
```

The dataset builder needs only standard-library Python and the public source
input. Plotting requires Matplotlib. Four CSVs have CSVW definitions; combined JSON,
BibTeX, source inputs, audit/builder and plotting code are downloadable. Three SVGs
retain editable text and have 1200×780 PNG equivalents. Original compilation,
calculations and charts are CC BY 4.0; original publishers retain their rights.

## Interpretation and discovery

No individual review histories, causal effect, Canadian calibration, fraud labels,
service success rate or independently validated risk score were obtained. Bounds
are mathematical identification intervals, not confidence intervals. Synthetic
examples are not client results. The article discloses the commercial interest.

Blog feature, archive, homepage research card, RSS, sitemap/image entries,
BlogPosting/Dataset links, image metadata, citation tags and internal related
guides are updated for this publication. The previous denominator audit remains
available in the archive and related links. This notes file is excluded from the
published site; it is not an article or search landing page.
