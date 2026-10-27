# Terms, privacy and request acknowledgements

Draft implemented October 27, 2026. This is website implementation and a researched
contract draft, not a legal opinion or a guarantee of enforceability.

## What is implemented

- Full English/French terms and privacy pages, with effective date and printable
  layout. ReviewRemoval also has policy links in its page footers. ReviewsBoost's
  existing refund page is aligned with its terms and actual platform fees.
- A readable 12px notice immediately before each final submission action. No
  checkbox, preselected marketing consent or claim that the person has read a page.
  The French flow links directly to the French policy sections.
- An enquiry is free and does not form a paid removal order or authorize payment.
  A separate accepted written order must identify the supplier, reviews, scope,
  fees, taxes, success test, cancellation terms and any follow-up period.
- No guarantee of removal, permanent absence, timing, star rating, search position
  or commercial results. Independent platform actions and client-supplied material
  are addressed. The terms include proportionate business indemnity and liability
  limits, with mandatory-law and serious-fault exceptions.
- The public rates remain different for the two brands. No success fee is due for
  an unsuccessful review. Cancellation distinguishes earned work from unearned
  advances; mandatory refund and other remedies are preserved.
- Terms version, URLs, notice wording, language, submission page without query
  parameters, and client-device timestamp are included in the existing Reason
  field. This works with the deployed twelve-column Apps Script handler; no backend
  redeployment is required for these extra lines. The backend supplies its own row
  timestamp. Client-supplied metadata is not independent proof of identity or reading.
- `legal-versions/policies-2026-10-27.json` preserves the bilingual policy text for
  this release and is linked in the submission record. Keep older snapshots after
  later releases. Commit/tag the published version and keep order confirmations.

## Complete before taking paid orders

1. At the owner’s request, public policies currently use “Contact us” links to
   existing forms. Legal names, contact emails and mailing addresses are not
   displayed in these policies. The corresponding settings remain empty. When
   preparing a paid agreement, supply any supplier identity/contact disclosures
   required by the applicable law. This presentation choice does not remove
   those requirements.
2. Have Canadian counsel review the draft for the actual supplier, location,
   business model and provinces served. A blanket exclusion of every consequence
   is not reliable. These terms preserve non-waivable rights, intentional/gross
   fault, and protected bodily/moral injury, rather than promise immunity.
3. Ensure every paid order supplies legal supplier/contact details and the policy
   version before acceptance. Agree review identification, the objective removal
   test, confirmation point, return/reappearance treatment and fee trigger. Send a
   durable copy of the accepted order and terms. Do not add new terms by invoice.
4. Where French contract delivery is required, provide the French contract before
   an express choice of another language. The bilingual pages support this; a link
   or use of the English website is not a complete French-contract delivery process.
5. Operate the stated privacy practices: control access to Sheets/email, respond
   to privacy requests, choose and implement a justified retention schedule and
   review service-provider and cross-border safeguards. ReviewRemoval loads a
   Google Ads tag; assess applicable tracking-consent requirements separately.
   This request acknowledgement is not advertising-cookie consent.
6. Substantiate existing marketing claims, including typical timelines, customer
   counts and testimonials. Terms do not cure a misleading headline or an omitted
   material fact. Estimates cannot be presented as guaranteed deadlines.

## Rebuild and versioning

ReviewRemoval: `node set-live-domain.cjs https://reviewremoval.ca` automatically
runs the legal builder after other page generators. Its launch test copies the
builder and settings and checks a change of canonical host. Sitemap includes both
policy pages. Normal full rebuild order remains in LAUNCH-DOMAIN-CHECKLIST.md.

ReviewsBoost: run `node build-legal-pages.cjs` after editing or generating public
pages. It regenerates the three policies, form notices and policy sitemap dates.

The two repositories contain independent copies of `build-legal-pages.cjs`,
`submission-terms.js`, `legal-notice.css` and `legal-settings.json`; brand settings
and pricing differ. When materially changing published terms, increment VERSION
and the effective-date text in the builder, retain the old snapshot, and apply new
terms to future requests/orders. Do not overwrite an old published version or
change existing orders retroactively. Counsel should check any material update.

## Research consulted

Checked October 27, 2026; these are sources for the drafting decisions, not a claim
that every clause is approved by a regulator.

- [Ontario Consumer Protection Act, 2002](https://www.ontario.ca/laws/statute/02c30),
  especially ss. 6–7 (rights and non-waiver), 9 (services), 14 (unfair practices)
  and 37–40 (internet agreements). Consumer/business scope matters; the draft does
  not assume every client is legally excluded from consumer protections.
- [Ontario Consumer Protection Act, 2023](https://www.ontario.ca/laws/statute/23c23):
  the official text currently states it is not yet in force. The site does not
  claim that future legislation is already operative.
- [Civil Code of Québec, article 1474](https://www.legisquebec.gouv.qc.ca/fr/version/lc/CCQ-1991?code=se%3A1474&langCont=en):
  restrictions on exclusions for intentional/gross fault and bodily/moral injury.
- [Québec Consumer Protection Act](https://www.legisquebec.gouv.qc.ca/en/document/cs/P-40.1),
  including s. 10 (merchant responsibility) and distance-contract rules.
- [OQLF: contrats d’adhésion](https://www.oqlf.gouv.qc.ca/francisation/entreprises/contrats-adhesion.html):
  French-first delivery, bilingual delivery and subsequent express language choice.
- [Privacy Commissioners: meaningful consent](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/collecting-personal-information-and-consent/consent/gl_omc_201805/):
  understandable, accessible information, layered notices, necessary purposes and
  separate choices for unnecessary processing.

## Verification

Both SEO audits and the ReviewRemoval domain/launch test pass. All eight request
forms on each brand were tested using mocked submissions, including French,
desktop/mobile, visible notice placement and saved acknowledgement fields. Existing
ReviewsBoost backend/transport tests also pass. No test submission was sent to the
live Apps Script endpoint. ReviewRemoval policies were checked at 1440/390/320px.

The additional Playwright dependency for the existing ReviewsBoost enquiry test
was installed only under ignored `.seo-private/legal-test-deps` in ReviewStars.
Run that test with NODE_PATH pointing to that folder's node_modules, or use your
normal development Playwright installation. No production package was added.
