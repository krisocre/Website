# ReviewRemoval quote forms - verified standalone backend

Updated November 6, 2026. The owner reported all six real backend checks passing: missing token, invalid token and wrong action rejected; a fresh real token accepted; owner notification accepted; replay of the same token rejected. The setup check also reported matching headers and a valid secret probe.

## Active source configuration

ReviewRemoval now targets its separate tested Apps Script deployment:

```text
https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec
```

- `script.js` sends all eight existing assessment forms to that endpoint. The homepage's native `action` agrees.
- All eight form pages request `script.js?v=20261106-input-validation`; the platform-page generator retains the same version.
- Existing widget: `0x4AAAAAAFy2ZmcJCPhgxNBL`. Each request includes `cf-turnstile-response`; the backend requires Siteverify success, action `quote_request` and an approved ReviewRemoval hostname before saving or emailing. No fallback to the shared endpoint.
- Existing field names, optional profile/review links, pricing, terms records, owner notifications and confirmed-success Google Ads conversion hook remain unchanged.
- ReviewsBoost keeps its original endpoint and deployment. Do not edit that project or its properties for this integration.

The Turnstile endpoint cutover was observed live on November 6 after an external website release. A stale Cloudflare script cache required a fresh asset version. The new input-validation release uses another fresh version; no website or Apps Script deployment was performed by the agent.

## Input restrictions - November 6, 2026

The browser and prepared Apps Script now use matching pure input rules. They reject personal names containing dollar signs (including common full-width variants), Web links, line breaks, no letters or excessive length; block `fldubai.com` and its subdomains as email/contact-email domains; and require an integer quantity from 1 to 50. Business names may contain dollar signs, accents and normal punctuation. Personal names support all Unicode letters, including single-character names. Profile and individual-review links stay non-required. Free-text evidence can quote casino spam, money and URLs.

Supplied profile URLs must be HTTP(S), at most 2048 characters and have no embedded credentials. The observed `google.com/share.google` redirect path is refused in the profile field; normal `share.google`, Maps, g.page, maps.app.goo.gl and other platform profile URLs remain usable. Large field limits prevent oversized input without restricting normal requests. These are targeted filters, not a guarantee against all spam.

**The server-side rules require a new Apps Script version.** In the existing separate ReviewRemoval project, replace Code.gs with the complete current [google-apps-script.gs](google-apps-script.gs), keep all existing properties, save, run `checkReviewRemovalSetup`, then choose **Deploy > Manage deployments > Edit > New version > Deploy** for the SAME deployment. Do not change the URL or the Turnstile secret. Publishing frontend files alone does not update Apps Script; client checks can be bypassed.

Rerun the existing owner-operated token test after the backend update. The additional input cases are tested locally without real emails or rows. No live validation-rejection probe was sent by the agent for this release. A rejected input returns `result: error`, `code: invalid_input` and a fixed field/message before Sheets/mail. The UI keeps answers available and permits correction without reporting a lead. Invalid requests also consume their submitted Turnstile token, so the existing reset/fresh-token flow remains required.

## Existing Script Properties

Keep these settings in the separate ReviewRemoval project; never place the secret in frontend code:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | ReviewRemoval destination spreadsheet ID, not the full URL. |
| `SHEET_NAME` | Exact receiving tab name. |
| `NOTIFICATION_EMAIL` | Existing ReviewRemoval owner-notification inbox. |
| `TURNSTILE_SECRET` | Private secret matching existing key `0x4AAAAAAFy2ZmcJCPhgxNBL`. |
| `TURNSTILE_HOSTNAMES` | `reviewremoval.ca`, optionally the allowed and served `www.reviewremoval.ca`. |

The complete [google-apps-script.gs](google-apps-script.gs) preserves the twelve-column sheet, field fallbacks, formula protection, notification template and JSON contract. `claimVerifiedTurnstileToken` atomically records a short-lived token hash to guard against duplicate processing. A saved request with failed mail still returns `result: success`, `notification_sent: false`; do not blindly retry an uncertain request.

## Validation and release follow-up

The owner-operated `.seo-private/turnstile-standalone-2026-11-03/test-new-endpoint.js` tests the separate backend without calling site form handlers or Ads conversions. The reported result is evidence of real-token acceptance/replay rejection and an accepted MailApp call, not independent confirmation of inbox delivery or a row count. Confirm exactly one row and one corresponding owner email for the latest test reference; those manual observations have not yet been supplied.

After website publication, verify the first normal request end to end and check Cloudflare's token-validation view for this existing widget. The Siteverify request is server-to-server from Apps Script and does not appear in the visitor's browser Network panel. A widget success alone does not verify the server. Preserve consent and count an Ads lead only after the existing explicit success response.

Local checks: `node turnstile-check.cjs`, `node homepage-check.cjs`, `node measurement-check.cjs`, `node gtm-check.cjs`, `node launch-check.cjs` and `node seo-audit.cjs`. These use mocked submissions/providers and do not create real leads or prove live attribution. See [TURNSTILE-SETUP.md](TURNSTILE-SETUP.md) for setup and historical validation details.
