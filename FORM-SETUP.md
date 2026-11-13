# ReviewRemoval quote forms - verified standalone backend

## November 8: concise emails and main sheet notes

This replaces the November 7 email-only instructions. The prepared backend
removes the generated `[Submission acknowledgement]` block from owner emails
and the main sheet's Reason column. Customer notes, traffic-source labels,
references and the thirteen-column layout remain. Before clearing the block
from a sheet cell, the backend archives it in a hidden `ReviewRemoval
Acknowledgements` tab in the same spreadsheet. This is an organisational
separation; spreadsheet editors can unhide the tab.

Use this site's complete `google-apps-script.gs` in the EXISTING separate
ReviewRemoval project, preserving its Script Properties and current /exec
URL. Save and deploy a New version of that same deployment. Do not change
the old shared project or the ReviewsBoost project. No new keys or main
sheet columns are needed. The website's short legal notice and hidden
submission fields remain unchanged; they do not populate the editable notes.

For existing rows, first run `previewAcknowledgementCleanup` and review its
counts; then run `cleanExistingAcknowledgements`, up to fifty matching rows
per run. Repeat until `remaining` is zero. Neither function submits a form
or sends emails. Existing delivered emails cannot be edited retroactively.
Detailed installation and checks: `.seo-private/sheet-ack-cleanup-2026-11-08/INSTALL.md`.
Nothing has been deployed or changed in the live sheet by the agent.

## November 12: ChatGPT Ads tracking link

Use this landing URL for the ChatGPT ad:

```text
https://reviewremoval.ca/?utm_source=chatgpt&utm_medium=cpc&utm_campaign=google_review_removal_canada
```

If Ads Manager asks for tracking/query parameters separately, leave the landing
URL as `https://reviewremoval.ca/` and enter these parameters once:

```text
utm_source=chatgpt&utm_medium=cpc&utm_campaign=google_review_removal_canada
```

The website classifies this as `paid_chatgpt` and includes
`[Traffic Source: Paid - ChatGPT Ads]` in the existing Reason. This compatible
label appears in email/notes even with the older handler. Like existing paid
attribution, it requires advertising consent and lasts at most thirty minutes
within the same tab. Without the required consent, the lead remains
`Direct / unknown`; this must not be called organic.

For the separate Traffic Source column and the top email line to say
`Paid - ChatGPT Ads` too, copy this folder's updated google-apps-script.gs into
Code.gs in the existing standalone ReviewRemoval project. Save and deploy a
**New version of the same deployment**, preserving the existing /exec URL and
Script Properties. Only one fixed source label was added to that backend.
Until updated, the older backend may say `Direct / unknown` in that dedicated
field while the Reason correctly identifies ChatGPT. Do not edit the shared
project or ReviewsBoost deployment. No deployment was performed by the agent.

Consented GA4 visits use source/medium `chatgpt / cpc`. The measurement privacy
guard now accepts only the exact three public UTM values above; other unknown
parameters, duplicate campaign keys or private query values remain blocked.
Changing this campaign's values requires updating its explicit allowlist in
measurement.js. The canonical link and SEO metadata remain unchanged.

Publish the updated website scripts and their versioned HTML references
together (`20261112-chatgpt-ads`); leave the cookie stylesheet unchanged.
UTMs track source in the website/analytics. They do not install an OpenAI Pixel
or send conversions to ChatGPT Ads Manager. Existing Google Ads conversion
IDs and confirmed-submission triggers are unchanged.

Source: [OpenAI's tracking overview](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics)
and [query-parameter guidance](https://help.openai.com/en/articles/20001214-measure-results).

## November 7: source label in existing notifications

Each new form submission now prefixes its existing Reason with a fixed label,
for example `[Traffic Source: Paid - Google Ads]` or
`[Traffic Source: Organic - Google]`. Existing Apps Script handlers already
save/email Reason, so this compatible label does not require a new project,
endpoint, Script Property, column or backend deployment. Publish the website
changes to activate it. The eight form pages and platform generator use
`script.js?v=20261107-source-email`. There is exactly one source prefix per
submission; user notes and legal records remain intact.

The existing consent-aware classifier and 30-minute per-tab carryover remain
unchanged. Missing consent or insufficient information gives
`[Traffic Source: Direct / unknown]`; do not treat that label as organic.
No raw click identifier, query or referring URL is included. Historical leads
cannot be classified retrospectively from records that never captured source.
The separate Traffic Source column/top email line described below is optional
and still requires that prepared backend release. The compatible Reason label
works with the current handler without that release.

## November 7: profile/review field accepts any text

The public profile/review field is now a non-required text input on all eight
assessment forms. It has no URL format, scheme, redirect or length validator.
Labels, design, pricing, field name and submission endpoint are unchanged.
Form pages and the platform generator now use `script.js?v=20261107-source-email`;
other content/blog pages retain their existing asset versions.

The local `script.js` and `google-apps-script.gs` rules agree. For the deployed
backend, replace ONLY the existing `leadInputErrors` function using
`.seo-private/profile-text-2026-11-07/AppsScript-validation-replacement.txt`,
then save and deploy a New version of the SAME standalone ReviewRemoval web
app. Keep its URL, Script Properties, Turnstile, notifications and sheet
columns unchanged. The identical replacement also works in ReviewsBoost's
separate project. Leave the old shared project untouched. Publish the website
files separately; the agent has not deployed either side.

Updated November 7, 2026. The owner previously reported all six real backend checks passing: missing token, invalid token and wrong action rejected; a fresh real token accepted; owner notification accepted; replay of the same token rejected. The setup check also reported matching headers and a valid secret probe. The traffic-source extension below is tested locally and requires a backend version update.

## Traffic source on new leads — November 7, 2026

New requests include one coarse `traffic_source` enum. The updated standalone backend saves a fixed label in **column M, Traffic Source**, and adds it near the top of the owner email. Existing columns A–L and form fields stay in the same order. No visible form question, new Script Property, analytics ID or endpoint is needed.

To activate the optional dedicated column/top email line:

1. In the existing ReviewRemoval destination tab, leave A1:L1 unchanged and enter **Traffic Source** in **M1**. If M is already used for another purpose, resolve that conflict before deploying; do not overwrite it.
2. In the existing **separate ReviewRemoval** Apps Script project, replace Code.gs with the complete current [google-apps-script.gs](google-apps-script.gs). Keep all existing Script Properties and the existing Turnstile secret.
3. Save and run `checkReviewRemovalSetup`. It now checks all 13 headers and the existing security configuration. This setup check does not submit a lead or send an email.
4. Choose **Deploy → Manage deployments → Edit → New version → Deploy** for the **same deployment**. Keep the existing `/exec` URL. Do not edit the ReviewsBoost deployment.
5. Publish the updated website files through the normal release process. Form pages use `script.js?v=20261107-source-email`; protected blog/content pages retain their existing source-capable asset versions. Publishing the website alone does not update Apps Script. An older backend ignores the separate enum but still saves/emails the compatible source note in Reason.

Labels include **Paid - Google Ads**, **Paid - Other campaign**, **Organic - Google**, **Organic - Bing**, **Organic - Other search**, **Referral / other** and **Direct / unknown**. Unknown or forged enum values become the fixed unknown label, without rejecting an otherwise valid lead.

Classification uses valid-format Google click indicators, known UTM medium/source values, or recognised search-referrer hostnames. A campaign tag takes precedence over a search referrer. Incomplete campaign tags remain unknown. Only an enum and expiry can enter session storage; no full URL, search term, referrer URL, click ID or free-form campaign value is stored or forwarded with the lead.

Paid attribution requires the existing advertising-measurement consent. Organic/referral attribution requires analytics consent. Declined/missing consent stays unknown. Only the current tab's most recent known entry source is carried across internal/direct navigation, for at most 30 minutes; a new external entry can replace it. Storage failures preserve current-page classification where permitted and never block the form. The source cache is cleared when the relevant consent is withdrawn or expires. No new cookies are introduced.

This is **browser-detected visit attribution**, not verified Google Ads billing data, GA4's attribution model or proof that an ad caused a sale. Untagged ads, stripped referrers, browser restrictions and missing consent can prevent or distort classification. Enable Google Ads auto-tagging and verify with the actual account before relying on paid reporting. Historical rows are not backfilled or guessed. An older frontend remains compatible and produces the unknown label with the new backend.

Local checks: `node lead-source-check.cjs`, `node turnstile-check.cjs` and the existing measurement tests. All form submissions and providers are mocked; no live Sheets rows, emails or Ads conversions are created.

## Active source configuration

ReviewRemoval now targets its separate tested Apps Script deployment:

```text
https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec
```

- `script.js` sends all eight existing assessment forms to that endpoint. The homepage's native `action` agrees.
- All form and content pages request `script.js?v=20261107-lead-source`; the page generators retain the same version.
- Existing widget: `0x4AAAAAAFy2ZmcJCPhgxNBL`. Each request includes `cf-turnstile-response`; the backend requires Siteverify success, action `quote_request` and an approved ReviewRemoval hostname before saving or emailing. No fallback to the shared endpoint.
- Existing field names, optional profile/review links, pricing, terms records, owner notifications and confirmed-success Google Ads conversion hook remain unchanged.
- ReviewsBoost keeps its original endpoint and deployment. Do not edit that project or its properties for this integration.

The Turnstile endpoint cutover was observed live on November 6 after an external website release. A stale Cloudflare script cache required a fresh asset version. The new input-validation release uses another fresh version; no website or Apps Script deployment was performed by the agent.

## Input restrictions - November 6, 2026

The browser and prepared Apps Script now use matching pure input rules. They reject personal names containing dollar signs (including common full-width variants), Web links, line breaks, no letters or excessive length; block `fldubai.com` and its subdomains as email/contact-email domains; and require an integer quantity from 1 to 50. Business names may contain dollar signs, accents and normal punctuation. Personal names support all Unicode letters, including single-character names. Profile and individual-review links stay non-required. Free-text evidence can quote casino spam, money and URLs.

The former profile URL restrictions are superseded by the free-text update
above. That field now accepts any text or link, including redirect links,
and remains non-required. Other name, email, quantity and evidence rules
remain unchanged. These targeted filters are not a guarantee against all spam.

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

The complete [google-apps-script.gs](google-apps-script.gs) preserves the original twelve sheet columns, field fallbacks, formula protection and JSON contract, and adds Traffic Source as column M and in the owner notification. `claimVerifiedTurnstileToken` atomically records a short-lived token hash to guard against duplicate processing. A saved request with failed mail still returns `result: success`, `notification_sent: false`; do not blindly retry an uncertain request.

## Validation and release follow-up

The owner-operated `.seo-private/turnstile-standalone-2026-11-03/test-new-endpoint.js` tests the separate backend without calling site form handlers or Ads conversions. The reported result is evidence of real-token acceptance/replay rejection and an accepted MailApp call, not independent confirmation of inbox delivery or a row count. Confirm exactly one row and one corresponding owner email for the latest test reference; those manual observations have not yet been supplied.

After website publication, verify the first normal request end to end and check Cloudflare's token-validation view for this existing widget. The Siteverify request is server-to-server from Apps Script and does not appear in the visitor's browser Network panel. A widget success alone does not verify the server. Preserve consent and count an Ads lead only after the existing explicit success response.

Local checks: `node turnstile-check.cjs`, `node homepage-check.cjs`, `node measurement-check.cjs`, `node gtm-check.cjs`, `node launch-check.cjs` and `node seo-audit.cjs`. These use mocked submissions/providers and do not create real leads or prove live attribution. See [TURNSTILE-SETUP.md](TURNSTILE-SETUP.md) for setup and historical validation details.
