# ReviewRemoval conversion measurement — November 3, 2026

## Current audit and configuration

- Existing Google Ads destination: **AW-18449308865**, retained.
- No GA4 Measurement ID or Google Tag Manager container was found in published
  source. Loading `gtag.js` from googletagmanager.com is not itself a GTM container.
- Supplied Google Ads action: **Submit lead form**, with destination
  **AW-18449308865/HqdzCIv5z4gdEMG5qN1E**. Its event snippet was provided on
  November 3, 2026 and is now configured in the existing measurement module.
- Existing consent controls and the confirmed-lead hook are retained. No second
  Google tag, GTM container or submit-button click conversion was added.
- There are currently no `mailto:` or `tel:` links on the published pages.
- Cloudflare's live hosting response injects a RUM beacon independently of the
  repository. It is not a GA4/GTM install and is not managed by this module.

`measurement-config.js` is the single source of destination settings:

```js
window.ReviewRemovalMeasurementConfig = Object.freeze({
  ga4MeasurementId: null,
  googleAdsId: 'AW-18449308865',
  googleAdsLeadConversionLabel: 'HqdzCIv5z4gdEMG5qN1E'
});
```

The null GA4 value deliberately disables that route. It is not a production
placeholder. The Ads account and conversion label come from the supplied tag;
no account settings were changed.

With the current configuration, the existing Ads base destination loads only
after advertising consent. Native Ads lead conversions are enabled for confirmed
submissions after that consent. GA4 events remain disabled until a real web-stream
Measurement ID is supplied.
After analytics consent, a small in-memory verification log records safe event
signals even when GA4 is unconfigured; it is not a remote analytics service.

## Events and conversion roles

| Event | Exact trigger | Conversion role |
| --- | --- | --- |
| `page_view` | Once per page after eligible analytics consent; automatic config page views are disabled | Observation only; never a primary conversion |
| `quote_cta_click` | Click on a same-origin link to `#quote`; location is a fixed enum | Secondary diagnostic event; do not bid on it |
| `quote_form_start` | First eligible user input/change or review-count click inside the assessment form; focus alone does not count | Secondary diagnostic event |
| `generate_lead` | The existing Apps Script request returns explicit JSON `result: success` | Primary GA4 key event candidate: confirmed enquiry, not a paid order, qualified lead or successful removal |
| `email_click` | Actual mailto link click, if such a link is added | Secondary intent signal, not a confirmed enquiry |
| `phone_click` | Actual telephone link click, if added | Secondary intent signal, not a connected call |
| Google Ads `conversion` | The same confirmed response, advertising consent and a real conversion label | Primary Ads action candidate; choose one reporting/bidding route for this lead |

Do not mark the generic submit event, button clicks, the displayed success panel,
or validation attempts as primary conversions. Automatic GA4 form_submit can
fire before an asynchronous request is confirmed.

The checked-in backend appends the sheet row before returning success. A success
response with `notification_sent: false` is still a confirmed saved enquiry and
counts once. Network/HTTP/JSON errors and backend `result: error` do not count.
The legacy “no recipient” error can still display the existing warning, but its
error string is not treated as sufficient confirmation for measurement.

The browser prevents a second lead signal for the same form on the same page.
Direct Ads conversions use an independently random transaction ID, never a
name, address, email hash, profile URL or form-derived identifier. This is not
server-side deduplication across reloads or separate requests. The existing
backend does not return a persistent receipt ID, so those cases remain a server/
operational reconciliation task. No endpoint, sheet layout or backend deployment
change is required for the implemented browser hook.

## Consent and privacy design

- Basic opt-in is applied consistently, without guessing visitors' province from
  their IP address. Optional Google tags do not load before a choice.
- Analytics and advertising measurement are separate choices, initially off.
  Accept and reject have equal prominence. There is no modal, sticky overlay,
  consent wall or extra enquiry checkbox.
- English/French controls and a permanent footer **Cookie choices** button let
  visitors review or withdraw their choices. The preference record contains only
  a version, two booleans and an expiry; it expires after 180 days. No visitor ID
  or form contents are stored with it. Blocked storage does not break forms.
- GPC disables advertising measurement even when a stored choice previously
  allowed it. Analytics remains a separate explicit choice.
- Advertising personalization stays denied. Analytics Google Signals and ad
  personalization signals are disabled in the configured GA4 route.
- Rejection/withdrawal stops this module's new business events, updates Google's
  consent state, disables the configured GA4 destination, and expires accessible
  first-party GA/Ads cookies for withdrawn purposes. Reloading unloads any Google
  code that had already been accepted; withdrawal does not erase previously
  collected data or cancel already in-flight requests. No forced reload discards
  an unfinished enquiry.
- A free enquiry and the existing terms/privacy acknowledgement are separate
  from tracking consent. Refusing tracking does not prevent submission.

Event parameters are built from an allowlist: a published canonical page path,
generic site title, page category, known platform enum, fixed CTA location,
constant form ID or contact-method enum. Ads conversions also include the supplied
snippet's fixed `value: 1` and `currency: 'CAD'`, plus a random transaction ID.
This is a nominal lead value, not a payment, quote amount or removal result.
The code never serializes FormData into
analytics, reads a link's displayed text for analytics, or forwards contact
destinations, selected-plan text, prices, review count, review text, email, name,
business name or profile URLs. No enquiry amount is reported as revenue.

Page location uses the published canonical URL with no visitor query/hash;
page_referrer is empty. Unknown query parameters, arbitrary fragments and 404s
disable optional Google collection, leaving the actual address and essential
form process untouched. Valid-format Google advertising click parameters
(`gclid`, `dclid`, `gbraid`, `wbraid`, `gad_source`, `gad_campaignid`) and actual
published in-page anchors are eligible. **UTM-tagged or other non-allowlisted
visits are intentionally suppressed** rather than risk leaking URL contents.
Review this privacy/attribution trade-off before adding campaign parameters;
never broadly allow visitor-supplied values. Attribution must be verified in the
actual accounts, particularly with canonical URL sanitization.

Google can still process IP/device identifiers as part of consented tag
operation. “No form contents in event parameters” does not mean that optional
analytics is anonymous or exempt from applicable privacy requirements.

## Configure actual destinations

1. Obtain the brand's real GA4 web-stream Measurement ID from its Analytics
   account. Before adding it to `measurement-config.js`, disable Enhanced
   Measurement automatic form interactions, outbound-click capture, site search
   and history/page-change capture (or disable Enhanced Measurement entirely).
   This module owns the manual event route; do not create a second GA4 or GTM
   event implementation for the same actions. Review connected destinations too.
   Review the public privacy notice and consent wording for that actual setup;
   version any necessary policy update without rewriting archived releases.
2. Replace only `ga4MeasurementId: null` with the real public G- ID. Never put
   passwords, API tokens or service-account credentials in browser files.
3. The supplied **Submit lead form** action in account AW-18449308865 is already
   configured using label `HqdzCIv5z4gdEMG5qN1E`. Check that this is the intended
   ReviewRemoval action in Google Ads; no new account or action is needed.
4. `googleAdsLeadConversionLabel` contains that real label. The existing account
   ID is retained and one Google loader serves both configured destinations.
5. Keep automatic/enhanced user-provided-data collection and enhanced conversions
   disabled unless separately reviewed and intentionally implemented with valid
   consent. This implementation does not send or hash user-provided data.
6. Set the confirmed lead action's count to **One** as appropriate for lead
   acquisition. The event sends CAD $1, matching the supplied snippet. Review this
   nominal lead valuation in Ads before using value-based bidding; no removal
   quote or payment amount is sent.
7. Choose exactly one primary Ads lead route: the native conversion label **or**
   a linked GA4 generate_lead import. Do not make both primary for the same lead.
   If retaining both for comparison, keep the duplicate route secondary and
   exclude it from campaign bidding goals. CTA, form-start and contact clicks
   remain secondary/observation signals. GA4 needs only generate_lead marked as
   the relevant key event, rather than every funnel interaction.
8. Test with Tag Assistant, GA4 Realtime/DebugView and the actual Ads action before
   declaring account reporting operational. The local tests stub destinations;
   they cannot verify account ownership, connected-tag settings or attribution.
   In Tag Assistant, turn off **Include debug signal in the URL** for this
   strict URL policy, use its Chrome extension, make the consent choice, then
   retry the connection if needed. Unknown debug query parameters are otherwise
   suppressed along with other non-allowlisted queries. Google documents that
   option in its [Tag Assistant connection guidance](https://support.google.com/tagassistant/answer/10039345?hl=en).

No GTM container is required. If GTM is introduced later, migrate ownership of
events deliberately; do not layer duplicate GA4/Ads tags on top of this route.

## Files and local verification

- `measurement-config.js`: existing Ads ID, supplied lead conversion label and
  disabled GA4 destination.
- `measurement.js`, `measurement.css`: consent controls and safe event routes.
- `script.js`: the explicit-success lead hook; the submission integration is
  otherwise unchanged.
- All 32 root/blog HTML documents: replace the repeated direct Google tag with
  one shared consent-controlled bootstrap, including on policy and 404 pages.
  This measurement change does not rewrite their visible service/article copy.
- `install-measurement.cjs`, `set-live-domain.cjs`, `build-legal-pages.cjs`:
  repeatable migration and builder integration.
- `measurement-check.cjs`, `seo-audit.cjs`, `launch-check.cjs`: measurement,
  duplicate-tag and rebuild checks. `_config.yml` excludes local tooling/docs.
- `MEASUREMENT-SETUP.md`: audit, account setup and verification instructions.

Local verification on November 1, 2026 passed `measurement-check.cjs`,
`homepage-check.cjs`, `seo-audit.cjs`, `site-check.cjs`,
`google-focus-check.cjs` and `launch-check.cjs`. The browser tests intercept
Google requests and simulate backend responses: no real lead was submitted and
no live Analytics or Ads receipt was asserted. They verify the success/error
contract and event parameters, not actual account attribution or reporting.
There is no package/build command in this static site's repository; the launch
check builds and checks repeatability in a temporary directory.

## Simple verification checklist

- [ ] Fresh browser: no Google loader/collect request before optional consent.
- [ ] Reject: no custom Google events; the assessment form still works.
- [ ] Analytics only: one manual page view, no Ads destination initialization.
- [ ] Advertising only: no GA4 funnel events; only a configured, confirmed Ads
      lead can become a conversion. Missing label means no conversion call.
- [ ] Both: exactly one Google loader and one page view per document.
- [ ] Hero/header/pricing/footer quote links produce the correct fixed location.
- [ ] Focus does not start a form; first user input counts once.
- [ ] Invalid input, network error, non-JSON response and result:error produce no
      lead conversion; a later confirmed retry produces one.
- [ ] Explicit saved success, including notification_sent:false, produces one
      generate_lead and at most one configured native Ads conversion.
- [ ] With the current Ads-only configuration, Tag Assistant shows one conversion
      to `AW-18449308865/HqdzCIv5z4gdEMG5qN1E`, value `1`, currency `CAD` and a random
      transaction ID after confirmed success. No GA4 event is sent without a G- ID.
- [ ] Inspect every event parameter: no names, email, review text, profile URLs,
      contact destinations, free-text fields or visitor query/hash.
- [ ] Unknown query/hash visits suppress optional collection and retain their
      address and working form. Verify legitimate paid campaign attribution.
- [ ] GPC keeps advertising off; choices survive reload, expire, and remain usable
      when browser storage is blocked.
- [ ] Withdrawal stops new custom events and reload starts with the saved denial.
- [ ] Future email/phone links send only an intent event, never their destination.
- [ ] Test the French preference text and keyboard/focus flow.
- [ ] Check Tag Assistant/account goals for duplicate imports or automatic form
      conversions; do not infer success solely from a visible success message.

Local commands:

```text
node measurement-check.cjs
node homepage-check.cjs
node seo-audit.cjs
node site-check.cjs
node google-focus-check.cjs
node launch-check.cjs
```

For consented local verification without a GA4 ID, inspect:

```js
ReviewRemovalMeasurement.status()
ReviewRemovalMeasurement.recentEvents()
```

The latter is an in-memory diagnostic log, capped at 30 safe events. It reports
whether each event had a GA4 route; it is not proof that Google received it.

## Build, hosting and limitations

`node install-measurement.cjs` migrates current pages from the direct legacy
loader to one shared bootstrap. The domain builder and Removal legal-page
builder preserve the bootstrap on rebuild. Every published HTML page, including
the 404, is covered. Tests/docs/installer are excluded from publication; config,
runtime JS and CSS are public assets. Existing form field names, terms version,
privacy snapshot, backend URL and backend source remain unchanged.

Cloudflare's injected RUM is an account-level integration outside these source
files. Review its actual metrics and privacy settings separately; if your
assessment requires opt-in for that processing, disable automatic injection or
integrate it with the consent policy in the hosting account. No Cloudflare account
change was made or claimed. Security/hosting cookies and server logs are also
distinct from this module's optional Google measurement controls.

This is a conservative consent implementation, not a certification of every
Canadian privacy obligation or of third-party account settings. Its basic
opt-in approach avoids assuming that the same opt-out treatment is appropriate
for every Canadian visitor. No live enquiry or real Google collection is needed
for the automated verification.

Primary references checked November 1, 2026:

- [Google: basic versus advanced consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Google: consent implementation and updates](https://developers.google.com/tag-platform/security/guides/consent)
- [Google: route events to explicit destinations](https://developers.google.com/tag-platform/gtagjs/routing)
- [Google: conversion IDs, labels and transaction IDs](https://support.google.com/tagmanager/answer/6105160?hl=en)
- [Google: duplicate tags and primary/secondary conversion troubleshooting](https://support.google.com/google-ads/answer/9148089?hl=en)
- [Canada OPC: behavioural advertising and meaningful choice](https://www.priv.gc.ca/en/privacy-topics/technology/online-privacy-tracking-cookies/tracking-and-ads/bg_ba_1206/)
- [Quebec CAI: consent and default privacy settings](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/interfaces-truquees)
- [Cloudflare: injected RUM beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
