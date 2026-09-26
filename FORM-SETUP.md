# ReviewRemoval quote form

The homepage and the Facebook, Yelp, Trustpilot, Tripadvisor, Booking.com, Glassdoor, and Indeed service pages post URL-encoded form data to the supplied Google Apps Script deployment. They send `selected_plan`, `full_name`, `business_name`, `email_address`, `business_url`, `review_count`, `review_links`, `reason`, `contact_method`, and `contact_detail`. The `selected_plan` value identifies the platform, quantity, and price.

The live integration test on 2026-09-21 reached the deployment and received `Failed to send email: no recipient`. In the supplied handler, `sheet.appendRow(...)` runs before `MailApp.sendEmail(...)`, so the clearly labelled TEST row should be in the spreadsheet, but the owner notification was not sent.

To restore owner notifications:

1. In the Apps Script project bound to the receiving spreadsheet, replace the current `doPost` with [google-apps-script.gs](google-apps-script.gs).
2. Set the script property `NOTIFICATION_EMAIL` to the inbox that should receive new requests. The updated code also falls back to `Session.getEffectiveUser().getEmail()` when the web app executes as its owner.
3. Update the **existing** web app deployment to a new version so the current `/exec` URL remains valid. Ensure it executes as the script owner and accepts public form submissions.
4. Confirm the sheet header order shown at the top of `google-apps-script.gs` and submit one test request after redeployment.

The same deployment URL is also used by the reference ReviewsBoost site, so updating this deployment changes its form handler too. The replacement handler keeps the field names and column order used there.
