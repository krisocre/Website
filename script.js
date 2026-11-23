// BEGIN LEAD TRAFFIC SOURCE
// Coarse visit attribution for the private lead record, never analytics events.
const leadTrafficSource = (() => {
  const storageKey = 'reviewremoval.lead-source.v1';
  const lifetime = 30 * 60 * 1000;
  const enteredAt = Date.now();
  const sources = ['paid_google', 'paid_chatgpt', 'paid_other', 'organic_google', 'organic_bing', 'organic_other', 'referral'];
  const googleHosts = /(^|\.)google\.(com|ca|co\.uk|com\.au|fr|de|ie|co\.nz|co\.in)$/;
  const hostIs = (host, domain) => host === domain || host.endsWith('.' + domain);
  function detect() {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      for (const key of ['gclid', 'dclid', 'gbraid', 'wbraid']) {
        if (params.has(key)) return /^[A-Za-z0-9_-]{1,256}$/.test(params.get(key) || '') ? (key === 'dclid' ? 'paid_other' : 'paid_google') : 'unknown';
      }
      // Google also uses aggregate campaign indicators when a click ID is absent.
      for (const key of ['gad_source', 'gad_campaignid']) {
        if (params.has(key)) return /^[1-9]\d{0,19}$/.test(params.get(key) || '') ? 'paid_google' : 'unknown';
      }
      const medium = String(params.get('utm_medium') || '').trim().toLowerCase();
      const source = String(params.get('utm_source') || '').trim().toLowerCase();
      if (params.has('utm_medium')) {
        if (['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'paid-social', 'paid_social', 'paidsocial', 'display', 'cpm', 'cpv'].includes(medium)) {
          return source === 'google' ? 'paid_google' : ['chatgpt', 'chatgpt.com'].includes(source) ? 'paid_chatgpt' : 'paid_other';
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
    if (window.navigator?.globalPrivacyControl === true) { clear(); return 'unknown'; }
    const now = Date.now();
    // A source hint attached to a deliberate enquiry is separate from Google
    // tracking. Before a choice, use only this page's context, without storage.
    // Explicit opt-outs still use the existing purpose checks below.
    if (consent?.choiceRecorded === false) {
      clear();
      return sources.includes(entry) && now < enteredAt + lifetime ? entry : 'unknown';
    }
    if (!consent || (!consent.analyticsConsent && !consent.advertisingConsent)) { clear(); return 'unknown'; }
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
  function label(source) {
    const labels = {
      paid_google: 'Paid - Google Ads', paid_chatgpt: 'Paid - ChatGPT Ads', paid_other: 'Paid - Other campaign',
      organic_google: 'Organic - Google', organic_bing: 'Organic - Bing',
      organic_other: 'Organic - Other search', referral: 'Referral / other'
    };
    return Object.prototype.hasOwnProperty.call(labels, source) ? labels[source] : 'Direct / unknown';
  }
  return Object.freeze({ get, label });
})();
// END LEAD TRAFFIC SOURCE

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
const frenchPage = document.documentElement.lang === 'fr-CA';
const pageText = (english, french) => frenchPage ? french : english;
const openMenu = pageText('Open menu', 'Ouvrir le menu');
const closeMenu = pageText('Close menu', 'Fermer le menu');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? closeMenu : openMenu);
  navigation.classList.toggle('is-open', open);
});

navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', openMenu);
}));

const platformBanner = document.querySelector('.home-page .platform-banner');
const platformList = platformBanner?.querySelector('.platform-list');
if (platformList) {
  // Keep both visual runs clickable while exposing one set of links to keyboard and screen reader users.
  const loopCopy = platformList.cloneNode(true);
  loopCopy.setAttribute('aria-hidden', 'true');
  loopCopy.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
  platformBanner.addEventListener('mousedown', event => {
    // Pointer focus would stop the loop and move the link between press and release.
    if (event.target.closest('a')) event.preventDefault();
  });
  platformList.after(loopCopy);
  platformBanner.classList.add('is-ready');
}

const quantityInputs = [...document.querySelectorAll('#priceQuantity, #formQuantity')];
const quantitySteps = [...document.querySelectorAll('[data-qty-step]')];
const quantityPresets = [...document.querySelectorAll('[data-review-count]')];
const platformName = document.body.dataset.platform || 'Google';
const reviewNoun = document.body.dataset.reviewNoun || 'review';
const reviewNounPlural = document.body.dataset.reviewNounPlural || 'reviews';
const frenchDollars = frenchPage ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }) : null;
const dollars = value => frenchDollars ? frenchDollars.format(value) : `$${value.toLocaleString('en-CA', { useGrouping: true })}`;
const clamp = value => Math.max(1, Math.min(50, Math.round(Number(value) || 1)));
let selectedCount;

function updateQuote(value, editingInput) {
  const count = clamp(value);
  quantityInputs.forEach(input => {
    if (input !== editingInput && input.value !== String(count)) input.value = String(count);
  });
  if (count === selectedCount) return;
  selectedCount = count;
  quantitySteps.forEach(button => { button.disabled = count === (Number(button.dataset.qtyStep) < 0 ? 1 : 50); });
  quantityPresets.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.reviewCount) === count)));
  document.querySelectorAll('[data-count]').forEach(node => { node.textContent = String(count); });
  document.querySelectorAll('[data-quote="start"]').forEach(node => { node.textContent = dollars(count * 50); });
  document.querySelectorAll('[data-quote="success"]').forEach(node => { node.textContent = dollars(count * 125); });
  document.querySelectorAll('[data-quote="total"]').forEach(node => { node.textContent = dollars(count * 175); });
  const label = document.querySelector('[data-review-label]');
  if (label) label.textContent = `${count} ${pageText(count === 1 ? reviewNoun : reviewNounPlural, 'avis')}`;
  const plan = document.querySelector('#selectedPlan');
  if (plan) plan.value = `ReviewRemoval - ${platformName} Review Removal - ${count} ${count === 1 ? reviewNoun : reviewNounPlural} - CAD $${count * 50} upfront + CAD $125 per successful removal (CAD $${count * 175} if all removed)`;
}

quantityInputs.forEach(input => {
  input.addEventListener('input', () => {
    const count = input.valueAsNumber;
    if (Number.isInteger(count) && count >= 1 && count <= 50) updateQuote(count, input);
  });
  input.addEventListener('change', () => updateQuote(input.value || selectedCount));
  input.addEventListener('blur', () => {
    if (input.value === '') updateQuote(selectedCount);
  });
});

quantitySteps.forEach(button => button.addEventListener('click', () => {
  updateQuote(selectedCount + Number(button.dataset.qtyStep));
}));
quantityPresets.forEach(button => button.addEventListener('click', () => updateQuote(button.dataset.reviewCount)));

// BEGIN LEAD INPUT RULES
// Required fields and basic field formats only; do not judge lead content.
// Keep this pure function identical in the browser and Apps Script.
function leadInputErrors(data, requireReviewCount) {
  var errors = {};
  function text(name) { return typeof data[name] === 'string' ? data[name].trim() : ''; }
  var name = text('full_name');
  if (!name) errors.full_name = 'Enter your name.';
  var business = text('business_name');
  if (!business) errors.business_name = 'Enter your business name.';

  var contact = text('contact_detail');
  var email = text('email_address') || text('email') || ((/^Email\b/i.test(text('contact_method')) || contact.indexOf('@') !== -1) ? contact : '');
  if (!email || email.length > 254 || /[\u0000-\u0020\u007F]/.test(email) || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) errors.email_address = 'Enter a valid email address.';

  var count = text('review_count') || text('reviews_to_remove') || text('review_quantity');
  if ((requireReviewCount || count) && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 50)) {
    errors.review_count = 'Enter a whole number of reviews from 1 to 50.';
  }
  // Names, phone, business_url, review_links and reason have no content filters.
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
const frenchInputMessages = {
  full_name: 'Indiquez votre nom.',
  business_name: 'Indiquez le nom de votre entreprise.',
  email_address: 'Indiquez une adresse courriel valide.',
  review_count: 'Inscrivez un nombre entier de 1 à 50 avis.'
};
function fieldMessage(name, english) {
  return english && frenchPage ? frenchInputMessages[name] || english : english;
}
function refreshLeadInputValidity() {
  const errors = leadInputErrors(Object.fromEntries(new FormData(form)), true);
  leadFields.forEach(name => form.elements.namedItem(name)?.setCustomValidity(fieldMessage(name, errors[name]) || ''));
  return errors;
}
form?.addEventListener('input', refreshLeadInputValidity);
form?.addEventListener('change', refreshLeadInputValidity);

// Load only on pages with a quote form, when the visitor approaches or uses it.
// The server independently verifies the token; this UI is not a security boundary.
// Protection restored. Publish this frontend before enabling the backend check.
const TURNSTILE_PAUSED = false;
const assessmentVerification = form && !TURNSTILE_PAUSED ? setupAssessmentVerification() : null;
if (form && TURNSTILE_PAUSED) {
  document.querySelector('.form-verification')?.setAttribute('hidden', '');
}

function setupAssessmentVerification() {
  const container = document.querySelector('#assessment-verification');
  const status = document.querySelector('#verification-status');
  const retry = document.querySelector('#verification-retry');
  let widgetId = null;
  let token = '';
  let loader = null;
  let loadTimer = 0;
  let size = '';
  const checking = pageText('Checking your browser securely…', 'Vérification de votre navigateur…');

  function showStatus(text, failed = false) {
    status.textContent = text;
    retry.hidden = !failed;
  }
  function failed() {
    token = '';
    showStatus(pageText('The security check could not finish. Please retry the check.', 'La vérification de sécurité n’a pas abouti. Veuillez réessayer.'), true);
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
        language: pageText('auto', 'fr'),
        size,
        callback(value) {
          token = value;
          showStatus(pageText('Security check complete.', 'Vérification de sécurité terminée.'));
        },
        'expired-callback'() {
          token = '';
          showStatus(pageText('Security check expired. Please retry the check.', 'La vérification de sécurité a expiré. Veuillez réessayer.'), true);
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
    showStatus(checking);
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
      showStatus(checking);
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
      message.textContent = pageText('Please complete the security check before sending your request.', 'Terminez la vérification de sécurité avant d’envoyer votre demande.');
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
    message.textContent = firstInvalid.validationMessage || pageText('Please check the highlighted details.', 'Vérifiez les champs indiqués.');
    firstInvalid.reportValidity();
    return;
  }
  updateQuote(document.querySelector('#formQuantity').value);

  const verificationToken = assessmentVerification?.getToken() || '';
  if (!TURNSTILE_PAUSED && !verificationToken) { assessmentVerification.prompt(); return; }
  const payload = new FormData(form);
  if (TURNSTILE_PAUSED) payload.delete('cf-turnstile-response');
  else payload.set('cf-turnstile-response', verificationToken);
  const trafficSource = leadTrafficSource.get();
  payload.set('traffic_source', trafficSource);
  window.SubmissionTerms?.prepare(payload);
  // Older handlers already save/email Reason, even if they ignore traffic_source.
  payload.set('reason', '[Traffic Source: ' + leadTrafficSource.label(trafficSource) + ']\n' + String(payload.get('reason') || ''));
  payload.set('contact_detail', String(payload.get('email_address') || ''));
  payload.set('review_count', String(clamp(payload.get('review_count'))));
  const count = Number(payload.get('review_count'));
  const originalButton = submitButton.innerHTML;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 60000);
  submitting = true;
  submitButton.disabled = true;
  submitButton.textContent = pageText('Sending your request…', 'Envoi de votre demande…');
  message.className = 'form-message';
  message.textContent = submitButton.textContent;

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
      ? pageText(`Your request for ${count} ${count === 1 ? reviewNoun : reviewNounPlural} was saved, but the notification email was not sent.`, `Votre demande pour ${count} avis a été enregistrée. Le courriel de notification n’a pas pu être envoyé.`)
      : pageText(`We have your review details and the quote for ${count} ${count === 1 ? reviewNoun : reviewNounPlural}. We'll contact you at the email you provided with the next step.`, `Nous avons reçu les renseignements concernant vos ${count} avis. Nous vous indiquerons la prochaine étape par courriel.`);
    document.querySelector('#success-note').textContent = notificationFailed
      ? pageText('Please keep a copy of your details and follow up with us if needed.', 'Gardez une copie de vos renseignements pour pouvoir faire un suivi au besoin.')
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
      ? pageText('The security check was not accepted. Your details are still here; complete the new check and try again.', 'La vérification de sécurité a échoué. Vos renseignements sont toujours dans le formulaire. Terminez la nouvelle vérification, puis réessayez.')
      : error.message === 'invalid_input'
      ? pageText('Please check your details and try again. Your answers are still here.', 'Vérifiez vos renseignements, puis réessayez. Vos réponses sont toujours dans le formulaire.')
      : pageText('We could not confirm your request. Your details are still here; please wait a few minutes before trying again.', 'Nous n’avons pas pu confirmer votre demande. Vos renseignements sont toujours dans le formulaire. Attendez quelques minutes avant de réessayer.');
    if (error.message === 'invalid_input' && error.field) {
      const invalid = form.elements.namedItem(error.field);
      const errors = leadInputErrors(Object.fromEntries(new FormData(form)), true);
      invalid?.setCustomValidity(fieldMessage(error.field, errors[error.field]) || message.textContent);
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
    assessmentVerification?.reset();
  }
});

updateQuote(1);
