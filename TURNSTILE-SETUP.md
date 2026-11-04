# ReviewRemoval: separate Apps Script project and Turnstile setup

Prepared November 3, 2026. Code and local tests are prepared; no project, widget, deployment or live endpoint has been created or changed. Real-token validation and the website cutover remain pending.

## Existing widget and protected request

Use existing site key **`0x4AAAAAAFy2ZmcJCPhgxNBL`**. The frontend submits `cf-turnstile-response`; the handler requires Siteverify `success === true`, action **`quote_request`**, and the exact configured ReviewRemoval hostname before accessing the spreadsheet or sending mail. No submitted brand/plan/page value can bypass verification. Preserve the existing widget mode and clearance setting.

The current ReviewRemoval and ReviewsBoost source uses this shared endpoint:

```text
https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec
```

**Do not update that deployment, its project, its properties or the ReviewsBoost repository.** Use a new standalone ReviewRemoval project with independent properties. A real endpoint can only be tested after an isolated candidate deployment exists. If no deployment at all is permitted yet, stop after the editor configuration check: full HTTP/token/replay validation remains pending. No website release is needed to test a separate candidate.

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

The handler now uses `SpreadsheetApp.openById(...).getSheetByName(...)` for the standalone project. It retains the existing twelve-column order, field fallbacks, formula protection, owner-notification template and JSON success contract. No customer autoresponder or new analytics route was added.

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

## 7. Cut over only after testing and a deliberate release

Provide the **new public `/exec` URL** and the test results; no secret needs to be shared. Current active code has the old endpoint literal in two places:

- `script.js`: `const endpoint`, shared by all eight assessment forms.
- `index.html`: the homepage form's native `action`.

Update those together only after successful candidate validation, refreshing the script cache version. The seven platform forms already require JavaScript and use that shared frontend handler; their current HTML has no separate action URL. `build-platform-pages.cjs` already has the new key/markup and contains no endpoint literal. Never fall back to the old endpoint on verification failure.

Keep all existing input names, email templates/recipient, terms records and the confirmed-success measurement hook. Preserve Ads destination **AW-18449308865/HqdzCIv5z4gdEMG5qN1E**, its nominal CAD $1 lead value and consent behavior. The browser-console backend test intentionally sends no Ads conversion. A later controlled site-form check verifies the full flow and tracking after the approved release.

ReviewsBoost keeps its existing code, endpoint and deployment throughout. Local test success does not authorize a deployment or endpoint switch; no live cutover has been performed.

## Local files and verification

Changed: `google-apps-script.gs` for explicit destination/diagnostic; eight form HTML pages plus `build-platform-pages.cjs` for the latest public key; `turnstile-check.cjs` for the key and standalone-configuration tests; `FORM-SETUP.md` and this guide for the isolated procedure. The private utility is not published. Existing Google Ads files and submission URLs were preserved.

Run `node turnstile-check.cjs`, `node homepage-check.cjs`, `node measurement-check.cjs`, `node launch-check.cjs`, `node seo-audit.cjs`. These use mocked submissions/provider responses and cannot establish production secret storage, actual delivery or real-token replay rejection.

References: [Cloudflare server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [Script Properties](https://developers.google.com/apps-script/guides/properties), [openById](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openById(String)), [ContentService redirects](https://developers.google.com/apps-script/guides/content#redirects).
