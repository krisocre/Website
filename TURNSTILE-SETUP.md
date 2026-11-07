# ReviewRemoval: separate Apps Script project and Turnstile setup

Prepared November 3, 2026; current validation status updated November 6. The owner updated the separate ReviewRemoval project and reported all six real-token tests passing. The frontend cutover is now prepared locally; no website publication was performed by the agent.

## Subsequent input-validation release

The endpoint cutover described below was observed live after an external release. The current source also adds targeted spam/input validation before storage/mail and uses form runtime version `20261106-input-validation`. These NEW backend rules are prepared locally and require another New version deployment of the existing separate ReviewRemoval Apps Script project. Keep the tested endpoint and all Script Properties. See [FORM-SETUP.md](FORM-SETUP.md) for rules, deployment steps and remaining live verification. The six real-token results below describe the prior Turnstile release; they do not prove that the new input rules have been deployed.

## Current tested deployment and validation - November 6, 2026

ReviewRemoval-only deployment:

```text
https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec
```

| Owner-reported test | Result |
| --- | --- |
| Missing token | Rejected: `verification_failed` |
| Invalid token | Rejected: `verification_failed` |
| Wrong action | Rejected: `verification_failed` |
| Fresh real token | Accepted: `result: success` |
| Owner notification accepted | `notification_sent: true` |
| Replay of same token | Rejected: `verification_failed` |

- `checkReviewRemovalSetup` also passed configuration, sheet-header and secret-probe checks.
- All eight form pages retain site key `0x4AAAAAAFy2ZmcJCPhgxNBL`. The shared frontend endpoint and homepage native form action now target the separate deployment above in local source. Each form page and the platform generator use script version `20261106-turnstile-endpoint-2` to avoid retaining the previous form runtime in cache.
- The owner has not yet supplied an independently checked row count or inbox-delivery confirmation. Confirm exactly one new labelled row and one corresponding owner email for this run. `notification_sent: true` means the MailApp call was accepted, not proof of inbox arrival.
- No real form submission or Google Ads conversion was sent by the agent during the cutover. Local test sends and provider responses are mocked. No website deployment, commit, push or Apps Script deployment was performed by the agent; the live frontend remains unchanged until these files are deliberately released.

### Frontend cache follow-up

The first release updated the homepage and unversioned origin script, but Cloudflare still served the old endpoint from the first versioned script URL (`CF-Cache-Status: HIT`, `max-age=14400`). The form pages and generator now use version `20261106-turnstile-endpoint-2` to avoid that stale response. Publish those references together and verify the exact versioned asset, not just the homepage action. No sitewide cache policy was changed.

### Historical replay failure and fix

The November 4 test accepted a fresh token but also accepted replay; the owner supplied two rows with identical reference `TURNSTILE TEST 2026-11-04T18:27:08.024Z`. That failure is why the website initially stayed on its shared endpoint. The prepared handler adds a durable SHA-256 token claim under a script lock after Siteverify and before Sheets/mail. The November 6 owner-reported real-token test now rejects replay. No raw token is persisted and no extra manually configured property is required.

## Existing widget and protected request

Use existing site key **`0x4AAAAAAFy2ZmcJCPhgxNBL`**. The frontend submits `cf-turnstile-response`; the handler requires Siteverify `success === true`, action **`quote_request`**, and the exact configured ReviewRemoval hostname before accessing the spreadsheet or sending mail. No submitted brand/plan/page value can bypass verification. Preserve the existing widget mode and clearance setting.

ReviewsBoost retains its original shared endpoint below. ReviewRemoval source now uses the separate tested deployment above:

```text
https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec
```

**Do not update that deployment, its project, its properties or the ReviewsBoost repository.** The separate ReviewRemoval project already exists and has independent properties. The setup procedure below is retained for maintenance; do not create another project or widget for the completed owner test. A backend test does not publish the frontend changes.

## 1. Select the spreadsheet and tab

Use the existing ReviewRemoval destination to retain where leads are saved, or create a separate private spreadsheet named **ReviewRemoval Requests**, with a tab named **Leads**. Do not rename, clear or overwrite a ReviewsBoost tab. The Google account deploying the new project needs edit access to this spreadsheet.

Copy the spreadsheet ID from its URL, between `/spreadsheets/d/` and `/edit`. This is not the full URL, Script ID, deployment ID or `gid` tab number. Note the exact receiving tab name.

For a new sheet, paste this tab-separated header row into A1. For an existing destination, check the headers without overwriting lead records:

```text
Timestamp	Selected Plan	Full Name	Business Name	Email	Phone	Preferred Contact	Contact Detail	Profile URL	Review Count	Review Links	Reason
```

## 2. Create the separate Apps Script project

1. Open [Google Apps Script](https://script.google.com/) using the same Google account that currently sends the ReviewRemoval owner notifications, to retain the sender identity.
2. Click **New project**. Name it **ReviewRemoval Forms — Turnstile**. Do not open the shared project's deployment settings.
3. Open the default `Code.gs`, remove the sample `myFunction`, and paste **the entire contents of [google-apps-script.gs](google-apps-script.gs)**. It includes `doPost`, `verifyTurnstile` and `checkReviewRemovalSetup`.
4. Save. No extra library, trigger, Worker or proxy is required.

The handler uses `SpreadsheetApp.openById(...).getSheetByName(...)` for the standalone project. It retains the existing twelve-column order, field fallbacks, formula protection, owner-notification template and JSON success contract. A verified token must also be claimed once under a script lock before lead processing. No customer autoresponder or new analytics route was added.

## 3. Add exactly these Script Properties

In the **new project**: **Project Settings** (gear) → **Script Properties** → **Add script property**. For subsequent additions Google may show **Edit script properties** first. Add all five entries, then click **Save script properties**.

| Exact property name | Value |
| --- | --- |
| `SPREADSHEET_ID` | ReviewRemoval destination spreadsheet ID from step 1. |
| `SHEET_NAME` | Exact receiving tab name; `Leads` if you used the suggested new tab. |
| `NOTIFICATION_EMAIL` | The same inbox that should receive the existing ReviewRemoval owner notifications. Do not guess a new address. |
| `TURNSTILE_SECRET` | The private secret matching site key `0x4AAAAAAFy2ZmcJCPhgxNBL`, copied directly from that existing Cloudflare widget. |
| `TURNSTILE_HOSTNAMES` | `reviewremoval.ca`. Use `reviewremoval.ca,www.reviewremoval.ca` only if the www hostname actually serves the widget and is also allowed by Cloudflare. |

Do not add quotes, URL schemes, paths, wildcards or localhost to the hostname value. Action `quote_request` is fixed in the code; no `TURNSTILE_ACTION` property is needed. The public key is in the website markup; no `TURNSTILE_SITEKEY` server property is needed.

Store the matching secret directly in the new project's Script Properties. Never paste it into chat, frontend code, Git, screenshots, the browser console or a URL. Properties are scoped to their project; the shared project's values are not copied automatically. Check the widget's allowed hostnames without creating a replacement widget.

The [Turnstile Spin existing-widget flow](https://developers.cloudflare.com/turnstile/spin/prompt.md) was fetched. Its manual-storage instruction is to “ask the user to store it through their platform's normal secret-management flow.” No supported secret-manager CLI for this Apps Script destination was available, so no secret-bearing getter/write was attempted. The platform-native procedure above needs neither a Cloudflare API token nor another widget.

## 4. Check configuration before any deployment

In the new editor's function dropdown select **checkReviewRemovalSetup**, then **Run**. Authorize this new project under the deploying account when Google asks for spreadsheet, notification-mail and external-request permissions.

The function reads properties and headers and sends a dummy response to Siteverify to probe the production secret. It writes no lead, sends no email and logs no token/secret. Expected execution-log summary:

```json
{"configuration":"passed","spreadsheet_headers":"matched","secret_probe":"passed","real_token_validation":"pending","email_delivery":"not tested"}
```

Fix any missing setting, inaccessible sheet, mismatched header or secret/network error first. This probe cannot prove the secret matches the frontend key; a real token does. Do not click Run on `doPost`, which expects an HTTP POST event.

If the tab name appears identical but the check says it was not found, run `diagnoseReviewRemovalSheet` from the editor. Its log identifies the spreadsheet actually opened and prints the configured/available tab names in quotes to expose extra spaces. Open the logged spreadsheet URL to confirm `SPREADSHEET_ID` selects the intended file. This diagnostic reads no lead rows or Turnstile secret, writes nothing and sends no email.

If your restriction includes isolated test deployments, stop here. A deployed URL cannot be tested before it exists. No deployment or cutover has been performed by the agent.

## 5. When permitted, create an isolated candidate endpoint

These manual steps apply only to the **new** project; neither website changes:

1. **Deploy → New deployment → Select type → Web app**.
2. Description: **ReviewRemoval — isolated verification candidate**.
3. **Execute as:** **Me**, the account with spreadsheet and mail permissions.
4. **Who has access:** **Anyone**, so the existing credential-free form transport can be tested. This does not make the spreadsheet public. If Workspace policy prevents anonymous access, resolve that restriction rather than requiring customers to sign in.
5. Only when you permit this test deployment, create it and copy its **Web app URL ending in `/exec`**. Confirm that it differs from the shared URL above. Keep the tested version pinned.

Do not install it in either website yet. Google's **Deploy → Test deployments** creates an editor-only `/dev` URL that runs the latest saved code; it does not validate anonymous public form access. Opening this POST-only `/exec` endpoint directly may show `doGet` not found. That GET result is not a submission test.

## 6. Test the candidate without a site release

The owner-operated utility is the local file **`.seo-private/turnstile-standalone-2026-11-03/test-new-endpoint.js`**. It is ignored by Git and not published.

1. Open **https://reviewremoval.ca/** in a real browser. Open DevTools → Console, review the local utility, then paste its contents. Chrome may require enabling pasting; do that only for code you have reviewed. Do not add localhost to the production widget or weaken hostname validation.
2. At the prompt enter only the new candidate `/exec` URL. The utility refuses the shared endpoint and `/dev` URLs. Never enter a secret.
3. Complete the security checks in the temporary test panel. The utility checks missing and invalid tokens, then a valid token with the wrong action; all must return `result: error` and `code: verification_failed`.
4. It sends **one real, clearly labelled TURNSTILE TEST enquiry** with a fresh `quote_request` token, then replays the same token. The first must return `result: success` and `notification_sent: true`; the replay must be rejected. It does not call the site's form handler or conversion hook.
5. Manually confirm exactly **one new test row and one corresponding owner email** in the selected destination/inbox. Check column order. An accepted MailApp call is not proof of inbox delivery.
6. If any request is unconfirmed, check the test label in the sheet before rerunning. Do not use `no-cors` or automatically retry: a row may already have been saved. An HTTP 200 alone is not application success; the browser must read the JSON after Google's ContentService redirect.

Tokens remain only in the utility's temporary closure, are never printed, and the panel/widget is removed afterward. Existing form actions, form values and Ads tracking remain untouched. Missing/invalid/wrong-action/replay requests must add no rows and send no emails. Local mocked tests have not performed this real deployment check.

## 7. Prepared frontend cutover and deliberate release

The owner-reported real-token checks passed. Local source now contains the cutover in both required places:

- `script.js`: the endpoint used by all eight assessment forms.
- `index.html`: the homepage native form action.

All eight form pages request the refreshed `script.js?v=20261106-turnstile-endpoint-2`, and `build-platform-pages.cjs` retains that version. The seven platform forms continue to require JavaScript for the security check and use the same handler. There is no automatic fallback to the old shared endpoint.

Release the changed runtime and form HTML together when publishing the website. After release, verify a normal form request targets the separate tested URL. Confirm the saved row and owner email without repeatedly submitting an uncertain request. Siteverify runs inside Apps Script, so inspect Apps Script executions or Cloudflare validation analytics rather than expecting a browser-side Siteverify request.

All existing input names, optional profile/review links, notification behavior, terms records and the confirmed-success measurement hook are preserved. Ads destination **AW-18449308865/HqdzCIv5z4gdEMG5qN1E**, nominal CAD $1 lead value and consent behavior are unchanged. The owner-operated backend test does not call the website's form handler or conversion hook.

ReviewsBoost keeps its original endpoint and deployment. No website publication or account/backend deployment was performed by the agent.

## Local files and verification

Current cutover changes: `script.js`, eight form HTML pages, `build-platform-pages.cjs`, `turnstile-check.cjs`, `FORM-SETUP.md` and this guide. The test now checks the exact protected destination, matching native action, all eight form script versions and rejection/retry/success routing. The already prepared Apps Script, existing site key, styling, blog content and measurement source files are unchanged in this cutover.

Run `node turnstile-check.cjs`, `node homepage-check.cjs`, `node measurement-check.cjs`, `node launch-check.cjs`, `node seo-audit.cjs`. These use mocked submissions/provider responses and cannot independently establish production secret storage or inbox delivery. The real-token result above was supplied by the owner; publication of the frontend and the normal live form flow are still separate checks.

References: [Cloudflare server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [Script Properties](https://developers.google.com/apps-script/guides/properties), [openById](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openById(String)), [ContentService redirects](https://developers.google.com/apps-script/guides/content#redirects).
