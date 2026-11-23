(function () {
  'use strict';

  const form = document.getElementById('policy-check-form');
  const input = form.querySelector('textarea');
  const error = document.getElementById('policy-check-error');
  const result = document.getElementById('policy-check-result');
  const heading = document.getElementById('policy-result-title');
  const advice = document.getElementById('policy-result-advice');
  const findings = document.getElementById('policy-result-findings');
  const openReview = document.getElementById('policy-open-review');
  const googleGuide = document.getElementById('policy-google-guide');
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
      clue: /\b(?:i (?:was|got) paid to (?:write|post) (?:this|the) review|i(?:'ve| have) never (?:dealt with|interacted with|used) (?:this|your) (?:business|company|service))\b/iu
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

  function showResult(text, url) {
    const wording = text.replace(/[‘’]/gu, "'");
    const matches = Object.keys(policies).filter(key => policies[key].clue?.test(wording));

    if (matches.length) {
      heading.textContent = 'There’s a possible policy issue worth checking';
      advice.textContent = 'You have a specific place to start. Check the wording in context and save what supports the concern before you report it.';
    } else if (url && !text) {
      heading.textContent = 'You’re ready for the next step';
      advice.textContent = 'This looks like a Google share or Maps link. Open it, find the review, then paste its wording on a new line below the link and check again. If it’s a star rating with no text, you can ask for a free assessment with any details you have.';
    } else {
      heading.textContent = 'No clear policy issue from what you shared';
      advice.textContent = 'You still have options. Check for a detail the wording can’t settle, such as a wrong location or a reviewer’s connection to the business. If it describes a genuine experience, a thoughtful reply is a good place to start.';
    }

    const rows = matches.map(key => {
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
    if (url) openReview.href = url.href;
    else openReview.removeAttribute('href');
    openReview.hidden = !url;
    googleGuide.href = matches.includes('extortion') ? extortion : reporting;
    googleGuide.textContent = matches.includes('extortion') ? 'Google’s review extortion guidance' : 'Google’s reporting and appeals guide';
    result.hidden = false;
    result.focus();
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
    showResult(text, url);
  });

  form.addEventListener('input', () => {
    result.hidden = true;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });

  form.querySelector('fieldset').disabled = false;
})();
