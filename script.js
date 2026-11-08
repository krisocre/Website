// BEGIN LEAD TRAFFIC SOURCE
// Coarse visit attribution for the private lead record, never analytics events.
const leadTrafficSource = (() => {
  const storageKey = 'reviewremoval.lead-source.v1';
  const lifetime = 30 * 60 * 1000;
  const enteredAt = Date.now();
  const sources = ['paid_google', 'paid_other', 'organic_google', 'organic_bing', 'organic_other', 'referral'];
  const googleHosts = /(^|\.)google\.(com|ca|co\.uk|com\.au|fr|de|ie|co\.nz|co\.in)$/;
  const hostIs = (host, domain) => host === domain || host.endsWith('.' + domain);
  function detect() {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      for (const key of ['gclid', 'dclid', 'gbraid', 'wbraid']) {
        if (params.has(key)) return /^[A-Za-z0-9_-]{1,256}$/.test(params.get(key) || '') ? (key === 'dclid' ? 'paid_other' : 'paid_google') : 'unknown';
      }
      const medium = String(params.get('utm_medium') || '').trim().toLowerCase();
      const source = String(params.get('utm_source') || '').trim().toLowerCase();
      if (params.has('utm_medium')) {
        if (['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'paid-social', 'paid_social', 'paidsocial', 'display', 'cpm', 'cpv'].includes(medium)) {
          return source === 'google' ? 'paid_google' : 'paid_other';
        }
        if (medium === 'organic') return source === 'google' ? 'organic_google' : source === 'bing' ? 'organic_bing' : ['yahoo', 'duckduckgo', 'ecosia', 'brave'].includes(source) ? 'organic_other' : 'unknown';
        return ['referral', 'email', 'social'].includes(medium) ? 'referral' : 'unknown';
      }
      // Incomplete/ambiguous campaign tags must not turn an ad visit into organic.
      if (['utm_source', 'utm_campaign', 'gad_source', 'gad_campaignid'].some(key => params.has(key))) return 'unknown';
      if (!document.referrer) return 'direct';
      const referrer = new URL(document.referrer);
      if (!['http:', 'https:'].includes(referrer.protocol)) return 'unknown';
      const host = referrer.hostname.toLowerCase();
      const ownHosts = ['reviewremoval.ca', 'www.reviewremoval.ca'];
      if (referrer.origin === url.origin || (ownHosts.includes(host) && ownHosts.includes(url.hostname))) return 'internal';
      if (hostIs(host, 'googleadservices.com') || hostIs(host, 'googleads.g.doubleclick.net')) return 'paid_google';
      if (googleHosts.test(host)) return 'organic_google';
      if (hostIs(host, 'bing.com')) return 'organic_bing';
      if (hostIs(host, 'search.yahoo.com') || hostIs(host, 'duckduckgo.com') || hostIs(host, 'ecosia.org') || hostIs(host, 'search.brave.com')) return 'organic_other';
      return 'referral';
    } catch (_) { return 'unknown'; }
  }
  const entry = detect();
  let active = null;
  function allowed(source, consent) {
    return source.startsWith('paid_') ? consent.advertisingConsent === true : consent.analyticsConsent === true;
  }
  function clear() {
    active = null;
    try { window.sessionStorage.removeItem(storageKey); } catch (_) { /* Storage is optional. */ }
  }
  function get() {
    let consent;
    try { consent = window.ReviewRemovalMeasurement?.status(); } catch (_) { /* Fail closed for measurement, not the form. */ }
    if (!consent || (!consent.analyticsConsent && !consent.advertisingConsent)) { clear(); return 'unknown'; }
    const now = Date.now();
    if (sources.includes(entry)) {
      if (!allowed(entry, consent) || now >= enteredAt + lifetime) { clear(); return 'unknown'; }
      active = { source: entry, expires: enteredAt + lifetime };
      try { window.sessionStorage.setItem(storageKey, JSON.stringify(active)); } catch (_) { /* Current-page attribution still works. */ }
    } else if (entry === 'internal' || entry === 'direct') {
      if (!active) {
        try { active = JSON.parse(window.sessionStorage.getItem(storageKey)); } catch (_) { /* No stored source. */ }
      }
      if (!active || !sources.includes(active.source) || !allowed(active.source, consent) ||
          !Number.isFinite(active.expires) || active.expires <= now || active.expires > now + lifetime) {
        clear(); return 'unknown';
      }
    } else { clear(); return 'unknown'; }
    return active.source;
  }
  // Keep only a short-lived enum across this tab's navigation, after consent.
  get();
  window.addEventListener('pagehide', get);
  window.addEventListener('storage', event => { if (event.key === 'reviewremoval.measurement.v1') get(); });
  document.addEventListener('click', event => {
    if (event.target.closest?.('#measurement-preferences [data-choice]')) get();
  });
  return Object.freeze({ get });
})();
// END LEAD TRAFFIC SOURCE

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navigation.classList.toggle('is-open', open);
});

navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));

const platformBanner = document.querySelector('.home-page .platform-banner');
const platformList = platformBanner?.querySelector('.platform-list');
if (platformList) {
  // One accessible list; an inert visual copy keeps the single row looping.
  const loopCopy = platformList.cloneNode(true);
  loopCopy.setAttribute('aria-hidden', 'true');
  loopCopy.setAttribute('inert', '');
  loopCopy.querySelectorAll('a').forEach(link => {
    const label = document.createElement('span');
    label.textContent = link.textContent;
    link.replaceWith(label);
  });
  platformList.after(loopCopy);
  platformBanner.classList.add('is-ready');
}

const reviewerCard = document.querySelector('[data-reviewer-slider]');
if (reviewerCard) {
  const viewport = reviewerCard.querySelector('.reviewer-window');
  const slides = [...reviewerCard.querySelectorAll('.reviewer-slide')];
  const controls = reviewerCard.querySelector('.reviewer-controls');
  const dots = reviewerCard.querySelector('.reviewer-dots');
  const status = reviewerCard.querySelector('.reviewer-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let frame = 0;
  let timer = 0;
  let autoPlay = !reducedMotion.matches;
  let hovered = false;
  let visible = false;

  function updateRotation() {
    window.clearTimeout(timer);
    timer = 0;
    const running = autoPlay && !hovered && visible && !document.hidden;
    status.setAttribute('aria-live', running ? 'off' : 'polite');
    if (running) timer = window.setTimeout(() => {
      showSlide(current + 1);
      updateRotation();
    }, 5000);
  }
  function pauseRotation() {
    autoPlay = false;
    updateRotation();
  }

  function selectSlide(index, announce = true) {
    current = index;
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
      dots.children[i]?.setAttribute('aria-current', String(i === current));
    });
    if (announce) status.textContent = `${current + 1} of ${slides.length}: ${slides[current].dataset.reviewer}`;
  }
  function showSlide(index) {
    const next = (index + slides.length) % slides.length;
    const wrap = current === slides.length - 1 && next === 0;
    viewport.scrollTo({left: next * viewport.clientWidth, behavior: reducedMotion.matches || wrap ? 'instant' : 'smooth'});
  }

  if (slides.length > 1) {
    reviewerCard.setAttribute('aria-roledescription', 'carousel');
    slides.forEach((slide, index) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${index + 1} of ${slides.length}: ${slide.dataset.reviewer}`);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'reviewer-dot';
      dot.setAttribute('aria-label', `Show review from ${slide.dataset.reviewer}`);
      dot.setAttribute('aria-controls', viewport.id);
      dot.addEventListener('click', () => { pauseRotation(); showSlide(index); });
      dots.append(dot);
    });
    controls.hidden = false;
    selectSlide(0, false);
    // Once a visitor focuses or selects a review, leave navigation in their hands.
    reviewerCard.addEventListener('focusin', pauseRotation);
    reviewerCard.addEventListener('mouseenter', () => { hovered = true; updateRotation(); });
    reviewerCard.addEventListener('mouseleave', () => { hovered = false; updateRotation(); });
    viewport.addEventListener('pointerdown', pauseRotation, {passive: true});
    document.addEventListener('visibilitychange', updateRotation);
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) pauseRotation();
      else updateRotation();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].intersectionRatio >= 0.2;
        updateRotation();
      }, {threshold: 0.2}).observe(reviewerCard);
    } else { visible = true; updateRotation(); }
    viewport.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      pauseRotation();
      showSlide(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    viewport.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
        if (index !== current) selectSlide(index);
      });
    }, {passive: true});
    new ResizeObserver(() => {
      viewport.scrollTo({left: current * viewport.clientWidth, behavior: 'instant'});
    }).observe(viewport);
  }
}

const quantityInputs = [...document.querySelectorAll('#priceQuantity, #formQuantity')];
const platformName = document.body.dataset.platform || 'Google';
const reviewNoun = document.body.dataset.reviewNoun || 'review';
const reviewNounPlural = document.body.dataset.reviewNounPlural || 'reviews';
const dollars = value => `$${value.toLocaleString('en-CA')}`;
const clamp = value => Math.max(1, Math.min(50, Math.round(Number(value) || 1)));

function updateQuote(value) {
  const count = clamp(value);
  quantityInputs.forEach(input => { input.value = String(count); });
  document.querySelectorAll('[data-count]').forEach(node => { node.textContent = String(count); });
  document.querySelectorAll('[data-quote="start"]').forEach(node => { node.textContent = dollars(count * 50); });
  document.querySelectorAll('[data-quote="success"]').forEach(node => { node.textContent = dollars(count * 125); });
  document.querySelectorAll('[data-quote="total"]').forEach(node => { node.textContent = dollars(count * 175); });
  const label = document.querySelector('[data-review-label]');
  if (label) label.textContent = `${count} ${count === 1 ? reviewNoun : reviewNounPlural}`;
  const plan = document.querySelector('#selectedPlan');
  if (plan) plan.value = `ReviewRemoval - ${platformName} Review Removal - ${count} ${count === 1 ? reviewNoun : reviewNounPlural} - CAD $${count * 50} upfront + CAD $125 per successful removal (CAD $${count * 175} if all removed)`;
}

quantityInputs.forEach(input => {
  input.addEventListener('input', () => {
    if (input.value !== '' && input.checkValidity()) updateQuote(input.value);
  });
  input.addEventListener('change', () => updateQuote(input.value));
});

document.querySelectorAll('[data-qty-step]').forEach(button => button.addEventListener('click', () => {
  const input = document.getElementById(button.dataset.target);
  updateQuote(clamp(input.value) + Number(button.dataset.qtyStep));
}));

// BEGIN LEAD INPUT RULES
// Keep this pure validation function identical in the browser and Apps Script.
// It uses no browser/Node APIs; Apps Script's V8 runtime can execute it directly.
function leadInputErrors(data, requireReviewCount) {
  var errors = {};
  function text(name) { return typeof data[name] === 'string' ? data[name].trim() : ''; }
  function blockedEmail(address) {
    var domain = address.toLowerCase().split('@').pop().replace(/\.+$/, '');
    return domain === 'fldubai.com' || domain.slice(-12) === '.fldubai.com';
  }
  var name = text('full_name');
  if (!name) errors.full_name = 'Enter your name.';
  else if (data.full_name.length > 150) errors.full_name = 'Keep your name to 150 characters or fewer.';
  else if (/[$\uFE69\uFF04\u0000-\u001F\u007F]|https?:\/\/|www\./i.test(data.full_name) || !/\p{L}/u.test(name)) {
    errors.full_name = 'Enter your name without links, dollar signs or line breaks.';
  }
  var business = text('business_name');
  if (!business) errors.business_name = 'Enter your business name.';
  else if (data.business_name.length > 250) errors.business_name = 'Keep the business name to 250 characters or fewer.';
  else if (/[\u0000-\u001F\u007F]|https?:\/\//i.test(data.business_name)) errors.business_name = 'Enter a business name without web links or line breaks.';

  var contact = text('contact_detail');
  var email = text('email_address') || text('email') || ((/^Email\b/i.test(text('contact_method')) || contact.indexOf('@') !== -1) ? contact : '');
  if (!email || email.length > 254 || /[\u0000-\u0020\u007F]/.test(email) || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) errors.email_address = 'Enter a valid email address.';
  else if (blockedEmail(email) || (contact.indexOf('@') !== -1 && blockedEmail(contact))) errors.email_address = 'Please use a different email address.';

  var count = text('review_count') || text('reviews_to_remove') || text('review_quantity');
  if ((requireReviewCount || count) && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 50)) {
    errors.review_count = 'Enter a whole number of reviews from 1 to 50.';
  }
  var profile = text('business_url');
  if (profile) {
    var parts = profile.match(/^https?:\/\/([^\s/?#]+)(?:[/?#][^\s]*)?$/i);
    if (profile.length > 2048 || !parts || /[@<>"\\]/.test(parts[1])) errors.business_url = 'Enter a valid public profile URL.';
    else {
      var decoded = profile;
      try { decoded = decodeURIComponent(profile); } catch (_) { /* Format checks above still apply. */ }
      if (/^https?:\/\/(?:www\.)?google\.com\/share\.google(?:[/?#]|$)/i.test(decoded)) {
        errors.business_url = 'Use a direct business profile or review link instead of this redirect link.';
      }
    }
  }
  if (text('phone_number').length > 80 || text('phone').length > 80) errors.phone_number = 'Keep the phone number to 80 characters or fewer.';
  if (text('review_links').length > 12000) errors.review_links = 'Keep review details to 12,000 characters or fewer.';
  if (text('reason').length > 20000) errors.reason = 'Keep additional details to 20,000 characters or fewer.';
  return errors;
}
// END LEAD INPUT RULES

const form = document.querySelector('#assessment-form');
const message = document.querySelector('#form-message');
const submitButton = form?.querySelector('.submit-button');
const successPanel = document.querySelector('#submission-success');
const endpoint = 'https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec';
let submitting = false;
// Validate current values in the submit handler, including autofill corrections.
// Native input validity still supplies accessible messages; no-JS HTML is unchanged.
if (form) form.noValidate = true;

const leadFields = ['full_name', 'business_name', 'email_address', 'phone_number', 'business_url', 'review_count', 'review_links', 'reason'];
function refreshLeadInputValidity() {
  const errors = leadInputErrors(Object.fromEntries(new FormData(form)), true);
  leadFields.forEach(name => form.elements.namedItem(name)?.setCustomValidity(errors[name] || ''));
  return errors;
}
form?.addEventListener('input', refreshLeadInputValidity);
form?.addEventListener('change', refreshLeadInputValidity);

// Load only on pages with a quote form, when the visitor approaches or uses it.
// The server independently verifies the token; this UI is not a security boundary.
const assessmentVerification = form ? setupAssessmentVerification() : null;

function setupAssessmentVerification() {
  const container = document.querySelector('#assessment-verification');
  const status = document.querySelector('#verification-status');
  const retry = document.querySelector('#verification-retry');
  let widgetId = null;
  let token = '';
  let loader = null;
  let loadTimer = 0;
  let size = '';

  function showStatus(text, failed = false) {
    status.textContent = text;
    retry.hidden = !failed;
  }
  function failed() {
    token = '';
    showStatus('The security check could not finish. Please retry the check.', true);
  }
  function render() {
    if (widgetId !== null || !window.turnstile) return;
    size = container.clientWidth < 300 ? 'compact' : 'flexible';
    container.style.minHeight = size === 'compact' ? '140px' : '65px';
    try {
      widgetId = window.turnstile.render(container, {
        sitekey: container.dataset.sitekey,
        action: 'quote_request',
        theme: 'light',
        size,
        callback(value) {
          token = value;
          showStatus('Security check complete.');
        },
        'expired-callback'() {
          token = '';
          showStatus('Security check expired. Please retry the check.', true);
        },
        'error-callback'() { failed(); return true; },
        'timeout-callback': failed,
        'unsupported-callback': failed
      });
    } catch (_) { failed(); }
  }
  function load() {
    if (!container || !status || !retry) return;
    if (window.turnstile) { render(); return; }
    if (loader) return;
    showStatus('Checking your browser securely…');
    loader = document.createElement('script');
    loader.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    loader.async = true;
    loader.defer = true;
    loader.onload = () => { clearTimeout(loadTimer); render(); };
    loader.onerror = () => {
      clearTimeout(loadTimer);
      loader.remove();
      loader = null;
      failed();
    };
    loadTimer = window.setTimeout(failed, 15000);
    document.head.append(loader);
  }
  function reset() {
    token = '';
    if (widgetId !== null && window.turnstile) {
      showStatus('Checking your browser securely…');
      // A visitor can rotate their phone while the submission is in flight.
      if (!form.hidden && (container.clientWidth < 300 ? 'compact' : 'flexible') !== size) {
        window.turnstile.remove(widgetId);
        widgetId = null;
        render();
        return;
      }
      try { window.turnstile.reset(widgetId); } catch (_) { failed(); }
    } else { load(); }
  }
  if (container && status && retry) {
    retry.addEventListener('click', () => {
      if (submitting) return;
      if (loader && !window.turnstile) {
        clearTimeout(loadTimer);
        loader.remove();
        loader = null;
      }
      reset();
    });
    form.addEventListener('focusin', load, {once: true});
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { load(); observer.disconnect(); }
      }, {rootMargin: '300px'});
      observer.observe(form);
    } else { load(); }
    new ResizeObserver(() => {
      const nextSize = container.clientWidth < 300 ? 'compact' : 'flexible';
      if (widgetId === null || nextSize === size || submitting) return;
      token = '';
      window.turnstile.remove(widgetId);
      widgetId = null;
      render();
    }).observe(container);
  }
  return {
    getToken: () => token,
    reset,
    prompt() {
      load();
      container?.focus();
      message.className = 'form-message is-error';
      message.textContent = 'Please complete the security check before sending your request.';
    }
  };
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  refreshLeadInputValidity();
  const firstInvalid = [...form.querySelectorAll('input, textarea, select')].find(field => !field.checkValidity());
  if (firstInvalid) {
    firstInvalid.setAttribute('aria-invalid', 'true');
    firstInvalid.focus();
    message.className = 'form-message is-error';
    message.textContent = firstInvalid.validationMessage || 'Please check the highlighted details.';
    firstInvalid.reportValidity();
    return;
  }
  updateQuote(document.querySelector('#formQuantity').value);

  const verificationToken = assessmentVerification.getToken();
  if (!verificationToken) { assessmentVerification.prompt(); return; }
  const payload = new FormData(form);
  payload.set('cf-turnstile-response', verificationToken);
  payload.set('traffic_source', leadTrafficSource.get());
  window.SubmissionTerms?.prepare(payload);
  payload.set('contact_detail', String(payload.get('email_address') || ''));
  payload.set('review_count', String(clamp(payload.get('review_count'))));
  const count = Number(payload.get('review_count'));
  const originalButton = submitButton.innerHTML;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 60000);
  submitting = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending your request…';
  message.className = 'form-message';
  message.textContent = 'Sending your request…';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: new URLSearchParams(payload),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('unconfirmed');
    const result = await response.json();
    if (result.code === 'verification_failed') throw new Error('verification_failed');
    if (result.code === 'invalid_input') {
      const inputError = new Error('invalid_input');
      inputError.field = leadFields.includes(result.field) ? result.field : null;
      throw inputError;
    }
    const notificationFailed = (result.result === 'success' && result.notification_sent === false) ||
      (result.result === 'error' && /failed to send email:\s*no recipient/i.test(result.error || ''));
    if (result.result !== 'success' && !notificationFailed) throw new Error('unconfirmed');

    document.querySelector('#success-copy').textContent = notificationFailed
      ? `Your request for ${count} ${count === 1 ? reviewNoun : reviewNounPlural} was saved, but the notification email was not sent.`
      : `We have your review details and the quote for ${count} ${count === 1 ? reviewNoun : reviewNounPlural}. We'll contact you at the email you provided with the next step.`;
    document.querySelector('#success-note').textContent = notificationFailed
      ? 'Please keep a copy of your details and follow up with us if needed.'
      : '';
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
    // Only explicit backend success confirms a lead. A legacy mail-error string
    // may show a warning above, but is not sufficient conversion evidence.
    if (result.result === 'success') {
      try { window.ReviewRemovalMeasurement?.confirmedLead(form); } catch (_) { /* Measurement must never block an enquiry. */ }
    }
  } catch (error) {
    message.className = 'form-message is-error';
    message.textContent = error.message === 'verification_failed'
      ? 'The security check was not accepted. Your details are still here; complete the new check and try again.'
      : error.message === 'invalid_input'
      ? 'Please check your details and try again. Your answers are still here.'
      : 'We could not confirm your request. Your details are still here; please wait a few minutes before trying again.';
    if (error.message === 'invalid_input' && error.field) {
      const invalid = form.elements.namedItem(error.field);
      const errors = leadInputErrors(Object.fromEntries(new FormData(form)), true);
      invalid?.setCustomValidity(errors[error.field] || message.textContent);
      invalid?.setAttribute('aria-invalid', 'true');
      invalid?.focus();
      invalid?.reportValidity();
    }
    submitButton.disabled = false;
    submitButton.innerHTML = originalButton;
    submitting = false;
  } finally {
    window.clearTimeout(timer);
    // Tokens are single-use, including when a request fails after verification.
    assessmentVerification.reset();
  }
});

updateQuote(1);
