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
const endpoint = 'https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec';
let submitting = false;

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

  const payload = new FormData(form);
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
  } catch (error) {
    message.className = 'form-message is-error';
    message.textContent = 'We could not confirm your request. Your details are still here; please wait a few minutes before trying again.';
    submitButton.disabled = false;
    submitButton.innerHTML = originalButton;
    submitting = false;
  } finally {
    window.clearTimeout(timer);
  }
});

updateQuote(1);
