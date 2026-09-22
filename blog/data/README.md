# ReviewRemoval research tables

These CSV files support the two research articles published September 21, 2026. They transcribe rounded figures from the linked platform publications. ReviewRemoval compiled the Google annual series and calculated the Trustpilot shares and ratios in the articles. We did not collect review-level records or independently verify platform internal counts.

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

Please credit ReviewRemoval for the compilation/visualization and cite the original Google or Trustpilot page for each underlying figure.
