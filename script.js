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

const form = document.querySelector('#assessment-form');
const message = document.querySelector('#form-message');
const submitButton = form?.querySelector('.submit-button');
const successPanel = document.querySelector('#submission-success');
const endpoint = 'https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec';
let submitting = false;

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
  updateQuote(document.querySelector('#formQuantity').value);
  const firstInvalid = [...form.querySelectorAll('[required]')].find(field => !field.checkValidity());
  if (firstInvalid) {
    firstInvalid.setAttribute('aria-invalid', 'true');
    firstInvalid.focus();
    message.className = 'form-message is-error';
    message.textContent = 'Please complete the required fields with valid details.';
    return;
  }

  const verificationToken = assessmentVerification.getToken();
  if (!verificationToken) { assessmentVerification.prompt(); return; }
  const payload = new FormData(form);
  payload.set('cf-turnstile-response', verificationToken);
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
      : 'We could not confirm your request. Your details are still here; please wait a few minutes before trying again.';
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
