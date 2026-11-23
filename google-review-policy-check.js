(function () {
  'use strict';

  const form = document.getElementById('policy-check-form');
  const input = form.querySelector('textarea');
  const error = document.getElementById('policy-check-error');
  const status = document.getElementById('policy-check-status');
  const submit = form.querySelector('button[type="submit"]');
  const followup = document.getElementById('policy-follow-up');
  const followupTitle = document.getElementById('policy-follow-up-title');
  const followupStep = document.getElementById('policy-follow-up-step');
  const followupBody = document.getElementById('policy-follow-up-body');
  const result = document.getElementById('policy-check-result');
  const heading = document.getElementById('policy-result-title');
  const advice = document.getElementById('policy-result-advice');
  const findings = document.getElementById('policy-result-findings');
  const openReview = document.getElementById('policy-open-review');
  const googleGuide = document.getElementById('policy-google-guide');
  const excerpt = document.getElementById('policy-result-excerpt');
  const estimateSource = document.getElementById('policy-result-source');
  const questions = window.ReviewRemovalCheckQuestions;
  const maxFollowups = 2;
  const maxReviewLength = 3600;
  let activeCheck;
  const reporting = 'https://support.google.com/business/answer/4596773';
  const extortion = 'https://support.google.com/business/answer/16404809';
  const fixedAssessment = document.querySelector('.assessment-shortcut');
  if (fixedAssessment && typeof IntersectionObserver === 'function') {
    const inlineAssessment = result.querySelector('.policy-check-actions .button');
    new IntersectionObserver(([entry]) => {
      fixedAssessment.classList.toggle('policy-dock-obscured', entry.isIntersecting);
    }).observe(inlineAssessment);
  }

  // Each pattern is a narrow wording clue. The surrounding facts can change its meaning.
  const policies = {
    extortion: {
      title: 'Payment demand',
      next: 'Save the original demand, timestamps and related review links. Google has a dedicated reporting form for review extortion.',
      clue: /\b(?:pay|send)\s+(?:me|us)\b[^.!?\n]{0,110}\b(?:remove|delete|take down)\b[^.!?\n]{0,40}\b(?:reviews?|ratings?)\b/iu
    },
    harassment: {
      title: 'Threats or targeted harassment',
      next: 'Save the exact wording in context and a dated screenshot. Point to the specific threat or targeted conduct in a report.',
      clue: /\b(?:i|we)(?:'ll| will| (?:am|are) going to)\s+(?:hurt|kill|attack|come after)\s+(?:you|your (?:staff|family|employees))\b/iu
    },
    privacy: {
      title: 'Private personal information',
      next: 'Check that the detail is private and shared without permission. Keep it in a private record. Public business contact details can be allowed.',
      clue: /\b(?:home address|personal (?:phone number|email address)|social insurance number)\s*(?:is\s+|:\s*)[\d\w]/iu
    },
    spam: {
      title: 'Promotional or off-topic content',
      next: 'Point out the promotion or explain how the content is unrelated to your business. Save links and dates for any identical posts you find.',
      clue: /\b(?:use (?:my|our) (?:promo|discount|coupon) code|(?:dm|message) me to (?:buy|order)|buy now at)\b/iu
    },
    conflict: {
      title: 'Conflict of interest',
      next: 'Find a dated source that connects the author to the employment, competitor or other business relationship and keep it with the review.',
      clue: /\b(?:i (?:work|worked|used to work) (?:for|at) (?:this|your) (?:business|company|restaurant|store)|i(?:'m| am) (?:the owner of a competing business|a former employee))\b/iu
    },
    fake: {
      title: 'Review may not reflect a genuine experience',
      next: 'Save the wording and check the specific dates, location or transaction details you can verify. An unfamiliar reviewer name alone is weak evidence.',
      clue: /\b(?:i (?:was|got) paid to (?:write|post) (?:this|the) review|they (?:gave|paid|offered) me \$\d+ to (?:leave|post|write)\b|i(?:'ve| have) never (?:dealt with|interacted with|used) (?:this|your) (?:business|company|service))\b/iu
    }
  };

  const googleHosts = new Set(['google.com', 'www.google.com', 'google.ca', 'www.google.ca']);
  const mapsHosts = new Set(['maps.google.com', 'maps.google.ca']);
  const sharePaths = new Map([
    ['maps.app.goo.gl', /^\/[a-z0-9_-]+\/?$/i],
    ['goo.gl', /^\/maps\/[a-z0-9_-]+\/?$/i],
    ['g.co', /^\/kgs\/[a-z0-9_-]+\/?$/i],
    ['g.page', /^\/[a-z0-9_/-]+$/i],
    ['share.google', /^\/[a-z0-9_-]+\/?$/i]
  ]);

  function googleLink(value) {
    let url;
    try {
      url = new URL(value.includes('://') ? value : 'https://' + value);
    } catch {
      return null;
    }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    const mapsPage = /^\/maps(?:\/|$)/.test(url.pathname);
    const mapsQuery = mapsHosts.has(url.hostname) && url.pathname === '/' && url.searchParams.has('q');
    const searchReview = googleHosts.has(url.hostname) && url.pathname === '/search' && url.hash.startsWith('#lrd=');
    if (!(sharePaths.get(url.hostname)?.test(url.pathname) || mapsQuery || searchReview ||
          (mapsPage && (mapsHosts.has(url.hostname) || googleHosts.has(url.hostname))))) return null;
    url.protocol = 'https:';
    return url;
  }

  function readInput() {
    const value = input.value.trim();
    const [firstLine, ...rest] = value.split(/\r?\n/);
    const first = firstLine.trim();
    const looksLikeLink = /^\S+$/u.test(first) && /^(?:[a-z][a-z0-9+.-]*:\/\/|(?:[\w-]+\.)+[a-z]{2,}\/)/i.test(first);
    return looksLikeLink ? { text: rest.join('\n').trim(), url: googleLink(first), hasLink: true }
      : { text: value, url: null, hasLink: false };
  }

  function showEstimate(check, estimate) {
    followup.hidden = true;
    estimateSource.textContent = estimate.ai ? 'AI policy estimate' : 'Guided policy estimate';
    const summaries = {
      possible: ['A possible policy issue is worth checking', 'Save the wording and any evidence that supports the concern before reporting it.'],
      unclear: ['More evidence would help', 'The details provided leave the policy question open. Save any facts that could confirm what happened or ask us to take a closer look.'],
      feedback: ['This looks like customer feedback', 'Based on what you shared, the review appears to describe an experience or opinion. A low rating alone usually stays up. You can still check any separate concern with supporting evidence.']
    };
    const [title, next] = summaries[estimate.outcome];
    heading.textContent = title;
    advice.textContent = next;
    excerpt.textContent = estimate.excerpt || '';
    excerpt.hidden = !estimate.excerpt;

    const rows = estimate.keys.map(key => {
      const row = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = policies[key].title;
      const next = document.createElement('p');
      next.textContent = policies[key].next;
      row.append(title, next);
      return row;
    });
    findings.replaceChildren(...rows);
    findings.hidden = rows.length === 0;
    if (check.url) openReview.href = check.url.href;
    else openReview.removeAttribute('href');
    openReview.hidden = !check.url;
    googleGuide.href = estimate.keys.includes('extortion') ? extortion : reporting;
    googleGuide.textContent = estimate.keys.includes('extortion') ? 'Google’s review extortion guidance' : 'Google’s reporting and appeals guide';
    result.hidden = false;
    result.focus();
  }

  function openFollowup(check, title) {
    check.used += 1;
    followupStep.textContent = `Follow-up ${check.used} of ${maxFollowups}`;
    followupTitle.textContent = title;
    followupBody.replaceChildren();
    followup.hidden = false;
    followupTitle.focus();
  }

  function option(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', action, { once: true });
    return button;
  }

  function askForWording(check) {
    openFollowup(check, 'Can you paste the wording from the review?');
    const link = document.createElement('a');
    link.href = check.url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open the Google link ↗';
    const label = document.createElement('label');
    label.htmlFor = 'policy-follow-up-wording';
    label.textContent = 'Review wording';
    const wording = document.createElement('textarea');
    wording.id = label.htmlFor;
    wording.rows = 3;
    wording.maxLength = maxReviewLength;
    wording.spellcheck = false;
    wording.autocomplete = 'off';
    const next = option('Use this wording', () => { check.text = wording.value.trim(); assess(check); });
    next.disabled = true;
    wording.addEventListener('input', () => { next.disabled = !wording.value.trim(); });
    followupBody.append(link, label, wording, next, option('Rating only or wording unavailable', () => assess(check)));
  }

  async function aiEstimate(check, remaining) {
    // A review URL, form details or tracking identifiers are never part of this request.
    const text = check.text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email removed]')
      .replace(/(?:\+?1[ .-]?)?(?:\(\d{3}\)|\b\d{3})[ .-]?\d{3}[ .-]?\d{4}\b/g, '[phone removed]');
    const response = await fetch('/api/review-check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, remaining, answers: check.answers }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('Online estimate unavailable');
    const value = await response.json();
    if (!['possible', 'unclear', 'feedback'].includes(value?.outcome) || !Array.isArray(value.questions)) throw new Error('Invalid estimate');
    const answered = new Set(check.answers.map(answer => answer.id));
    return {
      ai: true, outcome: value.outcome, keys: Object.hasOwn(policies, value.policy) ? [value.policy] : [],
      questions: [...new Set(value.questions)].filter(id => Object.hasOwn(questions, id) && !answered.has(id)).slice(0, remaining),
      excerpt: typeof value.excerpt === 'string' && text.includes(value.excerpt) ? value.excerpt : ''
    };
  }

  function guidedEstimate(check) {
    const wording = check.text.replace(/[‘’]/gu, "'");
    const keys = Object.keys(policies).filter(key => policies[key].clue.test(wording));
    for (const answer of check.answers) {
      if (answer.answer === 'yes' && !keys.includes(questions[answer.id].policy)) keys.push(questions[answer.id].policy);
    }
    return { outcome: keys.length ? 'possible' : 'unclear', keys };
  }

  function askGuidedContext(check) {
    openFollowup(check, 'Is there another detail you can document?');
    const options = document.createElement('div');
    options.className = 'policy-follow-up-options';
    const choices = {
      experience: 'Wrong business, location or service', connection: 'Competitor or employee connection',
      duplicates: 'Matching posts from different accounts', incentive: 'An incentive to post the review',
      demand: 'A demand to remove the review', private: 'Exposed private information', threat: 'A specific threat'
    };
    for (const [id, label] of Object.entries(choices)) options.append(option(label, () => {
      check.answers.push({ id, answer: 'yes' });
      showEstimate(check, guidedEstimate(check));
    }));
    options.append(option('None that I can verify', () => showEstimate(check, guidedEstimate(check))));
    followupBody.append(options);
  }

  function askAiFollowups(check, queue) {
    const [id, ...remaining] = queue;
    openFollowup(check, questions[id].prompt);
    const options = document.createElement('div');
    options.className = 'policy-follow-up-options';
    for (const [label, answer] of [['Yes', 'yes'], ['No', 'no'], ['Not sure', 'unsure']]) options.append(option(label, () => {
      check.answers.push({ id, answer });
      if (remaining.length) askAiFollowups(check, remaining);
      else assess(check, true);
    }));
    followupBody.append(options);
  }

  async function assess(check, final = false) {
    if (check.busy || activeCheck !== check) return;
    followup.hidden = true;
    const remaining = maxFollowups - check.used;
    if (check.text) {
      check.busy = true;
      submit.disabled = true;
      status.textContent = 'Checking the review…';
      let estimate;
      try { estimate = await aiEstimate(check, final ? 0 : remaining); } catch { /* Continue using the guided check. */ }
      if (activeCheck !== check) return;
      check.busy = false;
      submit.disabled = false;
      status.textContent = '';
      if (estimate) {
        if (estimate.questions.length) askAiFollowups(check, estimate.questions);
        else showEstimate(check, estimate);
        return;
      }
    }
    const estimate = guidedEstimate(check);
    if (!final && remaining && estimate.outcome === 'unclear') askGuidedContext(check);
    else showEstimate(check, estimate);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const { text, url, hasLink } = readInput();
    if ((hasLink && !url) || (!text && !url)) {
      error.textContent = hasLink ? 'Use the link from Share review in Google Maps, or paste the review wording.' : 'Paste a Google review link or the review wording to start.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    if (text.length > maxReviewLength) {
      error.textContent = `Keep the review wording to ${maxReviewLength.toLocaleString('en-CA')} characters or fewer.`;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    result.hidden = true;
    activeCheck = { text, url, used: 0, answers: [], busy: false };
    if (!text && url) askForWording(activeCheck);
    else assess(activeCheck);
  });

  form.addEventListener('input', () => {
    activeCheck = undefined;
    result.hidden = true;
    followup.hidden = true;
    submit.disabled = false;
    status.textContent = '';
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });

  form.querySelector('fieldset').disabled = false;
})();
