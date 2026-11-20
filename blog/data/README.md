# ReviewRemoval research tables

These CSV files support five research articles published September 21–27, 2026. ReviewRemoval transcribed the cited figures and calculated the differences described in the articles. We did not collect review-level records or independently verify the original survey or platform counts.

## `google-review-moderation-2019-2025.csv`

- `year`: Calendar year described by Google's update.
- `reported_millions`: The numeric part of Google's published rounded figure, in millions. It is **not** an exact total.
- `qualifier`: Whether Google said “more than,” “over,” or gave a rounded figure.
- `metric`: Google's description of the action. Its 2019 update says “removed”; 2020–2025 say “blocked or removed.”
- `source_url`: The Google update supporting that row.

The chart plots `reported_millions`. It does not calculate growth rates because most entries are lower bounds and the 2019 wording differs.


- `star_rating`: Review star rating.
- `unit`: All values are approximate/rounded.


## `canadian-sme-online-activities-2023.csv`

- `online_activity`: ISED Table 13 activity label.
- `tourism_sme_percent`: Published value for Canadian tourism SMEs.
- `all_industries_sme_percent`: Published value for SMEs across all industries.
- `tourism_minus_all_percentage_points`: Our subtraction of the two published percentages, in percentage points.
- `source_url`: The ISED report containing Table 13, based on Statistics Canada's 2023 Survey on Financing and Growth of Small and Medium Enterprises.

The Google Reviews row is 63.8% versus 47.0%, a difference of 16.8 percentage points. These figures describe reported online activity, not review volume, fake-review incidence or removal outcomes. The all-industry group includes tourism SMEs. The survey excludes some business types, including non-employers; read the [report definitions](https://www.ised-isde.canada.ca/site/ised/en/canadian-tourism-sector/sme-profile-2023-tourism-industries-canada) before reusing the values.









The source URLs in each row identify the underlying company publication. These counts do not measure undetected fraud, client success or Canadian city rates.

## Tracking template and reproduction






Original compilation, calculations and figures: CC BY 4.0 with attribution to ReviewRemoval and the article URL. Source material retains its own rights. This is an EU-related reporting subset, not a Canadian removal success rate. See the article for period, scope, denominator and comparability limitations.

## Google rating-removal sensitivity, October 8, 2026

`rating-removal-sensitivity-2026.csv` contains all 1,625 inputs: 13 starting review counts × 25 displayed ratings (2.5–4.9) × five one-star removal counts. Of these, 1,468 are feasible and 157 cannot coexist. Among feasible rows, 492 have a higher model display for every attainable star total and 976 for only some totals. These are counts in a chosen mathematical grid, not business frequencies or success probabilities.

`rating-removal-sensitivity-2026.json` includes the grid, assumptions, source notes, version and the same row data. The model uses equally weighted integer ratings, fixed remaining reviews, and assumed nearest-tenth, half-up rounding. Google confirms an average score but does not confirm the rounding tie convention in the cited guidance. The existence of the removed one-star reviews is imposed as a feasibility constraint. Null fields mean no attainable outcome, not zero.

Rebuild with `node blog/data/build-rating-study.cjs`, check independently with `node blog/data/audit-rating-study.cjs`, and reproduce the three figures with `python blog/data/plot-rating-study.py`. The audit enumerates actual five-category star histograms for counts 2–9 and checks 7,380 analytical bound combinations, then verifies all exported rows. The public browser calculator uses the same `rating-model.js` module and supports removal ratings 1–5.

The source code, generated data and figures are original mathematical analysis under CC BY 4.0. Cite ReviewRemoval, version 1.0, October 8, 2026, and https://reviewremoval.ca/blog/google-review-removal-rating-impact-study.html. There are no sampled businesses, personal data, measured Canadian city rates or client outcomes in these files.
