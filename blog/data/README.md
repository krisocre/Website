# ReviewRemoval research tables

These CSV files support five research articles published September 21–27, 2026. ReviewRemoval transcribed the cited figures and calculated the differences described in the articles. We did not collect review-level records or independently verify the original survey or platform counts.

## `google-review-moderation-2019-2025.csv`

- `year`: Calendar year described by Google's update.
- `reported_millions`: The numeric part of Google's published rounded figure, in millions. It is **not** an exact total.
- `qualifier`: Whether Google said “more than,” “over,” or gave a rounded figure.
- `metric`: Google's description of the action. Its 2019 update says “removed”; 2020–2025 say “blocked or removed.”
- `source_url`: The Google update supporting that row.

The chart plots `reported_millions`. It does not calculate growth rates because most entries are lower bounds and the 2019 wording differs.

## `trustpilot-fake-reviews-by-star-2024.csv`

- `star_rating`: Review star rating.
- `reported_removed_count`: Trustpilot's rounded number of detected fake reviews removed in 2024 for that star rating.
- `unit`: All values are approximate/rounded.
- `source_url`: Trustpilot's Trust Report 2025.

The five entries sum to 4,483,000. Trustpilot's separate rounded headline total is 4.5 million. The article's approximate shares divide each row by 4,483,000; the approximate five-star/one-star ratio is 3,400,000 ÷ 627,000 ≈ 5.4. These are calculations from reported figures, not new platform statistics.

## `canadian-sme-online-activities-2023.csv`

- `online_activity`: ISED Table 13 activity label.
- `tourism_sme_percent`: Published value for Canadian tourism SMEs.
- `all_industries_sme_percent`: Published value for SMEs across all industries.
- `tourism_minus_all_percentage_points`: Our subtraction of the two published percentages, in percentage points.
- `source_url`: The ISED report containing Table 13, based on Statistics Canada's 2023 Survey on Financing and Growth of Small and Medium Enterprises.

The Google Reviews row is 63.8% versus 47.0%, a difference of 16.8 percentage points. These figures describe reported online activity, not review volume, fake-review incidence or removal outcomes. The all-industry group includes tourism SMEs. The survey excludes some business types, including non-employers; read the [report definitions](https://www.ised-isde.canada.ca/site/ised/en/canadian-tourism-sector/sme-profile-2023-tourism-industries-canada) before reusing the values.

Please credit ReviewRemoval for the compilations and visualizations, and cite the linked Google, Trustpilot or ISED source for each underlying figure.

## Yelp transition and cohort tables

`yelp-reclassification-2012-2020.csv` transcribes Table II from Amos, Maio, Mittal and Calandrino, *Reviews in Motion* (2022). The four counts total 66,922 reviews present at both endpoints. The `start_state_total` and `conditional_percent_calculated` columns are our calculations. They do not estimate deletion or reinstatement rates.

`yelp-longitudinal-cohorts.csv` transcribes Table I. `review_observations` includes repeated observations of a review; `unique_reviews` is a different measure. `reclassified_percent_reported` is cumulative over the stated observation window. US sample designs and unequal time windows prevent a direct Canadian or annual interpretation.

## Tripadvisor compilation

`tripadvisor-review-fraud-2018-2024.csv` aligns selected disclosures by activity year. The first three percentages are published source figures. The 2024 percentage is calculated from rounded counts of 2.7 million and 31.1 million and is explicitly marked as such. `detected_fraud_prepublication_percent` uses detected fraud as its denominator. A blank field means the selected source does not state the value, not that it is zero.

`tripadvisor-screening-2024.csv` contains three initial automated outcome percentages and a separate human-moderation measure. The first three sum to 100%; the human figure covers before or after posting and must not be added to them.

`tripadvisor-source-differences.csv` preserves two source comparisons. The original 2019 report gives 2.1% for 2018; the 2023 full report later gives 2.4% for 2018. The cited passages do not explain the 0.30-point disagreement. The 2022 press release gives 4.4%, versus 4.37% in the full report, consistent with rounding to one decimal. The main compilation retains its explicitly selected original-source values and is not a reconciled series.

The source URLs in each row identify the underlying company publication. These counts do not measure undetected fraud, client success or Canadian city rates.

## Tracking template and reproduction

`review-status-tracking-template.csv` is a blank operational template, not a dataset. No customer or reviewer records are included.

Run `node build-research-assets.cjs` from the repository root to regenerate the six new CSVs and three SVG charts from `blog/research-data.cjs`. The article explanations, precision and qualifiers should be updated together with any source-value change. Credit the named researchers or Tripadvisor for the source data, and ReviewRemoval for the new calculations and visualizations.

## Trustpilot internal complaints, February 17–December 31, 2025

`trustpilot-appeals-2025.json` preserves the report scope, original indicator labels, extracted count columns, separate omitted/restriction metrics, source filename and SHA-256 of the downloaded appeals CSV. `trustpilot-appeals-2025.csv` adds per-row reversal shares and a clearly marked derived residual. The overall row is a summary, not additive with its reason rows. Source ZIP was linked from Trustpilot's legal page on 2026-10-06 and published 2026-02-28.

Run `node audit-trustpilot-appeals.cjs` to reconcile all counts. Run `python plot-trustpilot-appeals.py` with Matplotlib installed to reproduce the figure. Eight rows include the overall total, six reported reason categories and one derived residual. Empty percentages have zero denominators. The 473 omitted decisions are deliberately outside the outcome partition.

Original compilation, calculations and figures: CC BY 4.0 with attribution to ReviewRemoval and the article URL. Source material retains its own rights. This is an EU-related reporting subset, not a Canadian removal success rate. See the article for period, scope, denominator and comparability limitations.
