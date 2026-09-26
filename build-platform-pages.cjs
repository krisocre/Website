const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const platforms = [
  {
    name: 'Facebook', slug: 'facebook', type: 'Page recommendations & reviews', audience: 'For local businesses and service brands',
    headline: 'Facebook review removal for your business Page.',
    intro: 'A troubling recommendation can sit beside the very page customers use to contact you. Send it to our team. We review the details, prepare the report and manage the next steps with you.',
    cue: 'A Page recommendation needs its own assessment. We look at the content, the surrounding context and whether it may conflict with Meta’s Community Standards.',
    issues: ['Content that may breach Community Standards', 'A recommendation appearing on the wrong Page', 'Context or evidence the report should explain'],
    evidence: ['The Page and exact recommendation or review link', 'The specific content that raises a Community Standards concern', 'Any Page administrator context or earlier report response'],
    steps: ['Share your Facebook Page and the recommendation', 'We review the content and prepare a focused report', 'We track the response and explain the next step'],
    faqs: [
      ['Are Facebook Recommendations the same as reviews?', 'Facebook uses Recommendations on business Pages, and its Help Center also refers to reviews. We can assess either type of Page feedback.'],
      ['Will turning Recommendations off remove one post?', 'No. That Page setting hides the Page rating and reviews as a whole. Our service focuses on the specific content you send us.'],
      ['Do you need access to my Facebook account?', 'No login or password is needed to request a quote. If Facebook requires a Page administrator to take an action, we will explain it.']
    ],
    source: 'https://www.facebook.com/help/548274415377576/', sourceLabel: 'Meta Help Center: Page Recommendations',
    profileLabel: 'Facebook Page or recommendation link', accent: '#365898', accentSoft: '#e9edf7', mark: 'f'
  },
  {
    name: 'Yelp', slug: 'yelp', type: 'Business reviews', audience: 'For independent and multi-location businesses',
    headline: 'Yelp review removal, handled with a clear plan.',
    intro: 'When a Yelp review needs attention, the details matter. Our team reviews the post, organizes the evidence and helps carry a clear report through Yelp’s process.',
    cue: 'Yelp evaluates reported reviews against its Content Guidelines. A conflict of interest, a review that is not about a firsthand consumer experience, or inappropriate material may be relevant.',
    issues: ['An apparent conflict of interest', 'A review unrelated to the writer’s own experience', 'Threats, hate speech or private information'],
    evidence: ['The Yelp business page and exact review link', 'Any documented conflict or firsthand-experience concern', 'A previous Report Review response, if one exists'],
    steps: ['Send your Yelp business page and the review', 'We assess the guideline issue and supporting details', 'We prepare the report and follow the decision'],
    faqs: [
      ['Can I report a Yelp review from my business account?', 'Yes. Yelp provides a Report Review option in Yelp for Business. A claimed business page may be needed to report from that account.'],
      ['Is an unrecommended review the same as a removed review?', 'No. Yelp’s recommendation software is separate from its content moderation process. Our success fee applies only when the review is removed.'],
      ['What information helps with a Yelp case?', 'The review link and any specific evidence behind the concern are useful. A clear explanation is stronger than a general disagreement with the rating.']
    ],
    source: 'https://www.yelp-support.com/article/When-should-I-report-a-review?l=en_US', sourceLabel: 'Yelp Support: when to report a review',
    profileLabel: 'Yelp business page or review link', accent: '#c9473c', accentSoft: '#faedeb', mark: 'Y'
  },
  {
    name: 'Trustpilot', slug: 'trustpilot', type: 'Service reviews', audience: 'For ecommerce and service businesses',
    headline: 'Trustpilot review removal, handled for you.',
    intro: 'A Trustpilot review can shape how buyers see your business. Give us the link and the background. We assess the relevant guideline, assemble the supporting detail and manage the reporting work.',
    cue: 'Trustpilot lets businesses flag service reviews from a business account. Its Content Integrity team assesses the review against the selected reason and its guidelines.',
    issues: ['A review that may not reflect a genuine experience', 'Harmful or illegal content', 'Evidence relevant to a specific flagging reason'],
    evidence: ['The Trustpilot profile and review URL', 'A relevant order or service record with private details removed', 'The flag reason and Trustpilot response, if already reported'],
    steps: ['Share your Trustpilot profile and review', 'We identify the appropriate guideline concern', 'We prepare the flag and keep the case organized'],
    faqs: [
      ['Can a business flag a Trustpilot review?', 'Yes. Trustpilot provides flagging tools in its business account for reviews that may break its guidelines.'],
      ['What if Trustpilot asks for more detail?', 'We help organize the relevant facts and supporting documents, then explain what needs to be provided through the available process.'],
      ['Does a low star rating qualify for removal?', 'A rating alone is not a guideline issue. We assess the content and context of the specific review.']
    ],
    source: 'https://trustpilot.zendesk.com/hc/en-us/articles/207312357-For-which-reasons-can-businesses-flag-service-reviews', sourceLabel: 'Trustpilot Help Center: business flagging reasons',
    profileLabel: 'Trustpilot business profile or review link', accent: '#136e5b', accentSoft: '#e7f3ee', mark: '★'
  },
  {
    name: 'Tripadvisor', slug: 'tripadvisor', type: 'Traveler reviews', audience: 'For hotels, restaurants and attractions',
    headline: 'Tripadvisor review removal for your listing.',
    intro: 'A review on your Tripadvisor listing deserves a careful look. We examine the listing, the review and the available evidence, then help move a focused report through the proper channel.',
    cue: 'Tripadvisor identifies reviews on the wrong property, reviews that breach its guidelines and suspicious reviews as potential grounds for a report through the Management Center.',
    issues: ['A review attached to the wrong listing', 'Content that may violate review guidelines', 'Suspicious review activity with supporting context'],
    evidence: ['The listing and exact traveler review link', 'Correct property details if the review is on the wrong listing', 'Relevant booking or visit context with private details removed'],
    steps: ['Send the listing and the traveler review', 'We check the relevant reporting grounds', 'We manage the report and share meaningful updates'],
    faqs: [
      ['Where are Tripadvisor reviews reported?', 'Tripadvisor directs registered owners to the Reviews area of its Management Center to submit a concern about a review.'],
      ['What if the review is about a different property?', 'A review posted to the wrong property is one of Tripadvisor’s listed reasons for submitting a concern. Send us the review and the correct listing details.'],
      ['Can I still respond publicly?', 'Tripadvisor advises businesses that a management response can remain useful while a reported review is being evaluated.']
    ],
    source: 'https://www.tripadvisor.com/business/en-gb/insights/restaurants/resources/bad-review-response-tips', sourceLabel: 'Tripadvisor for Business: reporting a review',
    profileLabel: 'Tripadvisor listing or review link', accent: '#25695d', accentSoft: '#e7f2ee', mark: 'TA'
  },
  {
    name: 'Glassdoor', slug: 'glassdoor', type: 'Employer reviews', audience: 'For employers and people teams',
    headline: 'Glassdoor review removal for employers.',
    intro: 'Employer reviews involve employees, applicants and your reputation as a workplace. Our team reviews the exact post, evaluates the guideline concern and helps manage a careful flagging process.',
    cue: 'Glassdoor allows employers to flag reviews for another moderation look. It evaluates flagged content against its guidelines, so a specific content concern matters.',
    issues: ['Content that may breach Community Guidelines', 'Details that need careful factual context', 'A clear, professional employer response where useful'],
    evidence: ['The employer profile and exact review link', 'The specific guideline concern and any relevant dates', 'An earlier flag response or public employer reply, if relevant'],
    steps: ['Share the employer profile and review', 'We examine the content against the guidelines', 'We organize the flag and follow the outcome'],
    faqs: [
      ['Can employers flag a Glassdoor review?', 'Yes. Glassdoor says employers can use the flag icon beneath a review to request another moderation look.'],
      ['Will Glassdoor remove a review because we disagree with it?', 'A disagreement alone does not establish a guideline violation. We focus on the content and any evidence relevant to Glassdoor’s rules.'],
      ['Should our company respond to the review?', 'A professional employer response can be useful. We can help you decide what information should be addressed publicly while the concern is reviewed.']
    ],
    source: 'https://www.glassdoor.com/blog/responding-to-negative-glassdoor-reviews-faqs/', sourceLabel: 'Glassdoor: responding to negative reviews',
    profileLabel: 'Glassdoor employer profile or review link', accent: '#36744a', accentSoft: '#eaf2e9', mark: 'G'
  },
  {
    name: 'Booking.com', slug: 'booking-com', type: 'Verified guest reviews', audience: 'For hotels and accommodation partners',
    headline: 'Booking.com review removal for property partners.',
    intro: 'Send us the guest review and your property listing. We check the content against Booking.com’s review standards and help organize a report when there is a specific concern.',
    cue: 'Booking.com says suspicious reviews can be reported to Customer Service for its fraud team to investigate. Its published standards also restrict spam, fake content, threats and personal information.',
    issues: ['A review that appears suspicious or inauthentic', 'Threats, discriminatory language or private information', 'Content unrelated to the guest experience'],
    evidence: ['The property listing and exact guest review', 'The relevant reservation or stay context, with private details removed', 'Any prior contact with Booking.com about the review'],
    steps: ['Share your property listing and the guest review', 'We assess the issue against the review standards', 'We prepare the report and explain the response'],
    faqs: [
      ['Can a property report a suspicious Booking.com review?', 'Booking.com says suspicious reviews can be reported to Customer Service so its fraud team can investigate. We help prepare the facts for that report.'],
      ['Does a low guest score qualify for removal?', 'A low score alone is not a reason for removal. The review needs a concern that relates to Booking.com’s standards.'],
      ['What if the guest did not stay overnight?', 'Booking.com says someone who reached the property but did not stay may still be allowed to review it. We check the exact circumstances before preparing a report.']
    ],
    source: 'https://www.booking.com/reviews_guidelines.html', sourceLabel: 'Booking.com: guest review guidelines',
    profileLabel: 'Booking.com property listing or review link', accent: '#1649a5', accentSoft: '#e8eef8', mark: 'B'
  },
  {
    name: 'Indeed', slug: 'indeed', type: 'Company Page reviews', audience: 'For employers and hiring teams',
    headline: 'Indeed review removal for your Company Page.',
    intro: 'An Indeed review can influence job seekers. Send us the post and its context; we assess the specific issue and help prepare a report through Indeed’s available process.',
    cue: 'Indeed says employers can submit a request about Company Page reviews that may break its terms. It lists concerns such as spam, discriminatory language, obscenities and false information.',
    issues: ['Spam or content unrelated to a workplace experience', 'Discriminatory language or obscenities', 'A specific false claim with evidence behind the concern'],
    evidence: ['The Indeed Company Page and exact review link', 'The passages that raise a terms concern', 'Relevant dates or records, with private details removed'],
    steps: ['Share your Company Page and the review', 'We identify the relevant reporting concern', 'We prepare the request and follow the response'],
    faqs: [
      ['Can employers report an Indeed company review?', 'Yes. Indeed says employers can submit a request about reviews that may break its terms of service.'],
      ['Can a company remove a review just because it is negative?', 'Indeed says a review that meets its content guidelines cannot simply be deleted by the employer. We focus on a specific terms concern.'],
      ['Will you need the reviewer’s identity?', 'No. Indeed says it does not share identifying account information with employers. We work from the review and the evidence your business can document.']
    ],
    source: 'https://www.indeed.com/hire/resources/howtohub/indeed-employer-reviews', sourceLabel: 'Indeed: managing employer reviews',
    profileLabel: 'Indeed Company Page or review link', accent: '#2457a7', accentSoft: '#e8eef8', mark: 'i'
  }
];

const allPlatforms = [{ name: 'Google', slug: null, type: 'Business Profile reviews', mark: 'G', accent: '#bf6344' }, ...platforms];
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const url = p => p.slug ? `remove-${p.slug}-reviews.html` : 'index.html';
const cards = current => allPlatforms.filter(p => p.name !== current).map((p, i) => `<a class="related-card" href="${url(p)}" style="--platform-accent:${p.accent}"><span class="related-no">0${i+1}</span><span class="related-mark">${esc(p.mark)}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.type)}</small></span><span class="related-arrow" aria-hidden="true">↗</span></a>`).join('\n');

function head(title, description) { return `<!doctype html>
<html lang="en-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#17353e">
  <meta name="description" content="${esc(description)}">
  <title>${esc(title)} | ReviewRemoval</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="platforms.css">
  <script src="script.js" defer></script>
</head>`; }

function header(current) { return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="wrap header-inner">
    <a class="brand" href="index.html" aria-label="ReviewRemoval home"><span class="brand-mark" aria-hidden="true">R</span><span class="brand-name">Review<span>Removal</span><small>REPUTATION SERVICES</small></span></a>
    <nav class="primary-nav" id="primary-nav" aria-label="Main navigation"><a href="index.html">Home</a><a href="platforms.html"${current === 'platforms' ? ' aria-current="page"' : ''}>Platforms</a><a href="#pricing">Pricing</a><a href="blog/index.html">Blog</a><a href="about.html">About</a><a class="nav-contact" href="${current === 'platforms' ? '#choose-platform' : '#quote'}">${current === 'platforms' ? 'Choose a service' : 'Get my quote'} <span aria-hidden="true">↓</span></a></nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div></header>`; }

function footer() { return `<footer class="site-footer"><div class="wrap footer-main"><div><a class="footer-brand" href="index.html">Review<span>Removal</span></a><p>Review removal service for businesses in Toronto, Ontario and across Canada.</p></div><div class="footer-nav"><a href="index.html">Home</a><a href="platforms.html">All platforms</a><a href="blog/index.html">Blog</a><a href="about.html">About</a><a href="#quote">Get a quote</a></div><div class="footer-note"><strong>Put it in our hands.</strong><p>ReviewRemoval is an independent service. Each platform makes its own moderation decisions under its policies.</p></div></div><div class="wrap footer-bottom"><span>© 2026 ReviewRemoval</span><span>Independent reputation services</span><a href="#top">Back to top ↑</a></div></footer>`; }

function pricing(p) { return `<section class="pricing-section" id="pricing" aria-labelledby="pricing-title"><div class="wrap pricing-grid"><div class="pricing-intro"><p class="eyebrow"><span></span> Clear pricing</p><h2 id="pricing-title">Know the cost before we begin.</h2><p class="pricing-lead">The same straightforward rate applies to every ${esc(p.name)} review we handle. Requesting a quote is free; paid work begins after you agree to the written terms.</p><div class="price-terms"><div><span class="term-label">To start</span><strong><sup>$</sup>50</strong><span>CAD per review</span></div><div><span class="term-label">Only if removed</span><strong><sup>$</sup>125</strong><span>CAD per review</span></div></div><p class="small-print">Applicable taxes and written service terms are confirmed before payment.</p></div><div class="calculator" aria-labelledby="calculator-title"><div class="calculator-head"><span>YOUR ESTIMATE</span><span>CAD</span></div><div class="calculator-body"><h3 id="calculator-title">See your quote</h3><p>How many ${esc(p.name)} reviews would you like us to handle?</p><div class="quantity-control"><button type="button" data-qty-step="-1" data-target="priceQuantity" aria-label="Decrease review count">−</button><input id="priceQuantity" type="number" min="1" max="50" value="1" inputmode="numeric" aria-label="Number of reviews"><button type="button" data-qty-step="1" data-target="priceQuantity" aria-label="Increase review count">+</button></div><div class="calc-lines"><div><span>To start <small>$50 × <span data-count>1</span></small></span><strong data-quote="start">$50</strong></div><div><span>Success fees if all are removed <small>$125 × <span data-count>1</span></small></span><strong data-quote="success">$125</strong></div></div><div class="calc-total"><span>Total if all are removed</span><strong data-quote="total">$175</strong></div><a class="button button-dark" href="#quote">Continue with this quote <span aria-hidden="true">↓</span></a><p class="calculator-note">Success fees apply only to reviews that are removed. You pay nothing on this page.</p></div></div></div></section>`; }

function quote(p) { return `<section class="quote-section section" id="quote" aria-labelledby="quote-title"><div class="wrap quote-heading"><div><p class="eyebrow eyebrow-light"><span></span> Your next step</p><h2 id="quote-title">Let us handle the ${esc(p.name)} review.</h2></div><p>Send the page or review link and a few details. We’ll review your request and explain the next step.</p></div><div class="wrap quote-grid"><form class="quote-form" id="assessment-form" novalidate><div class="form-title"><span>01</span><div><h3>Review details</h3><p>Only the essentials to get started.</p></div></div><input type="hidden" name="selected_plan" id="selectedPlan"><input type="hidden" name="contact_method" value="Email"><div class="form-two"><label>Your name <span>*</span><input name="full_name" type="text" autocomplete="name" required></label><label>Business name <span>*</span><input name="business_name" type="text" autocomplete="organization" required></label></div><label>Email address <span>*</span><input name="email_address" type="email" autocomplete="email" required></label><label>${esc(p.profileLabel)} <span>*</span><input name="business_url" type="url" inputmode="url" autocomplete="url" placeholder="https://..." required></label><label>Specific review link(s) <small>(optional)</small><textarea name="review_links" rows="2" placeholder="One link per line, if you have them."></textarea></label><div class="form-two form-lower"><div><label for="formQuantity">Number of reviews <span>*</span></label><div class="quantity-control form-quantity"><button type="button" data-qty-step="-1" data-target="formQuantity" aria-label="Decrease review count">−</button><input id="formQuantity" name="review_count" type="number" min="1" max="50" value="1" inputmode="numeric" required><button type="button" data-qty-step="1" data-target="formQuantity" aria-label="Increase review count">+</button></div></div><label>Anything else we should know? <small>(optional)</small><textarea name="reason" rows="3" placeholder="A short note is enough."></textarea></label></div><button class="button button-accent submit-button" type="submit">Request service at this price <span aria-hidden="true">↓</span></button><p class="form-help">No payment is taken here. We confirm written service terms before paid work begins.</p><p class="form-message" id="form-message" role="status" aria-live="polite"></p></form><div class="submission-success" id="submission-success" role="status" aria-live="polite" tabindex="-1" hidden><span class="success-mark" aria-hidden="true">✓</span><h3>Request received</h3><p id="success-copy"></p><p class="success-note" id="success-note"></p></div><aside class="quote-summary" aria-labelledby="summary-title"><div class="summary-top"><span>YOUR PRICE / CAD</span><h3 id="summary-title">Your quote</h3><p>For <strong data-review-label>1 review</strong></p></div><div class="summary-lines"><div><span>To begin the service</span><strong data-quote="start">$50</strong></div><div><span>Only if every review is removed</span><strong data-quote="success">$125</strong></div></div><div class="summary-total"><span>Total if all are removed</span><strong data-quote="total">$175</strong></div><p class="summary-note">The success fee applies only to each review that is removed. Your actual total depends on the outcome.</p></aside></div></section>`; }

function page(p) { return `${head(`${p.name} Review Removal Canada`, `${p.name} review removal service for businesses in Toronto, Ontario and across Canada. CAD $50 upfront per review, plus CAD $125 if removed.`)}
<body data-platform="${esc(p.name)}" class="platform-page" style="--platform-accent:${p.accent};--platform-soft:${p.accentSoft}">
  ${header(p.slug)}
  <main id="main">
    <section class="platform-hero" id="top" aria-labelledby="hero-title"><div class="wrap platform-hero-grid"><div class="platform-hero-copy"><p class="breadcrumb"><a href="platforms.html">All platforms</a><span aria-hidden="true">/</span>${esc(p.name)}</p><p class="eyebrow"><span></span> ${esc(p.audience)}</p><h1 id="hero-title">${esc(p.headline)}</h1><p class="platform-hero-lead">${esc(p.intro)}</p><div class="hero-actions"><a class="button button-accent" href="#pricing">See your price <span aria-hidden="true">↓</span></a><a class="platform-secondary" href="#process">How we handle it ↓</a></div></div><aside class="case-card" aria-label="${esc(p.name)} service overview"><div class="case-card-top"><span>REVIEWREMOVAL / SERVICE NOTE</span><span>0${platforms.indexOf(p)+1}</span></div><div class="case-mark" aria-hidden="true">${esc(p.mark)}</div><p class="case-type">${esc(p.type)}</p><h2>${esc(p.name)} reviews,<br>properly handled.</h2><p>One team to assess, prepare and manage the work. Clear terms before you commit.</p><div class="case-card-bottom"><span>STARTING AT<br><strong>CAD $50</strong> / REVIEW</span><span>SUCCESS FEE<br><strong>CAD $125</strong> / REMOVAL</span></div></aside></div><div class="wrap platform-hero-rail"><span>01 / Send the review</span><span>02 / We build the case</span><span>03 / We manage the follow-through</span></div></section>
    ${pricing(p)}
    ${quote(p)}
    <section class="platform-focus section" aria-labelledby="focus-title"><div class="wrap focus-grid"><div><p class="eyebrow"><span></span> ${esc(p.name)} specific</p><h2 id="focus-title">The details behind the review matter.</h2><p>${esc(p.cue)}</p><a class="source-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Read ${esc(p.name)}’s guidance <span aria-hidden="true">↗</span></a></div><div class="focus-panel"><span class="focus-overline">WHAT WE LOOK AT</span>${p.issues.map((issue, i) => `<div class="focus-item"><span>0${i+1}</span><p>${esc(issue)}</p></div>`).join('')}</div></div></section>
    <section class="platform-evidence section" aria-labelledby="evidence-title"><div class="wrap platform-evidence-grid"><div><p class="eyebrow"><span></span> Prepare your request</p><h2 id="evidence-title">What helps with a ${esc(p.name)} review report?</h2><p>Send the public link and the facts you can document. Remove private details from any supporting records before sharing them.</p><a class="text-link" href="blog/review-report-evidence-checklist.html">Use our evidence checklist <span aria-hidden="true">→</span></a></div><ol class="platform-evidence-list">${p.evidence.map((item, i) => `<li><span>0${i+1}</span><p>${esc(item)}</p></li>`).join('')}</ol></div></section>    <section class="platform-process section" id="process" aria-labelledby="process-title"><div class="wrap"><div class="section-heading"><p class="eyebrow"><span></span> How it works</p><h2 id="process-title">How our ${esc(p.name)} review removal service works.</h2><p>You stay informed while our team handles the review work.</p></div><div class="service-grid">${p.steps.map((step, i) => `<article><span class="service-index">0${i+1} / ${['SEND','ASSESS','FOLLOW THROUGH'][i]}</span><h3>${esc(step)}</h3><p>${['Start with the public link and a short note. We’ll ask for more only if it helps.','We examine the platform rules and put the relevant details into a clear report.','We explain the outcome and any next step available through the platform.'][i]}</p></article>`).join('')}</div></div></section>
    <section class="questions-section section" id="questions" aria-labelledby="questions-title"><div class="wrap questions-grid"><div><p class="eyebrow"><span></span> Good to know</p><h2 id="questions-title">Questions about ${esc(p.name)}?</h2><p>Practical answers before you hand us the review.</p></div><div class="faq-list">${p.faqs.map(([q,a]) => `<details><summary>${esc(q)}<span aria-hidden="true">+</span></summary><p>${esc(a)}</p></details>`).join('')}<details><summary>When is the $125 success fee charged?<span aria-hidden="true">+</span></summary><p>Only after a specific review is removed. The fee is charged separately for each successful removal.</p></details></div></div></section>
    <section class="related-section section" aria-labelledby="related-title"><div class="wrap related-heading"><div><p class="eyebrow"><span></span> Other platforms</p><h2 id="related-title">Working across review sites?</h2></div><a class="text-link" href="platforms.html">View all platforms <span aria-hidden="true">→</span></a></div><div class="wrap related-grid">${cards(p.name)}</div></section>
  </main>
  ${footer()}
</body>
</html>\n`; }

for (const p of platforms) fs.writeFileSync(path.join(root, url(p)), page(p), 'utf8');

const directory = `${head('Review Removal Services Canada | Eight Platforms | ReviewRemoval', 'Review removal support across Canada for Google, Facebook, Yelp, Trustpilot, Tripadvisor, Booking.com, Glassdoor and Indeed. CAD $50 upfront per review, plus $125 if removed.')}
<body class="platform-directory">
  ${header('platforms')}
  <main id="main"><section class="directory-hero" id="top"><div class="wrap directory-hero-grid"><div><p class="eyebrow eyebrow-light"><span></span> Review concerns, handled for you</p><h1>Review removal services in Canada.<br><em>Your next step is simple.</em></h1><p>Find the platform where the review appears. From Toronto and Ontario to businesses across Canada, our team assesses the details, prepares the report and guides the case from there.</p><a class="button button-accent" href="#choose-platform">Choose a platform <span aria-hidden="true">↓</span></a></div><div class="directory-aside"><span>HOW WE WORK</span><p>Send the link.<br>We look into it.<br>We handle the work.</p><small>For Canadian businesses dealing with reviews across the places customers and candidates look first.</small></div></div></section>
  <section class="directory-list section" id="choose-platform" aria-labelledby="platforms-title"><div class="wrap"><div class="directory-heading"><div><p class="eyebrow"><span></span> Choose your platform</p><h2 id="platforms-title">Where is the review?</h2></div><p>Select the site to see the process, pricing and quote form for that review.</p></div><div class="directory-items">${allPlatforms.map((p,i) => `<a href="${url(p)}" class="directory-item" style="--platform-accent:${p.accent}"><span class="directory-number">0${i+1}</span><span class="directory-icon" aria-hidden="true">${esc(p.mark)}</span><span class="directory-name"><strong>${esc(p.name)}</strong><small>${esc(p.type)}</small></span><span class="directory-action">See service <span aria-hidden="true">↗</span></span></a>`).join('')}</div></div></section>
  <section class="directory-pricing section" id="pricing"><div class="wrap directory-pricing-grid"><div><p class="eyebrow eyebrow-light"><span></span> One clear rate</p><h2>Same price.<br>Every platform.</h2><p>You see the fee before agreeing to any work. Each review is priced separately, whichever site it appears on.</p></div><div class="directory-price-card"><div><span>UPFRONT / PER REVIEW</span><strong>$50</strong></div><div><span>IF REMOVED / PER REVIEW</span><strong>$125</strong></div><p>CAD. Applicable taxes and written service terms confirmed before payment.</p></div></div></section>
  <section class="directory-process section" id="process"><div class="wrap"><div class="section-heading"><p class="eyebrow"><span></span> The service</p><h2>One team for the entire case.</h2><p>Each platform has its own rules. Our approach starts with the review and the evidence you can share.</p></div><div class="service-grid"><article><span class="service-index">01 / REVIEW</span><h3>We assess the review</h3><p>We look at the exact content, your profile or listing and the relevant platform guidance.</p></article><article><span class="service-index">02 / PREPARE</span><h3>We put the case together</h3><p>We organize the useful facts and prepare a focused report for the available channel.</p></article><article><span class="service-index">03 / MANAGE</span><h3>We follow through</h3><p>We handle the reporting work and explain meaningful updates along the way.</p></article></div></div></section>
  <section class="directory-cta"><div class="wrap directory-cta-inner"><div><p class="eyebrow eyebrow-light"><span></span> Ready when you are</p><h2>Start with the site. We’ll handle the rest.</h2></div><a class="button button-accent" href="#choose-platform">Find your platform <span aria-hidden="true">↓</span></a></div></section>
  </main>
  <footer class="site-footer"><div class="wrap footer-main"><div><a class="footer-brand" href="index.html">Review<span>Removal</span></a><p>Review removal service for businesses in Toronto, Ontario and across Canada.</p></div><div class="footer-nav"><a href="index.html">Home</a><a href="#choose-platform">Platforms</a><a href="blog/index.html">Blog</a><a href="about.html">About</a><a href="#pricing">Pricing</a></div><div class="footer-note"><strong>Put it in our hands.</strong><p>ReviewRemoval is an independent service. Each platform makes its own moderation decisions under its policies.</p></div></div><div class="wrap footer-bottom"><span>© 2026 ReviewRemoval</span><span>Independent reputation services</span><a href="#top">Back to top ↑</a></div></footer>
</body></html>\n`;
fs.writeFileSync(path.join(root, 'platforms.html'), directory, 'utf8');
console.log('Built platforms.html and', platforms.map(url).join(', '));
