const examples = {
  "remove-fake-google-reviews-hvac-companies": {
    "sector": "Heating & cooling",
    "headline": "Was this your service call?",
    "quote": "We were charged twice for the boiler call in Cornwall.",
    "check": "Match the service area",
    "detail": "Check the town, the job type and the contractor named in the post.",
    "capture": "Save the exact Google review and the date it appeared.",
    "compare": "Find the public detail that identifies the other contractor.",
    "privateNote": "Keep dispatch notes, addresses and invoices in your own records."
  },
  "is-google-review-removal-worth-it-med-spas": {
    "sector": "Medical aesthetics",
    "headline": "Which clinic did they visit?",
    "quote": "My appointment was with a provider at the other location.",
    "check": "Check who works where",
    "detail": "Compare the provider and location with the clinic’s public listings.",
    "capture": "Record the public review link and the branch it appears on.",
    "compare": "Use public clinic listings to document any provider or branch mix-up.",
    "privateNote": "Keep patient names, appointment records and photos within the clinic."
  },
  "fake-google-reviews-wedding-venues": {
    "sector": "Wedding venues",
    "headline": "Venue or vendor?",
    "quote": "The caterer at the other hall never confirmed our menu.",
    "check": "Identify who supplied the service",
    "detail": "Check the hall and whether the venue arranged the catering.",
    "capture": "Save the review link and the wording about the hall or vendor.",
    "compare": "Check who booked the service and which venue hosted the event.",
    "privateNote": "Keep guest information, invoices and contracts private."
  },
  "report-google-reviews-child-care-centres": {
    "sector": "Child care centres",
    "headline": "Is this the right centre?",
    "quote": "The Elm Street location said its toddler room was full.",
    "check": "Compare the branches",
    "detail": "Check the address and programme against the centre’s public information.",
    "capture": "Save the public link and identify which centre the review is on.",
    "compare": "Check the street or programme in the post against public centre details.",
    "privateNote": "Follow your privacy process if the post identifies a child."
  },
  "google-review-removal-law-firms": {
    "sector": "Law firms",
    "headline": "Did they mean another firm?",
    "quote": "The lawyer at the King Street office didn’t return my call.",
    "check": "Verify the public office details",
    "detail": "Start with the named office and preserve client confidentiality.",
    "capture": "Record the public wording, link and date.",
    "compare": "Use the firm’s public office listings to check any mismatch.",
    "privateNote": "Have the firm approve what can be shared before submitting a report."
  },
  "google-review-removal-real-estate-agents": {
    "sector": "Real estate",
    "headline": "Agent or brokerage?",
    "quote": "My showing with the Kingston office was never confirmed.",
    "check": "Check the agent and office",
    "detail": "Compare the agent, branch and city with the profile being reviewed.",
    "capture": "Save the review and the agent or brokerage listing that hosts it.",
    "compare": "Check the public brokerage directory for the agent or branch named.",
    "privateNote": "Keep offer terms, property addresses and client details private."
  },
  "google-review-removal-renovation-contractors": {
    "sector": "Renovation contractors",
    "headline": "Whose crew did the work?",
    "quote": "The countertop installers never came back to finish.",
    "check": "Check who hired the trade",
    "detail": "Compare the account with the scope and the company responsible for the work.",
    "capture": "Record the public post and the work it describes.",
    "compare": "Use the scope to check whether your firm managed the trade.",
    "privateNote": "Keep payment details, contracts and the homeowner’s address private."
  },
  "google-review-removal-optometry-clinics": {
    "sector": "Optometry clinics",
    "headline": "Eye exam or eyewear sale?",
    "quote": "The shop across the plaza wouldn’t take back my frames.",
    "check": "Match the service and location",
    "detail": "Check whether the review describes your clinic or a separate optical shop.",
    "capture": "Keep the public review link and wording that identifies the shop.",
    "compare": "Check which business supplied the service before reporting.",
    "privateNote": "Keep patient names, appointment information and care details within the clinic."
  }
};

const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function evidencePanel(capture, compare, privateNote) {
  return `<aside class="review-evidence-visual" aria-label="Review evidence checklist">
      <h3>Before you report the review</h3>
      <dl>
        <div><dt>Save</dt><dd>${escape(capture)}</dd></div>
        <div><dt>Check</dt><dd>${escape(compare)}</dd></div>
        <div><dt>Keep private</dt><dd>${escape(privateNote)}</dd></div>
      </dl>
    </aside>`;
}

function reviewVisuals(article) {
  const example = examples[article.slug];
  if (!example) throw new Error('Missing review illustration for ' + article.slug);
  const cover = article.slug + '-example.webp';
  const coverAlt = 'Illustrative one-star Google review for ' + example.sector.toLowerCase()
    + '. “' + example.quote + '” ' + example.check + '.';
  return {
    cover,
    coverAlt,
    photo: article.cover,
    lead: `<figure class="review-visual-lead">
      <img src="assets/${cover}" width="1200" height="630" decoding="async" alt="${escape(coverAlt)}">
      <figcaption><strong class="review-visual-example" aria-hidden="true">“${escape(example.quote)}”</strong>Illustrative Google review. ${escape(example.detail)}</figcaption>
    </figure>`,
    contextPhoto: `<figure class="industry-context-photo">
      <img src="assets/${article.cover}" width="1200" height="630" loading="lazy" decoding="async" alt="${escape(article.coverAlt)}">
    </figure>`,
    evidence: evidencePanel(example.capture, example.compare, example.privateNote)
  };
}

module.exports = { examples, reviewVisuals, evidencePanel };
