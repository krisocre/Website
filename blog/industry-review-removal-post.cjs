const { reviewVisuals } = require('./industry-review-visuals-post.cjs');
const policy = 'https://support.google.com/contributionpolicy/answer/7400114?hl=en';
const appeals = 'https://support.google.com/business/answer/4596773?hl=en';
const fees = '<strong>CAD $50 upfront per approved review</strong> plus <strong>CAD $125 for each successful removal</strong>, before applicable taxes';

module.exports = [
  {
    slug: 'google-review-removal-real-estate-agents',
    title: 'Google Review Removal for Real Estate Teams',
    heading: 'Google review removal for real estate agents and brokerages',
    description: 'A Google review names the wrong agent or brokerage. See how Canadian real estate teams can document the mix-up and request a free assessment.',
    deck: 'When a review describes the wrong agent or office, check the profile and the evidence before it costs you a listing conversation.',
    type: 'Guide / Real estate',
    art: 'Agent',
    cover: 'real-estate-review-profile-check.webp',
    coverAlt: 'Two agents looking over printed property photos at an office desk',
    serviceLabel: 'Request a free brokerage assessment',
    serviceSummary: 'Share the affected public Google profile or review link and the detail that connects the review to another agent or business.',
    relatedSlugs: ['review-report-evidence-checklist', 'google-review-removal-rating-impact-study', 'review-removal-questions-answered'],
    toc: [
      ['profiles', 'Which profile is involved?'],
      ['evidence', 'What to collect before reporting'],
      ['handoff', 'Protect the handoff after a referral'],
      ['assessment', 'Get a free assessment']
    ],
    intro: 'A referral sends a prospective seller to Google to check your name. There they see a complaint about missed showings from a branch you’ve never worked at. ReviewRemoval helps Canadian agents and brokerages assess reviews like this and prepare reports when the evidence points to a Google policy violation.',
    body: `
      <h2 id="profiles">Start with the exact profile</h2>
      <p>An agent, a brokerage and one of its branches can appear in the same search. Google’s rules distinguish a public-facing practitioner from the organization and give different guidance when several practitioners share a location. Before you report anything, open the review and save a link to the listing that hosts it. Earlier office names and similar agent names can make the wrong profile look plausible. <a href="https://support.google.com/business/answer/3038177?hl=en">Google Business Profile guidelines for individual practitioners</a>.</p>
      <p>Consider a fictional example. A review on a Hamilton agent’s listing mentions a different agent and an appointment at a Kingston office. Copy the lines that identify the office and find a public page confirming which brokerage operates it. If the reviewer only mentions a street name shared by both cities, the details may be too thin to establish a mismatch.</p>

      {{industryPhoto}}
      <h2 id="evidence">Make a short evidence file</h2>
      <ol>
        <li><strong>Pin down the review.</strong> Save its direct link, the date, a screenshot and the name of the profile where it appears.</li>
        <li><strong>Check the relationship.</strong> A reviewer may have attended a consultation, toured a property or dealt with your team from the other side of a transaction. Check for those interactions when there’s no closed deal in your records.</li>
        <li><strong>Find the clearest fact for the report.</strong> Point out the other brokerage, person or location the post describes. If you suspect a conflict of interest, look for evidence that connects the reviewer to the competing or affiliated business.</li>
      </ol>
      <p>Google’s policies cover fake engagement and certain conflicts of interest. Genuine criticism about responsiveness, negotiation or fees belongs in your client-feedback process. Keep offers, addresses and client details out of public replies and the initial assessment. <a href="${policy}">Google Maps review policies</a> · <a href="review-report-evidence-checklist.html">ReviewRemoval’s evidence checklist</a>.</p>

      <h2 id="handoff">Protect the handoff after a referral</h2>
      <p>The Real Estate Council of Ontario encourages consumers to interview several agents and check references. Make it easy for a referred seller to match your public profile to your brokerage website. Use current contact details and give prospects a clear way to request a conversation. <a href="https://www.reco.on.ca/consumers/information-for-buyers/how-do-i-choose-a-real-estate-agent/">RECO’s consumer guide to choosing an agent</a>.</p>
      <p>Ask first-time callers who referred them and whether they also looked you up. Track booked consultations alongside those answers. A lead can start with a personal recommendation and still depend on what the client sees online. If you want to estimate how much one ineligible rating could change the displayed score, start with the total review count and current average. <a href="google-review-removal-rating-impact-study.html">See the rating impact model</a>.</p>

      {{reviewEvidence}}
      <h2 id="assessment">Let ReviewRemoval check the evidence</h2>
      <p>Bring the public review link, the affected profile and a short explanation of the mismatch. The initial assessment is free. If you approve the scope, we prepare the report and handle agreed follow-up, including an eligible appeal. Paid work costs ${fees}. <a href="../google-review-removal-cost-canada.html">See ReviewRemoval’s pricing and examples</a>.</p>
    `
  },
  {
    slug: 'google-review-removal-renovation-contractors',
    title: 'Google Review Removal for Renovation Contractors',
    heading: 'Google review removal for renovation contractors',
    description: 'Know what to save when a Google review blames your renovation company for another trade’s work. Get a free assessment from ReviewRemoval in Canada.',
    deck: 'Sort out who did the work when a Google review names your company but describes a different contractor, job or trade.',
    type: 'Guide / Construction',
    art: 'Trade',
    cover: 'renovation-review-jobsite.webp',
    coverAlt: 'Tradespeople reviewing renovation plans at a workbench in an unfinished kitchen',
    serviceLabel: 'Request a free contractor assessment',
    serviceSummary: 'Send the public link and explain which job and company the post describes. Keep client contracts and addresses in your own records.',
    relatedSlugs: ['review-report-evidence-checklist', 'report-google-review-appeal', 'review-removal-questions-answered'],
    toc: [
      ['attribution', 'Whose work does the review describe?'],
      ['records', 'Records that help sort the issue'],
      ['quotes', 'Measure qualified estimate requests'],
      ['assessment', 'Get a free assessment']
    ],
    intro: 'A homeowner sees your portfolio, checks Google and reads that your crew left a kitchen unfinished. The post describes another firm’s project. ReviewRemoval helps Canadian renovation contractors identify reviews with a credible policy issue and handle the cases they approve for reporting.',
    body: `
      <h2 id="attribution">Ask who was hired for the work</h2>
      <p>When several trades are on site, a homeowner may remember only the name on the sign out front. Start by asking who contracted for the specific work the review describes. Suppose a review says the countertop installers never returned to finish. The general contractor might have hired those installers, or the homeowner might have hired a separate company after the renovation. Those two facts lead to different conversations.</p>
      <p>If your company managed that trade, address the complaint in the context of your own project. If the review clearly names a different firm that handled a separate job, the text and public business details can help show why the post may be off-topic. <a href="${policy}">Google’s Maps content policies</a>.</p>

      {{industryPhoto}}
      <h2 id="records">Check the scope, change orders and handoff notes</h2>
      <p>The Canadian Home Builders’ Association explains how written contracts set out the work and payment milestones, and how change orders record alterations. Those records can help your team establish what it was responsible for and identify who should handle a complaint. <a href="https://www.chba.ca/contracts-get-it-in-writing/">CHBA guidance on renovation contracts</a>.</p>
      <ul>
        <li><strong>Unrelated job.</strong> Keep the review link and highlight the detail that points to a different company, location or service. Use a public reference where possible.</li>
        <li><strong>Your project, disputed details.</strong> Check the agreed scope, any changes and the timeline. A real disagreement about a delay or invoice is a service matter unless the post also raises a policy concern.</li>
        <li><strong>Abusive post or payment demand.</strong> Preserve the original messages, timestamps and review URLs. A short chronology helps document what happened. <a href="https://support.google.com/business/answer/16404809">Google’s extortion reporting guidance</a>.</li>
      </ul>
      <p>Keep homeowner addresses, plans and invoices private. For a first assessment, a public link and a short factual account are enough. Use the <a href="../google-review-removal-checker.html">review evidence checker</a> to organize the details.</p>

      <h2 id="quotes">Look at qualified estimate requests</h2>
      <p>When a review is prominent, count requests from homeowners in your service area who want the work you actually do. Compare similar weeks and record changes in ads, crew availability and season separately. Fewer serious estimate requests matter more than a change in total calls.</p>
      <p>For a hypothetical budget check, one successful removal costs CAD $175 before applicable taxes. If a suitable project would contribute CAD $3,500 after direct job costs, the fee equals 5% of that contribution. Use your own margins to compare costs. Changes in bookings can have several causes.</p>

      {{reviewEvidence}}
      <h2 id="assessment">Give us the facts and hand off the reporting</h2>
      <p>ReviewRemoval checks the concern for free. For approved paid work, we organize the evidence, prepare the report and follow up as agreed. Our fee is ${fees}. <a href="../google-review-removal-cost-canada.html">See the fee breakdown</a> · <a href="report-google-review-appeal.html">Check what to do after an initial report</a>.</p>
    `
  },
  {
    slug: 'google-review-removal-optometry-clinics',
    title: 'Google Review Removal for Optometry Clinics',
    heading: 'Google review removal for optometry clinics',
    description: 'Assess misleading Google reviews about your optometry clinic, keep patient information private and learn what to send ReviewRemoval for a free assessment.',
    deck: 'A triage guide for eye clinics handling reviews that confuse exam fees, optical purchases or different locations.',
    type: 'Guide / Eye care',
    art: 'Clinic',
    cover: 'optometry-review-exam-room.webp',
    coverAlt: 'An empty optometry exam room with a phoropter and a green patient chair',
    serviceLabel: 'Request a free clinic assessment',
    serviceSummary: 'Share the public review link and describe the concern in general terms. Keep patient records and appointment details within the clinic.',
    relatedSlugs: ['google-review-removal-physiotherapy-clinics', 'review-report-evidence-checklist', 'review-removal-questions-answered'],
    toc: [
      ['booking', 'What patients need before booking'],
      ['privacy', 'A triage plan for the front desk'],
      ['measure', 'What to measure at each location'],
      ['assessment', 'Get a free assessment']
    ],
    intro: 'A patient searching for an eye exam sees a post about an eyewear return and assumes it describes your clinic’s billing. The post may be about a separate optical shop. ReviewRemoval helps Canadian clinics check whether a mix-up, harassment or a privacy issue gives them grounds to report a Google review.',
    body: `
      <h2 id="booking">Make exam information easy to find</h2>
      <p>A prospective patient needs to know which location offers exams, where to book and how to confirm fees or coverage. Review those details on Google and on the booking page for each branch. If a review describes another business with a similar name, save the text that identifies it. If your practice also sells eyewear, genuine feedback about that experience may belong on your profile.</p>

      {{industryPhoto}}
      <h2 id="privacy">Give the front desk a simple triage plan</h2>
      <ol>
        <li><strong>Check which service the post describes.</strong> Does it name a different optical shop, clinic or location? Save the link and any public detail that identifies the business.</li>
        <li><strong>Escalate threats or exposed patient information internally.</strong> Have the person responsible for privacy handle the record. Describe the concern generally when seeking help and avoid repeating sensitive details.</li>
        <li><strong>Use a private channel for real complaints.</strong> Give people a way to raise a charge, appointment or service issue directly with the clinic. In a public reply, avoid confirming a patient relationship or discussing anyone’s care.</li>
      </ol>
      <p>The front desk might write, “We take concerns about our office seriously. Please contact the clinic so we can discuss this privately.” The College of Optometrists of Ontario advises optometrists to safeguard patient information and avoid posting identifying information online. Follow the guidance that applies to your practice. <a href="https://collegeoptom.on.ca/resource/guidelines-for-the-appropriate-use-of-social-media-by-optometrists/">Ontario optometry guidance on social media</a> · <a href="${policy}">Google Maps review policies</a>.</p>

      <h2 id="measure">Count enquiries, bookings and attended exams</h2>
      <p>Track those three numbers separately for each location. If requests stay steady but fewer people book, check wait times and how quickly calls are returned. If requests fall after inaccurate information appears, review what the profile says alongside any changes to hours, ads or appointment availability.</p>
      <p>There’s also a practical reason to read the review itself. In a hypothetical clinic with exactly 212 stars across 50 ratings, removing one one-star rating brings the raw average from 4.24 to about 4.31. That difference is modest. The misleading claim that disappears with the post can be the larger factor for a patient deciding whether to call. <a href="google-review-removal-rating-impact-study.html">See how count and starting score affect the average</a>.</p>

      {{reviewEvidence}}
      <h2 id="assessment">Ask ReviewRemoval to check the public post</h2>
      <p>Start with a public review link and a short, non-identifying description. We’ll assess the concern for free. If you approve the scope, we prepare the report and handle agreed follow-up through the appropriate process. Paid work costs ${fees}. <a href="../google-review-removal-cost-canada.html">See pricing in Canadian dollars</a> · <a href="${appeals}">Google’s reporting and appeal process</a>.</p>
    `
  }
].map(({intro, body, ...article}) => {
  const { cover, coverAlt, photo, lead, contextPhoto, evidence } = reviewVisuals(article);
  return {
    ...article,
    cover,
    coverAlt,
    photo,
    heroVisual: lead,
    published: '2026-11-27',
    dateLabel: 'November 27, 2026',
    checkedLabel: 'November 2026',
    minutes: 5,
    serviceHref: '/#quote',
    body: `
      <p class="lede">${intro}</p>
      <p><a class="button button-dark" href="/#quote">${article.serviceLabel} <span aria-hidden="true">↓</span></a></p>
      ${body.trimStart().replace('{{industryPhoto}}', () => contextPhoto).replace('{{reviewEvidence}}', () => evidence)}
    `
  };
}).concat(require('./specialist-review-removal-post.cjs'));
