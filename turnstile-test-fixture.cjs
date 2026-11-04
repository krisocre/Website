// Browser-only test double. Never loaded by production pages; no Cloudflare traffic.
function fixture() {
  let options, input, container, counter = 0;
  const state = window.__turnstileFixture = {token: '', resets: 0, renders: 0, auto: true};
  function clear() { state.token = ''; if (input) input.value = ''; }
  state.solve = () => {
    state.token = 'LOCAL_TEST_TOKEN_' + (++counter);
    input.value = state.token;
    options.callback(state.token);
  };
  state.expire = () => { clear(); options['expired-callback'](); };
  state.fail = () => { clear(); options['error-callback']('TEST_ONLY'); };
  window.turnstile = {
    render(element, config) {
      options = config; container = element; state.renders++;
      state.action = config.action; state.sitekey = config.sitekey;
      input = document.createElement('input'); input.type = 'hidden'; input.name = 'cf-turnstile-response';
      container.append(input);
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `width:${config.size === 'compact' ? '150px' : '100%'};min-width:${config.size === 'compact' ? '150px' : '300px'};height:${config.size === 'compact' ? '140px' : '65px'};background:#f8f8f8;border:1px solid #ddd;box-sizing:border-box`;
      placeholder.textContent = 'Security check (local test)'; container.append(placeholder);
      if (state.auto) queueMicrotask(state.solve);
      return 'local-widget';
    },
    reset(id) {
      if (id !== 'local-widget') throw Error('Incorrect widget ID');
      state.resets++; clear(); if (state.auto) queueMicrotask(state.solve);
    },
    remove(id) {
      if (id !== 'local-widget') throw Error('Incorrect widget ID');
      clear(); container.replaceChildren();
    }
  };
}
const turnstileApiFixture = '(' + fixture.toString() + ')();';
const isTurnstileApi = url => url.startsWith('https://challenges.cloudflare.com/turnstile/v0/api.js');
async function completeSecurityCheck(page) {
  await page.focus('#assessment-form [name="full_name"]');
  await page.waitForFunction(() => Boolean(window.__turnstileFixture?.token));
}
module.exports = {turnstileApiFixture, isTurnstileApi, completeSecurityCheck};
