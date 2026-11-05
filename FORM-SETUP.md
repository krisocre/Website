# ReviewRemoval quote forms — isolated backend setup

The homepage and Facebook, Yelp, Trustpilot, Tripadvisor, Booking.com, Glassdoor and Indeed forms use `script.js` to send the existing selected plan, name, business, email, profile URL, quantity, review links, reason, contact preference and legal acknowledgement. Turnstile adds `cf-turnstile-response`.

**Do not update the current shared Apps Script deployment.** ReviewsBoost still uses it. Paste the complete [google-apps-script.gs](google-apps-script.gs) into a **new standalone ReviewRemoval project**. Follow [TURNSTILE-SETUP.md](TURNSTILE-SETUP.md) for the exact procedure, including the deployment/testing order.

November 4 status: the owner created the separate candidate recorded in `TURNSTILE-SETUP.md` and its setup check passed. The browser accepted a fresh token but replaying it created a duplicate row. The local handler now claims a hash of each verified token atomically under a script lock before saving or emailing. Apply the full updated `google-apps-script.gs` to the separate project's Code.gs, save, and update that candidate through Manage deployments → Edit → New version → Deploy. Keep the five existing settings; runtime replay markers are automatic. Rerun the updated private test utility and require all checks, exactly one new row and one notification for that run. The website remains on the original URL until the candidate passes.

Set these Script Properties in the new project:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | ReviewRemoval destination spreadsheet ID, not the full URL. |
| `SHEET_NAME` | Exact receiving tab name. |
| `NOTIFICATION_EMAIL` | Existing ReviewRemoval owner-notification inbox. |
| `TURNSTILE_SECRET` | Private secret matching existing key `0x4AAAAAAFy2ZmcJCPhgxNBL`. |
| `TURNSTILE_HOSTNAMES` | `reviewremoval.ca`, optionally the allowed and served `www.reviewremoval.ca`. |

Run `checkReviewRemovalSetup` in the new editor first. It only reads configuration/headers and probes the configured secret; it writes no row or email. When you permit an isolated test deployment, use the private browser utility described in the guide to test fresh, invalid, wrong-action and replayed tokens, exactly one saved row and the normal owner notification. No live form changes are needed to test that candidate.

The handler resolves its spreadsheet with `openById` and the configured tab, then retains the original twelve columns, field fallbacks, formula protection, owner-email template and success JSON. A saved request whose email fails still returns success with `notification_sent: false`, as before; check the sheet before retrying an uncertain request.

The existing submission URLs remain untouched. After the candidate passes and the website change is approved, update ReviewRemoval's `const endpoint` in `script.js` and the native homepage `action` in `index.html` together. The seven platform forms use the shared JS handler. Keep the Google Ads configuration, consent behavior and confirmed-success hook unchanged. No ReviewsBoost code or endpoint needs editing.

Local files do not configure private properties, create/deploy an Apps Script project, verify live delivery or publish a website. Automated requests are mocked.
