const { evidencePanel } = require('./industry-review-visuals-post.cjs');

module.exports = {
  slug: 'google-review-removal-physiotherapy-clinics',
  title: 'Google Review Removal for Physiotherapy Clinics',
  heading: 'Google review removal for physiotherapy clinics',
  description: 'See how misleading Google reviews can cost Canadian physio clinics new bookings, which reviews qualify for removal, and what two extra visits could be worth.',
  deck: 'A referral can get your clinic onto a patient’s shortlist. An accurate Google profile can help turn that interest into a booked first visit.',
  type: 'Canadian clinic guide',
  art: '3.6/5',
  published: '2026-11-27',
  dateLabel: 'November 27, 2026',
  checkedLabel: 'November 2026',
  minutes: 5,
  heroVisual: `<figure class="review-visual-lead">
    <img src="assets/physio-google-rating-comparison.webp" width="1200" height="630" decoding="async" alt="Fictional physiotherapy clinics with 30 ratings each. Clinic A scores 3.6 out of 5 and Clinic B scores 5.0. In the example the patient calls Clinic B first.">
    <figcaption>Fictional comparison with review count, distance and availability held similar. Patients also weigh appointment times, coverage, and whether a clinic offers the service they need.</figcaption>
  </figure>`,
  serviceHref: '/#quote',
  serviceLabel: 'Request a free clinic assessment',
  serviceSummary: 'Send the public Google review or profile link and a short description of the concern. We’ll tell you what might qualify and what paid work would cover.',
  relatedSlugs: ['review-report-evidence-checklist', 'google-review-removal-rating-impact-study', 'review-removal-questions-answered'],
  toc: [
    ['shortlist', 'How patients compare clinics'],
    ['value', 'What extra bookings are worth'],
    ['report', 'Which reviews qualify'],
    ['manage', 'What ReviewRemoval handles']
  ],
  body: `
    <p class="lede">A patient gets your clinic’s name from a friend, then searches for it before booking. If a misleading review raises doubts about billing or the front desk, the patient can open another clinic’s listing in seconds. ReviewRemoval assesses suspected fake, abusive or off-topic Google reviews for Canadian physiotherapy practices and handles the reporting work you approve.</p>
    <p><a class="button button-dark" href="/#quote">Get a free clinic assessment <span aria-hidden="true">↓</span></a></p>
    <h2 id="shortlist">What a patient sees before booking</h2>
    <p>Imagine two nearby clinics with evening appointments and 30 reviews each. One shows 3.6 stars. The other shows 5.0. In this example, the patient calls the higher-rated clinic first. A clinic can lose that inquiry before anyone visits its website or speaks to reception.</p>
    <figure class="industry-context-photo">
      <img src="assets/physio-patient-reviewing-options.webp" width="1200" height="800" loading="lazy" decoding="async" alt="Illustration of a prospective patient on a bench comparing physiotherapy clinics on a phone">
      <figcaption>A patient checking reviews can be one step away from calling the front desk.</figcaption>
    </figure>
    <p>Google reviews can help people find a clinic even where referrals are the main source of new business. In a 2025 survey of 550 first-time patients at one women’s physiotherapy clinic in Poland, 12% named Google Maps reviews as their source of information about the clinic and 49% named a friend’s recommendation. The result describes that clinic’s patients. Use your own intake records to learn how people find yours. <a href="https://bibliotekanauki.pl/articles/64161667.pdf">Read Zuzanna Minga’s physiotherapy clinic study</a>.</p>
    <p>Star averages and search position each affect the route to a booking. Google’s local results also depend on relevance, distance and prominence. Check that your listing shows current hours, a working booking link and clear service and billing details. An accurate profile helps someone decide whether to book once they’ve found you. <a href="https://support.google.com/business/answer/7091?hl=en">See Google’s local ranking guidance</a>.</p>

    <h2 id="value">What two more attended assessments could be worth</h2>
    <p>Estimate value using what the clinic collects and the direct cost of delivering the visit. In this hypothetical example, a clinic collects CAD $150 per initial assessment and incurs CAD $60 in incremental delivery costs. Each attended assessment contributes CAD $90 before fixed overhead and taxes.</p>
    <ul>
      <li><strong>One additional attended visit</strong> brings in CAD $150 in collections and contributes CAD $90.</li>
      <li><strong>Two additional attended visits</strong> bring in CAD $300 in collections and contribute CAD $180.</li>
      <li><strong>One successful removal through ReviewRemoval</strong> costs CAD $175 in service fees before applicable taxes.</li>
    </ul>
    <p>Use your own margin to work out how many attended visits would cover the fee. Track inquiries, first assessments booked, and first assessments attended over comparable periods. Changes in availability, referrals and advertising can shift those figures as well. The amounts above illustrate the calculation.</p>
    <p>It also pays to put the star comparison in context. If a clinic has an exact 3.6 average across 30 ratings and Google removes one ineligible one-star rating, the remaining 107 stars across 29 ratings average about 3.69. The size of the change depends on your starting score and review count. <a href="google-review-removal-rating-impact-study.html">See the rating-impact calculations</a>.</p>

    <h2 id="report">Which reviews are worth reporting?</h2>
    <p>Google removes reviews that violate its policies. Before you report one, save the public link, posting date and the detail that connects it to the policy. <a href="https://support.google.com/contributionpolicy/answer/7400114?hl=en">Google Maps content policy</a> · <a href="https://support.google.com/business/answer/4596773?hl=en">Google’s reporting and appeal process</a>.</p>
    <ul>
      <li><strong>Suspected fake engagement.</strong> A cluster of nearly identical posts appears after an unsolicited demand. Keep the relevant public URLs and the timing of the posts.</li>
      <li><strong>Off-topic content.</strong> The review is an advertisement or clearly describes an unrelated business. Preserve the specific wording that connects it to the other business.</li>
      <li><strong>Harassment or private information.</strong> A review threatens staff or shares private contact or health details. Document the concern securely and use the appropriate reporting route.</li>
    </ul>
    <p>A real complaint about a cancellation fee, wait time or communication can tell you what to fix for the next patient. If you reply publicly, keep it general and invite the person to contact the practice privately. Keep treatment details and records out of public replies. <a href="https://collegept.org/standard/communication-standard/">College of Physiotherapists of Ontario communication standard</a>.</p>

    ${evidencePanel('Keep the public review link and the date it appeared.', 'Identify a verifiable detail about the service or location.', 'Keep patient names, appointment records and clinical details within the practice.')}
    <h2 id="manage">Hand the reporting work to ReviewRemoval</h2>
    <p>Start by sending the public Business Profile or review link and a short note about the policy concern. We’ll assess the case for free, identify useful evidence and tell you which reviews we can take on. Keep patient names, appointment records and clinical details inside your practice.</p>
    <p>Once you approve a written scope, we prepare the report and manage the agreed follow-up, including an appeal where applicable. The fee is <strong>CAD $50 upfront per approved review</strong> plus <strong>CAD $125 for each successful removal</strong>. Google decides whether each review comes down. <a href="../google-review-removal-cost-canada.html">See Canadian pricing and examples</a>.</p>
  `
};
