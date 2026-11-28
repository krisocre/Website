const { reviewVisuals } = require('./industry-review-visuals-post.cjs');
const published = '2026-11-28';
const fee = 'For approved work, ReviewRemoval charges <strong>CAD $50 upfront per review</strong> and <strong>CAD $125 per successful removal</strong>, before applicable taxes.';
const pricing = '<a href="../google-review-removal-cost-canada.html">See what the fees cover</a>';

function formatValue(value, format) {
  if (format === 'dollar') return 'CAD $' + value;
  if (format === 'percent') return value + '%';
  return String(value);
}

function renderChart(chart) {
  const rows = chart.labels.map((label, i) => '<tr><td>' + label + '</td><td>' + formatValue(chart.values[i], chart.format) + '</td></tr>').join('');
  return [
    '<figure class="chart-frame">',
    '  <img src="assets/' + chart.file + '" width="1200" height="768" alt="' + chart.alt + '" loading="lazy" decoding="async">',
    '  <figcaption>' + chart.caption + '</figcaption>',
    '</figure>',
    '<details class="industry-chart-data">',
    '  <summary>View chart data</summary>',
    '  <table aria-label="' + chart.title + '"><thead><tr><th scope="col">' + chart.tableHeads[0] + '</th><th scope="col">' + chart.tableHeads[1] + '</th></tr></thead><tbody>' + rows + '</tbody></table>',
    '</details>'
  ].join('\n');
}

const posts = [
  {
    slug: "remove-fake-google-reviews-hvac-companies",
    title: "Can HVAC Companies Remove Fake Google Reviews?",
    type: "Heating and cooling",
    description: "A Google review describes the wrong installer or a service call that never happened. See what an HVAC company can document and get a free assessment.",
    deck: "A homeowner needs heat today. Find out what to do when a review about another installer or a fake service call appears on your Google profile.",
    cover: "hvac-reviewremoval-cover.webp",
    coverAlt: "An HVAC technician inspecting a residential furnace with a flashlight",
    serviceLabel: "Request a free HVAC review assessment",
    serviceSummary: "Send the public review link and a short description of the service or company the post describes. We’ll check which evidence supports the concern.",
    relatedSlugs: [
      "google-review-removal-renovation-contractors",
      "review-report-evidence-checklist",
      "report-google-review-appeal"
    ],
    intro: "A homeowner with a failed furnace may call the first local contractor who looks trustworthy and has a crew available. A review about a missed repair or an unexpected call-out fee can change that choice. If the post describes a different business or appears to be fabricated, ReviewRemoval can assess the public review for a potential Google policy violation.",
    chart: {
      "title": "What a qualified call contributes",
      "subtitle": "Illustration at CAD $240 per completed job",
      "labels": [
        "25% completed",
        "50% completed",
        "75% completed"
      ],
      "values": [
        60,
        120,
        180
      ],
      "format": "dollar",
      "axis": "Estimated contribution per qualified call (CAD)",
      "caption": "Scenario model. Multiply the share of qualified calls that become completed jobs by contribution per job. The completion rates are assumptions.",
      "alt": "At a $240 contribution per job, completion rates of 25%, 50%, and 75% imply $60, $120, and $180 per qualified call.",
      "tableHeads": [
        "Qualified calls completed",
        "Contribution per call"
      ],
      "file": "hvac-reviewremoval-chart.png"
    },
    sections: [
      ['dispatch', "Start with the dispatch log", `
        <p>Compare the service, city, call-out terms and approximate date in the review with your dispatch notes. Someone can have a genuine experience with your business by booking a visit or talking to a dispatcher, even when the repair never happened. An unrecognized display name is a reason to check, and evidence that names a different HVAC company gives you something more specific to report.</p>
        <p>Consider a fictional example. A review on an Ottawa firm’s listing refers to an emergency boiler call in a town outside its service area and names another contractor. Save the public review link, a screenshot and the public details about the other business. If the post merely mentions a fee your company actually charges, route the complaint to the service manager. <a href="https://support.google.com/contributionpolicy/answer/7400114">Google Maps content policies</a>.</p>
      `],
      ['value', "Put a value on the calls you can serve", `
        <p>Count calls from people in your service area who need work your team can take on. Follow those calls through to completed jobs. For example, suppose a completed repair contributes CAD $240 after parts, direct labour and travel. If one out of two qualified calls becomes a completed job, those calls average CAD $120 in contribution before overhead and tax.</p>
        {{chart}}
        <p>Use identical definitions when comparing periods. Cold snaps, staffing, and the hours you answer your phone can change the numbers. The example puts a qualified call into dollars without estimating the effect of removing one review.</p>
      `],
      ['profile', "Give homeowners details they can check", `
        <p>Keep the service area, hours and booking options on your profile current. Set out the types of equipment you service and how someone can request a written estimate, especially when they’re comparing heat pump installers. HRAI advises Canadian homeowners to compare quotes on the equipment, warranty and work included. <a href="https://www.hrai.ca/consumer-tip/choosing-a-heat-pump-contractor">HRAI’s guide to choosing a heat pump contractor</a>.</p>
      `],
      ['help', "Hand off a case with clear evidence", `
        <p>Keep names, addresses and invoices in your own records. Send the public link, the closest matching service category and the clearest fact that supports your report. If you’ve already reported it, send the status as well. A free ReviewRemoval assessment can tell you whether our team can take on the reporting and agreed follow-up. <a href="review-report-evidence-checklist.html">Use the evidence checklist</a> · <a href="report-google-review-appeal.html">Check the appeal process</a>.</p>
      `]
    ]
  },
  {
    slug: "is-google-review-removal-worth-it-med-spas",
    title: "Is Google Review Removal Worth It for Med Spas?",
    type: "Medical aesthetics",
    description: "See when a med spa Google review may warrant reporting, how to protect patient information and what a Canadian removal case could cost.",
    deck: "Work out which reviews warrant reporting, what your clinic can safely share, and how the price changes when several reviews are involved.",
    cover: "aesthetics-reviewremoval-cover.webp",
    coverAlt: "An unoccupied medical aesthetics consultation room with two chairs and a desk",
    serviceLabel: "Request a free med spa assessment",
    serviceSummary: "Share the public review link and a brief description of the policy concern. Keep treatment records, appointment details and patient photos within the clinic.",
    relatedSlugs: [
      "google-review-removal-optometry-clinics",
      "google-review-removal-physiotherapy-clinics",
      "review-removal-questions-answered"
    ],
    intro: "A person checking a clinic before booking a consultation may be looking for clear information about the provider, the procedure and the fees. A review that names a practitioner who has never worked at the clinic or shows someone else’s identifiable treatment information calls for a closer look. ReviewRemoval helps Canadian medical aesthetics clinics assess the public post and work out what to report.",
    chart: {
      "title": "Cost if three reviews are approved",
      "subtitle": "ReviewRemoval fees before applicable taxes",
      "labels": [
        "0 removed",
        "1 removed",
        "2 removed",
        "3 removed"
      ],
      "values": [
        150,
        275,
        400,
        525
      ],
      "format": "dollar",
      "axis": "Total service fees (CAD)",
      "caption": "Three approved reviews cost CAD $150 upfront. Each review that is successfully removed adds CAD $125. The bars show possible fee totals.",
      "alt": "For three approved reviews, total fees are $150 with none removed, $275 with one removed, $400 with two removed and $525 with three removed.",
      "tableHeads": [
        "Outcome",
        "Service fees before tax"
      ],
      "file": "aesthetics-reviewremoval-chart.png"
    },
    sections: [
      ['policy', "Read the post for a specific policy concern", `
        <p>Separate the statement you can verify from the sentiment. For example, “this provider works at another clinic” can be checked using publicly listed branches or practitioners. A criticism of discomfort or an outcome from a genuine visit belongs in the clinic’s care and complaints process. Google’s content rules cover issues such as fake engagement, harassment and some personal information. <a href="https://support.google.com/contributionpolicy/answer/7400114">Google Maps contribution policy</a>.</p>
        <p>If several posts use the same language, list their links and dates. If the wording is vague, gather more facts before attributing the posts to a competitor or assuming they were coordinated. <a href="../google-review-removal-checker.html">Check a publicly visible review for policy signals</a>.</p>
      `],
      ['privacy', "Keep patient information in the clinic", `
        <p>Use the clinic’s normal privacy and complaint process. A public response should avoid confirming a patient relationship or explaining the specific treatment. Ontario’s physician regulator warns about confidentiality when physicians consider answering a negative review. Apply the guidance of the professional regulator that governs your practitioners. <a href="https://dialogue.cpso.on.ca/articles/should-i-respond-to-a-negative-online-review">CPSO guidance for Ontario physicians</a>.</p>
        <p>For the first assessment, share the public link and a short, general explanation. Ask the clinic’s privacy lead how to handle copies of posts that themselves contain sensitive material. Leave identifying details out of public replies and assessment notes.</p>
      `],
      ['cost', "Check the cost for the reviews you approve", `
        <p>Ask which reviews have enough evidence before approving a batch. If you identify five suspicious posts and paid work proceeds on only three, the upfront charge applies to those three. Check the written scope before paying.</p>
        {{chart}}
        <p>Compare the possible totals with the reporting work you want handled. Give each review and each location its own line in the case file so you can match the quote to the posts it covers.</p>
      `],
      ['help', "Start with the public facts", `
        <p>A free assessment can help you decide which posts to focus on and which complaints to handle through the clinic. If you approve paid work, ReviewRemoval can prepare the report and manage agreed follow-up, including an appeal where eligible. <a href="https://support.google.com/business/answer/4596773">Google’s review reporting and appeal guidance</a>.</p>
      `]
    ]
  },
  {
    slug: "fake-google-reviews-wedding-venues",
    title: "What Can Wedding Venues Do About Fake Google Reviews?",
    type: "Wedding venues",
    description: "Protect tour enquiries by checking whether a Google review describes your venue, a separate vendor or a real booking dispute. Get a free assessment.",
    deck: "Find out whose service the review actually describes before a misleading post costs your venue a tour request.",
    cover: "wedding-reviewremoval-cover.webp",
    coverAlt: "A venue coordinator arranging chairs in a wedding reception hall",
    serviceLabel: "Request a free venue review assessment",
    serviceSummary: "Send the public review and the detail that points to a different venue or vendor. Keep event contracts, guest details and invoices private.",
    relatedSlugs: [
      "review-report-evidence-checklist",
      "report-google-review-appeal",
      "google-review-removal-real-estate-agents"
    ],
    intro: "A couple finds two spaces with the right capacity and starts narrowing down dates. A Google review says your venue kept a deposit or ran out of food. The booking may involve your staff, a vendor you hired, or an independent vendor the couple selected. ReviewRemoval can assess a suspected policy violation once you’ve worked out whose service the review describes.",
    chart: {
      "title": "From venue enquiry to booking",
      "subtitle": "One illustrative group of 24 enquiries",
      "labels": [
        "Enquiries",
        "Fit date + size",
        "Tours held",
        "Bookings"
      ],
      "values": [
        24,
        12,
        6,
        2
      ],
      "format": "count",
      "axis": "Couples remaining at each stage",
      "caption": "Illustrative sequence. Count each couple once and follow the same group through the stages. These are example counts.",
      "alt": "Of 24 venue enquiries, 12 fit the date and size, 6 proceed to a tour and 2 become bookings in the example.",
      "tableHeads": [
        "Stage",
        "Couples"
      ],
      "file": "wedding-reviewremoval-chart.png"
    },
    sections: [
      ['vendor', "Work out who supplied the service", `
        <p>Check the venue, event date, package and provider named in the review. A complaint about catering can be relevant when the venue arranged the meal. If the review explicitly describes a different venue or an independent vendor’s work on a separate event, record the specific mismatch and keep any public source that supports it. A mismatch is a better starting point than the fact that your team disagrees with the review. <a href="https://support.google.com/contributionpolicy/answer/7400114">Google’s Maps review policies</a>.</p>
        <p>A genuine deposit or cancellation dispute belongs in your booking process. Revisit the written agreement and who handled the cancellation. Canada’s Office of Consumer Affairs encourages consumers to check what happens to a deposit before signing. Clear booking and deposit information helps the next couple know what to expect. <a href="https://ised-isde.canada.ca/site/office-consumer-affairs/en/modern-marketplace/contracts">Consumer guidance on contracts and deposits</a>.</p>
      `],
      ['tour', "Find where prospective couples drop off", `
        <p>Measure Google-sourced enquiries by the requested wedding date and approximate guest count. Then count which are a fit, which tour, and which book. Follow the same group across each stage. The pattern is more informative than comparing Google clicks with deposits that were paid months later.</p>
        {{chart}}
        <p>If early enquiries fall, check what your profile says about capacity, availability and the next step. If tours happen and bookings fall, look at price, included services and timing as well as reviews. The chart is a way to diagnose where to look.</p>
      `],
      ['evidence', "Write down what you can substantiate", `
        <p>Preserve the review link and the wording about the venue, location or service it describes. Keep event contracts, attendee names, photos and payment details private. If there is a demand for money in exchange for the review disappearing, retain the message and relevant links. Google has a separate process for those demands. <a href="https://support.google.com/business/answer/16404809">Google’s extortion reporting guidance</a>.</p>
      `],
      ['help', "Get a second look before you report", `
        <p>Send the public link and the most useful fact about the other event or vendor. ReviewRemoval can help determine which cases have a policy basis, prepare the report for approved work and handle agreed follow-up. <a href="../google-review-removal-checker.html">Screen a review for a possible violation</a> · <a href="review-report-evidence-checklist.html">Prepare the facts for reporting</a>.</p>
      `]
    ]
  },
  {
    slug: "report-google-reviews-child-care-centres",
    title: "How Should Child Care Centres Handle False Google Reviews?",
    type: "Child care centres",
    description: "Find out when to report a false or privacy-sensitive Google review about your child care centre and what directors should keep private.",
    deck: "Families need reliable information about care. Verify claims about the right centre, protect children’s privacy and take genuine concerns seriously.",
    cover: "childcare-reviewremoval-cover.webp",
    coverAlt: "An empty child care classroom with small wooden chairs and shelves of toys",
    serviceLabel: "Request a free child care centre assessment",
    serviceSummary: "Send a public link and describe the potential policy concern in general terms. Keep children’s names, photos and family records private.",
    relatedSlugs: [
      "review-report-evidence-checklist",
      "report-google-review-appeal",
      "google-review-removal-physiotherapy-clinics"
    ],
    intro: "A family checking a child care centre may have only a few openings to consider. A review about a different branch can make it harder to decide which centre to contact. When the post exposes a child’s private information, the director also needs to consider the centre’s privacy and safeguarding procedures. ReviewRemoval can assess whether the public post raises a Google policy issue.",
    chart: {
      "title": "What makes child care hard to find",
      "subtitle": "Canadian parents using care who reported difficulty, 2025",
      "labels": [
        "Available nearby",
        "Affordable",
        "Subsidized"
      ],
      "values": [
        65,
        42,
        35
      ],
      "format": "percent",
      "axis": "Share of this group (%)",
      "caption": "Source: Statistics Canada’s 2025 Survey on Early Learning and Child Care Arrangements. These shares apply to parents using child care who reported difficulty finding it.",
      "alt": "Among Canadian parents using child care who reported difficulty finding it in 2025, 65% cited finding available care nearby, 42% affordable care and 35% subsidized care.",
      "tableHeads": [
        "Challenge reported",
        "Share of this group"
      ],
      "file": "childcare-reviewremoval-chart.png"
    },
    sections: [
      ['families', "Answer the questions families are already asking", `
        <p>Statistics Canada found that among parents using child care who had difficulty finding it in 2025, availability in their community was the most commonly reported challenge. Affordability and subsidized care were other common concerns. If your centre has several sites, make it easy to identify which age groups and schedules each site serves and how to ask about fees or a waitlist. <a href="https://www150.statcan.gc.ca/n1/daily-quotidien/251021/dq251021c-eng.pdf">Statistics Canada’s 2025 child care release</a>.</p>
        {{chart}}
        <p>The survey measures difficulties finding care. Use your own enquiry records to learn which questions families ask before scheduling a tour.</p>
      `],
      ['triage', "Check the location, privacy and safety concerns", `
        <ul>
        <li><strong>Different centre.</strong> Save the public link and the wording about the street, operator or programme that identifies another location.</li>
        <li><strong>Private information.</strong> Follow your centre’s process when a post exposes identifying information. Keep any necessary evidence secure and avoid repeating children’s names in a reply.</li>
        <li><strong>Genuine concern about care.</strong> Bring it to the centre director and follow the applicable safeguarding, notification and complaint procedures. Keep a separate record of any Google policy issue in the post.</li>
        </ul>
        <p>Ontario’s Ministry of Education explains how it investigates child care complaints and publishes information about enforcement. Parents should be able to find the relevant public information for your province. <a href="https://www.ontario.ca/page/child-care-rules-ontario">Ontario’s child care rules and complaint process</a> · <a href="https://support.google.com/contributionpolicy/answer/7400114">Google Maps content policies</a>.</p>
      `],
      ['enquiries', "Track enquiries by centre and age group", `
        <p>Track requests for tours or places by location, age group and approximate start date. If families ask about a claim in a review, check whether your public information gives them an accurate answer. Avoid recording names or details about children in a marketing spreadsheet.</p>
        <p>A centre can still receive inquiries even when most slots are already full. When comparing numbers, separate all parent queries from those for a programme with availability. That gives you a clearer view of what the profile is doing for the centre.</p>
      `],
      ['help', "Start with a short, non-identifying account", `
        <p>ReviewRemoval can assess the public post without needing family records. Send the link and explain the mismatch or other potential policy issue in broad terms. If you approve a quote, we prepare the report and handle the follow-up included in the scope. <a href="review-report-evidence-checklist.html">Use the reporting evidence checklist</a>.</p>
      `]
    ]
  },
  {
    slug: "google-review-removal-law-firms",
    title: "When Should a Law Firm Report a Google Review?",
    type: "Law firms",
    description: "Learn what a Canadian law firm can share when reporting a fake, abusive or off-topic Google review. Compare internal time with managed reporting costs.",
    deck: "Decide what to report and what your team can share without exposing a client relationship or a matter.",
    cover: "law-reviewremoval-cover.webp",
    coverAlt: "Two lawyers reviewing a closed folder at a conference table",
    serviceLabel: "Request a free law firm review assessment",
    serviceSummary: "Provide the public link and a short, non-confidential description. Leave client names, documents and case history out of the request.",
    relatedSlugs: [
      "review-report-evidence-checklist",
      "google-review-removal-real-estate-agents",
      "report-google-review-appeal"
    ],
    intro: "A prospective client can read your Google profile before calling about a sensitive matter. A review naming the wrong firm or describing an unrelated matter can raise questions before intake. ReviewRemoval can assess the public facts for a policy concern. Start by agreeing internally on what the firm can share.",
    chart: {
      "title": "The staff time spent on a report",
      "subtitle": "Illustration at a blended internal cost of CAD $100 per hour",
      "labels": [
        "30 minutes",
        "1 hour",
        "2 hours",
        "3 hours"
      ],
      "values": [
        50,
        100,
        200,
        300
      ],
      "format": "dollar",
      "axis": "Illustrative internal cost (CAD)",
      "caption": "Scenario model. Multiply time spent by your firm’s blended internal cost. Include time your team would still spend on approvals if you hire outside help.",
      "alt": "At $100 per hour, half an hour costs $50, one hour costs $100, two hours cost $200 and three hours cost $300.",
      "tableHeads": [
        "Internal time",
        "Estimated cost"
      ],
      "file": "law-reviewremoval-chart.png"
    },
    sections: [
      ['intake', "Choose who reviews the public post", `
        <p>Have an intake lead take down the public link, date and wording. A lawyer or designated manager can check whether the review names a practitioner at a different firm, an office you don’t operate, or something that actually involved your team. An opposing party or an initial caller may be describing an interaction even if there is no client file under their display name. Focus on verifiable facts and the applicable platform policy. <a href="https://support.google.com/contributionpolicy/answer/7400114">Google’s rules for contributed content</a>.</p>
      `],
      ['share', "Keep client files and the public response separate", `
        <p>The Law Society of Ontario’s confidentiality rule and commentary explain the limits on sharing information learned through a professional relationship, including why it can be sensitive to confirm who sought advice. Have the firm review any proposed response or report that touches on confidential information. A review can be assessed using its public wording and publicly verifiable facts. <a href="https://www.lso.ca/uploadedFiles/NewRulesofProfessionalConduct-effectiveOct2014.pdf">Law Society of Ontario rules, section 3.3</a>.</p>
        <p>A post about a real call or invoice may be better handled through the firm’s private complaints channel. If the wording raises a genuine policy concern, save it without copying client files, matter numbers or identifying details into an assessment form.</p>
      `],
      ['cost', "Compare internal time with the scope of paid help", `
        <p>Include time for preserving evidence, checking what can be shared, writing the report and following the status. In the scenario below, two staff hours cost CAD $200 at a blended CAD $100 per hour. Use your own internal cost and retain time for the review and approval your firm would still need to do.</p>
        {{chart}}
        <p>Compare the written quote with the admin time and follow-up you want handled. If the firm has already filed a report, identify the time still needed to follow the case or prepare an eligible appeal.</p>
      `],
      ['help', "Share the public details first", `
        <p>We can check the review for a potential policy issue before you commit to paid work. If you approve the scope, ReviewRemoval can organize suitable evidence, prepare a report and handle agreed follow-up, including an eligible appeal. <a href="report-google-review-appeal.html">See what to prepare for a Google review appeal</a> · <a href="https://support.google.com/business/answer/4596773">Google’s official reporting process</a>.</p>
      `]
    ]
  }
];

module.exports = posts.map(({intro, sections, chart, ...article}) => {
  const toc = sections.map(([id, label]) => [id, label]);
  const figure = renderChart(chart);
  const { cover, coverAlt, photo, lead, contextPhoto, evidence } = reviewVisuals(article);
  const content = sections.map(([id, title, paragraphs], index) => {
    const section = '    <h2 id="' + id + '">' + title + '</h2>' + paragraphs.replace('{{chart}}', () => figure);
    if (index === 0) return section + contextPhoto;
    return id === 'help' ? evidence + '\n' + section : section;
  }).join('\n');
  return {
    ...article,
    cover,
    coverAlt,
    photo,
    heroVisual: lead,
    published,
    dateLabel: 'November 28, 2026',
    checkedLabel: 'November 2026',
    minutes: 4,
    serviceHref: '/#quote',
    chartFile: chart.file,
    toc,
    body: [
      '    <p class="lede">' + intro + '</p>',
      '    <p><a class="button button-dark" href="/#quote">' + article.serviceLabel + ' <span aria-hidden="true">↓</span></a></p>',
      content,
      '    <p>' + fee + ' ' + pricing + '.</p>'
    ].join('\n')
  };
});
