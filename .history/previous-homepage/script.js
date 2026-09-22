const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  navigation.classList.toggle('is-open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  });
});

const form = document.querySelector('#assessment-form');
const message = document.querySelector('#form-message');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  const firstInvalid = [...form.querySelectorAll('[required]')].find((field) => !field.checkValidity());
  if (firstInvalid) {
    firstInvalid.setAttribute('aria-invalid', 'true');
    firstInvalid.focus();
    message.className = 'form-message is-error';
    message.textContent = 'Please complete the required fields with valid details.';
    return;
  }
  message.className = 'form-message is-success';
  message.textContent = 'The form design is ready. Submissions will be enabled once an inbox is connected.';
});
