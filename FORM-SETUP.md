# ReviewRemoval quote forms - verified standalone backend

Updated November 6, 2026. The owner reported all six real backend checks passing: missing token, invalid token and wrong action rejected; a fresh real token accepted; owner notification accepted; replay of the same token rejected. The setup check also reported matching headers and a valid secret probe.

## Active source configuration

ReviewRemoval now targets its separate tested Apps Script deployment:

```text
https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec
```

- `script.js` sends all eight existing assessment forms to that endpoint. The homepage's native `action` agrees.
- All eight form pages request `script.js?v=20261106-turnstile-endpoint`; the platform-page generator retains the same version.
- Existing widget: `0x4AAAAAAFy2ZmcJCPhgxNBL`. Each request includes `cf-turnstile-response`; the backend requires Siteverify success, action `quote_request` and an approved ReviewRemoval hostname before saving or emailing. No fallback to the shared endpoint.
- Existing field names, optional profile/review links, pricing, terms records, owner notifications and confirmed-success Google Ads conversion hook remain unchanged.
- ReviewsBoost keeps its original endpoint and deployment. Do not edit that project or its properties for this integration.

The website changes are local only. No website deployment, push or Apps Script deployment was performed by the agent. Until these frontend files are deliberately published, the live website may still use the old endpoint. Publish the updated runtime and all eight form HTML pages together, then verify the submission's Network request uses the separate URL above.

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
