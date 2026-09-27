# ReviewRemoval research tables

These CSV files support three research articles: two platform-data studies published September 21, 2026, and a Canadian SME analysis published September 26, 2026. ReviewRemoval transcribed the cited figures and calculated the differences described in the articles. We did not collect review-level records or independently verify the original survey or platform counts.

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
