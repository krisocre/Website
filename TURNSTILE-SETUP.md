# ReviewRemoval Turnstile integration

Status: implemented locally; production secret storage, deployment isolation and real-token validation are pending. Nothing has been deployed automatically.

## Existing widget and request contract

- Project: `C:\Users\alkhi\ReviewStars` / `https://reviewremoval.ca/`.
- Existing site key: `0x4AAAAAAFy2a5sutqdFxytB` (the replacement supplied on November 3, 2026). No widget was created or changed.
- Protected surfaces: homepage plus Facebook, Yelp, Trustpilot, Tripadvisor, Booking.com, Glassdoor and Indeed assessment forms.
- Stable action: `quote_request` on every assessment form, checked independently in the backend.
- Browser sends `cf-turnstile-response` to the existing Apps Script handler. Only that handler calls `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
- Gate: a nonblank string token of at most 2,048 characters, configured secret, exact production hostname and action, and `success === true`. Rejection occurs before any spreadsheet access or notification.
- Script Properties: `TURNSTILE_SECRET` and `TURNSTILE_HOSTNAMES`; the existing `NOTIFICATION_EMAIL` property remains unchanged.
- Allowed production hostname settings: `reviewremoval.ca`, optionally `reviewremoval.ca,www.reviewremoval.ca` if both actually serve the form and are allowed by the widget. No localhost, other brands or wildcard matching.
- No client-supplied IP, brand, submitted action, plan or page URL can bypass validation. Lead contents are not sent to Cloudflare or added to analytics. The token is not stored in the spreadsheet or notification email.

## Resolve the shared backend before activation

Both this project and `C:\Users\alkhi\BarberShopRevolution\WebsiteRv\form-submission.js` currently use the same Apps Script `/exec` endpoint, ending in `AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec`.

**Do not replace the shared deployment with this protected handler yet.** ReviewsBoost does not send this widget's token and would be rejected. Do not solve this by allowing missing tokens for a submitted brand or plan: that would be a public bypass.

Recommended activation path within the existing Apps Script project:

1. Keep the existing shared deployment pinned to its current immutable version for ReviewsBoost.
2. In Apps Script, prepare a separate web-app deployment of the code in `google-apps-script.gs`, with its own `/exec` URL, executing as the script owner and accepting public requests. This is another deployment of the existing backend, not a new Worker or proxy.
3. Configure the Script Properties below and authorize `UrlFetchApp` network access when Google requests it. Preserve the existing spreadsheet and notification settings.
4. Provide the new public `/exec` URL so the form action in all eight pages, the platform-page generator and the `endpoint` in `script.js` can be updated together. No secret is needed in chat. The new URL is a documented necessity to keep the brands' form behavior independent.
5. Release the frontend and isolated backend together only after the real verification checks below. Do not publish only the frontend and assume the existing shared backend is protected.

If the shared endpoint is no longer used by ReviewsBoost in production, verify that first; otherwise keep the deployments separate. Do not automatically change ReviewsBoost as part of this project.

## Store the matching secret privately

The existing-widget flow was fetched from [Cloudflare Turnstile Spin](https://developers.cloudflare.com/turnstile/spin/prompt.md). Apps Script's Script Properties are the existing secret destination. No approved Wrangler executable, account manifest or supported secret-manager CLI for this Apps Script destination was available; therefore no secret-bearing getter or secret write was attempted.

1. Open the existing widget in the Cloudflare dashboard and confirm its site key matches `0x4AAAAAAFy2a5sutqdFxytB` and its allowed hostnames include the production hostname(s) above. Keep the existing widget mode and clearance setting.
2. Copy its matching **secret key** directly into Google Apps Script: **Project Settings → Script Properties → Add script property**, name `TURNSTILE_SECRET`. Never put it into HTML, JavaScript, Git, screenshots, logs, command arguments or chat.
3. Add `TURNSTILE_HOSTNAMES` with `reviewremoval.ca` (add `www.reviewremoval.ca` only when applicable).
4. Keep `NOTIFICATION_EMAIL` as configured for existing notifications.

Cloudflare's existing-widget flow requires an explicitly approved absolute Wrangler path/version and destination manifest before automatic secret retrieval. It also says: “If no supported destination exists, stop before retrieving the secret and ask the user to store it through their platform's normal secret-management flow.” This integration follows that manual storage branch; no replacement widget or extra infrastructure is needed.

## Local behavior and checks

The widget is rendered explicitly only when the form approaches the viewport or receives focus. It keeps its widget ID and resets after every completed submission attempt so retries obtain fresh tokens. Expiration, network failure and provider rejection retain the visitor's details; a retry control is available. The widget uses compact mode when the form is narrower than 300 px. No Turnstile resources are loaded on pages without a form. JavaScript is required for the security check; the no-JavaScript notice explains that.

Existing success handling and conversion measurement remain in place; verification failures never count as leads. The privacy policy discloses the security check separately from optional analytics consent.

Run:

```text
node turnstile-check.cjs
node homepage-check.cjs
node measurement-check.cjs
node launch-check.cjs
node seo-audit.cjs
```

`turnstile-test-fixture.cjs` mocks Cloudflare for automated browser regressions. Backend tests run the actual `.gs` source with stubbed Google services and Siteverify responses. No real tokens, secrets, customer submissions, spreadsheet writes or emails are used by these tests. Mocked replay rejection proves the code honors Siteverify's decision; it is not proof of production deployment or widget configuration.

## Files changed for this integration

| Files | Purpose |
| --- | --- |
| `index.html`, `remove-facebook-reviews.html`, `remove-yelp-reviews.html`, `remove-trustpilot-reviews.html`, `remove-tripadvisor-reviews.html`, `remove-booking-com-reviews.html`, `remove-glassdoor-reviews.html`, `remove-indeed-reviews.html` | One widget container with the replacement public key, accessible verification status/retry, and an accurate JavaScript-required notice per form. Homepage script cache version updated. |
| `script.js` | Lazy explicit rendering, token lifecycle, client submission gate, server verification error handling and responsive widget sizing. Existing endpoint, fee calculations and success/measurement calls retained. |
| `styles.css` | Compact security-status styling and form min-width fix to prevent overflow when resizing from desktop to a small phone. |
| `google-apps-script.gs` | Fail-closed Siteverify gate before the original spreadsheet/email handler. Reads only server-side Script Properties. |
| `build-platform-pages.cjs` | Preserve the widget and no-JavaScript notice when regenerating the seven service pages. |
| `privacy-policy.html`, `build-legal-pages.cjs` | Disclose Cloudflare security processing separately from optional measurement, including on rebuild. |
| `turnstile-check.cjs`, `turnstile-test-fixture.cjs` | Backend rejection/side-effect tests and isolated browser lifecycle/resize tests. |
| `homepage-check.cjs`, `measurement-check.cjs`, `site-check.cjs` | Mock the widget while retaining existing visual, submission, consent and conversion regression checks. |
| `FORM-SETUP.md`, `TURNSTILE-SETUP.md`, `_config.yml` | Document the private secret destination and shared-backend activation issue; exclude new test/setup files from the published static site. |

The reviewer carousel, portraits and `home.css` changes already in the working tree were preserved. ReviewsBoost files, pricing, canonical URLs, SEO metadata, analytics IDs and the current submission URL were not changed by this integration.

## Required production validation (pending)

- With the matching secret configured and the isolated endpoint installed, obtain a fresh real token on the allowed production hostname. Submit one clearly labelled test enquiry and confirm exactly one spreadsheet row and the usual notification behavior.
- Replay that same token against the protected endpoint: expect `{ "result": "error", "code": "verification_failed" }`, no extra row and no email. Apps Script ContentService returns JSON application errors rather than configurable HTTP 403 responses; the frontend checks the response body.
- Submit with no token and an invalid token: both must fail without side effects.
- Confirm the verified hostname and action match production. Localhost and another widget's action must not pass. Never log the full Siteverify result or token to inspect this.
- After a failed attempt, verify a new token allows a retry while the visitor's details remain present.
- Confirm `generate_lead`/configured Ads lead events occur only on actual backend success and respect the existing consent settings.
- Confirm ReviewsBoost still submits through its original deployment.

Cloudflare tokens expire after five minutes and are single-use. See [server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) and [testing guidance](https://developers.cloudflare.com/turnstile/troubleshooting/testing/). The secret and a real deployed backend are necessary before calling this end-to-end complete.
