(function (window, document) {
  'use strict';
  if (window.ReviewRemovalMeasurement) return;
  var config = window.ReviewRemovalMeasurementConfig || {};
  var gtm = /^GTM-[A-Z0-9]+$/.test(config.googleTagManagerId || '') ? config.googleTagManagerId : null;
  var managerGa4 = /^G-[A-Z0-9]+$/.test(config.tagManagerGa4MeasurementId || '') ? config.tagManagerGa4MeasurementId : null;
  var ga4 = /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId || '') ? config.ga4MeasurementId : null;
  var ads = /^AW-\d+$/.test(config.googleAdsId || '') ? config.googleAdsId : null;
  var label = /^[A-Za-z0-9_-]+$/.test(config.googleAdsLeadConversionLabel || '') ? config.googleAdsLeadConversionLabel : null;
  var key = 'reviewremoval.measurement.v1';
  var ttl = 180 * 24 * 60 * 60 * 1000;
  var preferences = { analytics: false, advertising: false };
  var loaded = false, initialized = false, viewed = false;
  var managerLoaded = false;
  var configured = new Set(), started = new WeakSet(), confirmed = new WeakSet(), recent = [];
  var privacySignal = window.navigator.globalPrivacyControl === true;
  var canonical;
  try { canonical = new URL(document.querySelector('link[rel="canonical"]').href); } catch (_) { canonical = new URL('https://reviewremoval.ca/404.html'); }
  // Use canonical paths, plus only the fixed public campaign below. Never copy
  // arbitrary query values, search terms, form fields or ad click identifiers.
  var canonicalSafe = canonical.origin === 'https://reviewremoval.ca' && !canonical.search && !canonical.hash &&
    /^\/(?:[a-z0-9-]+\.html|blog\/[a-z0-9-]+\.html)?$/.test(canonical.pathname);
  var pagePath = canonicalSafe ? canonical.pathname : '/404.html';
  var pageLocation = 'https://reviewremoval.ca' + pagePath;
  var chatgptCampaign = {
    utm_source: 'chatgpt', utm_medium: 'cpc', utm_campaign: 'google_review_removal_canada'
  };
  function hasChatgptCampaign(params) {
    return Object.keys(chatgptCampaign).every(function (key) {
      return params.getAll(key).length === 1 && params.get(key) === chatgptCampaign[key];
    });
  }
  if (hasChatgptCampaign(new URL(window.location.href).searchParams)) {
    pageLocation += '?' + new URLSearchParams(chatgptCampaign).toString();
  }
  var platforms = ['google','facebook','yelp','trustpilot','tripadvisor','booking.com','glassdoor','indeed'];
  var platform = String(document.body.dataset.platform || (pagePath === '/' ? 'google' : 'other')).toLowerCase();
  if (!platforms.includes(platform)) platform = 'other';
  var pageType = pagePath === '/' ? 'homepage' : pagePath === '/blog/index.html' ? 'blog_index' : pagePath.startsWith('/blog/') ? 'article' : document.body.dataset.platform ? 'platform' : 'other';
  // Avoid forwarding accidental form-data URLs through a provider's automatic collection.
  function safeVisitorUrl() {
    var url = new URL(window.location.href);
    if (pagePath === '/404.html') return false;
    var knownCampaign = hasChatgptCampaign(url.searchParams);
    var allowed = ['gclid','dclid','gbraid','wbraid','gad_source','gad_campaignid'];
    for (var entry of url.searchParams) {
      if (knownCampaign && Object.prototype.hasOwnProperty.call(chatgptCampaign, entry[0])) continue;
      // Tag Assistant adds these debug flags. They never grant consent or become event data.
      if (entry[0] === '_dbg' && entry[1] === '1') continue;
      if (entry[0] === 'gtm_debug' && /^\d{10,16}$/.test(entry[1])) continue;
      if (!allowed.includes(entry[0]) || !/^[A-Za-z0-9_-]{1,256}$/.test(entry[1])) return false;
    }
    if (url.hash && (!/^#[A-Za-z][A-Za-z0-9_-]{0,80}$/.test(url.hash) || !document.getElementById(url.hash.slice(1)))) return false;
    return canonicalSafe;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  function consent(analytics, advertising) {
    return { analytics_storage: analytics ? 'granted' : 'denied', ad_storage: advertising ? 'granted' : 'denied',
      ad_user_data: advertising ? 'granted' : 'denied', ad_personalization: 'denied' };
  }
  window.gtag('consent', 'default', consent(false, false));
  window.gtag('set', 'ads_data_redaction', true);
  // Empty user_data opts this site's events out of enhanced/user-provided data.
  // Never derive analytics data from assessment fields or customer records.
  window.gtag('set', 'user_data', '');
  window.gtag('set', 'allow_google_signals', false);
  window.gtag('set', 'allow_ad_personalization_signals', false);
  try {
    var stored = JSON.parse(window.localStorage.getItem(key));
    if (stored && stored.version === 1 && stored.expires > Date.now() && stored.expires <= Date.now() + ttl &&
        typeof stored.analytics === 'boolean' && typeof stored.advertising === 'boolean') {
      preferences = { analytics: stored.analytics, advertising: stored.advertising && !privacySignal };
    }
  } catch (_) { /* A blocked preference store must not break forms or imply consent. */ }
  function baseParameters() {
    return { page_location: pageLocation, page_referrer: '', page_title: 'ReviewRemoval', page_path: pagePath,
      page_type: pageType, service_platform: platform };
  }
  function initializeDestinations() {
    if (!safeVisitorUrl()) return;
    var wantsAnalytics = preferences.analytics && ga4, wantsAds = preferences.advertising && ads;
    if (!wantsAnalytics && !wantsAds) return;
    if (!initialized) { window.gtag('js', new Date()); initialized = true; }
    if (wantsAnalytics && !configured.has(ga4)) {
      window['ga-disable-' + ga4] = false;
      window.gtag('config', ga4, Object.assign(baseParameters(), { send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false })); configured.add(ga4);
    }
    if (wantsAds && !configured.has(ads)) {
      window.gtag('config', ads, Object.assign(baseParameters(), { allow_ad_personalization_signals: false })); configured.add(ads);
    }
    if (!loaded) {
      loaded = true;
      // The existing direct loader owns Ads (and any separately configured GA4 route).
      // The supplied GTM container has a different GA4 destination, not this Ads action.
      if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        var script = document.createElement('script'); script.id = 'reviewremoval-google-tag'; script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(wantsAnalytics ? ga4 : ads);
        document.head.appendChild(script);
      }
    }
  }
  function initializeTagManager() {
    // The published container is an Analytics container; analytics consent is required.
    if (!gtm || managerLoaded || !preferences.analytics || !safeVisitorUrl()) return;
    managerLoaded = true;
    window.gtag('set', Object.assign(baseParameters(), { user_data: '', allow_google_signals: false, allow_ad_personalization_signals: false }));
    var existing = Array.from(document.scripts).find(function (script) {
      try { var url = new URL(script.src); return url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtm.js' && url.searchParams.get('id') === gtm; } catch (_) { return false; }
    });
    if (!existing) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      var script = document.createElement('script');
      script.id = 'reviewremoval-tag-manager'; script.async = true;
      script.dataset.reviewremovalGtm = gtm;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtm);
      document.head.appendChild(script);
    }
  }
  function record(name, extra) {
    if (!preferences.analytics || !safeVisitorUrl()) return;
    var parameters = Object.assign(baseParameters(), extra || {});
    // This is an in-memory verification log, not persisted visitor history.
    recent.push(Object.freeze({ name: name, parameters: Object.freeze(parameters), sentToGA4: !!ga4 }));
    if (recent.length > 30) recent.shift();
    if (ga4) {
      initializeDestinations();
      window.gtag('event', name, Object.assign({}, parameters, { send_to: ga4 }));
    }
    if (gtm && managerLoaded) window.dataLayer.push(Object.assign({ event: 'reviewremoval_' + name }, parameters));
  }
  function clearOptionalCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!((!preferences.analytics && /^_(?:ga(?:_|$)|gid$|gat)/.test(name)) || (!preferences.advertising && /^_gcl_/.test(name)))) return;
      ['', window.location.hostname, '.' + window.location.hostname].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
      });
    });
  }
  function applyPreferences() {
    if (privacySignal) preferences.advertising = false;
    if (ga4) window['ga-disable-' + ga4] = !preferences.analytics;
    if (managerGa4) window['ga-disable-' + managerGa4] = !preferences.analytics;
    window.gtag('consent', 'update', consent(preferences.analytics, preferences.advertising));
    clearOptionalCookies();
    initializeDestinations();
    initializeTagManager();
    if (preferences.analytics && !viewed && safeVisitorUrl()) { viewed = true; record('page_view'); }
  }
  function savePreferences(analytics, advertising) {
    preferences = { analytics: analytics === true, advertising: advertising === true && !privacySignal };
    try { window.localStorage.setItem(key, JSON.stringify({ version: 1, analytics: preferences.analytics,
      advertising: preferences.advertising, expires: Date.now() + ttl })); } catch (_) {}
    applyPreferences();
  }
  function formStart(form) {
    if (!preferences.analytics || started.has(form)) return;
    started.add(form); record('quote_form_start', { form_id: 'review_assessment' });
  }
  function confirmedLead(form) {
    if (!form || form.id !== 'assessment-form' || confirmed.has(form)) return;
    confirmed.add(form); // No replay if consent is given after an unmeasured submission.
    record('generate_lead', { form_id: 'review_assessment' });
    if (preferences.advertising && ads && label && safeVisitorUrl()) {
      initializeDestinations();
      var id = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : window.crypto && window.crypto.getRandomValues ?
        Array.from(window.crypto.getRandomValues(new Uint32Array(4))).map(function (n) { return n.toString(16); }).join('-') : null;
      // CAD $1 is the nominal lead value in the supplied Ads snippet, not revenue.
      if (id) window.gtag('event', 'conversion', Object.assign(baseParameters(), {
        send_to: ads + '/' + label, value: 1, currency: 'CAD', transaction_id: id, user_data: ''
      }));
    }
  }
  function locationFor(link) {
    if (link.closest('.hero-actions')) return 'hero';
    if (link.closest('.site-header')) return 'header';
    if (link.closest('#pricing')) return 'pricing';
    if (link.closest('.site-footer')) return 'footer';
    if (link.closest('.home-closing')) return 'closing';
    return 'content';
  }
  document.addEventListener('click', function (event) {
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    var counter = target.closest('#assessment-form [data-qty-step]');
    if (counter && event.isTrusted) formStart(counter.closest('form'));
    var link = target.closest('a[href]'); if (!link) return;
    var href = link.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) { record('email_click', { contact_method: 'email' }); return; }
    if (/^tel:/i.test(href)) { record('phone_click', { contact_method: 'phone' }); return; }
    try {
      var url = new URL(href, window.location.href);
      if (url.origin === window.location.origin && url.hash === '#quote') {
        var targetPlatform = url.pathname === '/' || url.pathname === '/index.html' ? 'google' :
          url.pathname.match(/^\/remove-(facebook|yelp|trustpilot|tripadvisor|glassdoor|indeed|booking-com)-reviews\.html$/)?.[1];
        record('quote_cta_click', { cta_location: locationFor(link), service_platform: targetPlatform === 'booking-com' ? 'booking.com' : targetPlatform || platform });
      }
    } catch (_) {}
  });
  ['input', 'change'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      var field = event.target;
      if (event.isTrusted && field instanceof HTMLElement && field.closest('#assessment-form') && field.type !== 'hidden') formStart(field.closest('form'));
    });
  });
  // Only the confirmed JSON-success branch in script.js calls this API. No submit-click trigger.
  window.ReviewRemovalMeasurement = Object.freeze({
    confirmedLead: confirmedLead,
    status: function () { return { analyticsConsent: preferences.analytics, advertisingConsent: preferences.advertising,
      ga4Configured: !!ga4, adsLeadConfigured: !!(ads && label), googleTagRequested: loaded,
      tagManagerConfigured: !!gtm, tagManagerRequested: managerLoaded, urlEligible: safeVisitorUrl() }; },
    recentEvents: function () { return recent.slice(); }
  });
  applyPreferences();
  // No automatic banner. Visitors can manage optional measurement from the footer.
  var panel = document.createElement('section'); panel.id = 'measurement-preferences'; panel.setAttribute('aria-labelledby', 'measurement-title');
  panel.innerHTML = '<div class="measurement-inner"><h2 id="measurement-title">Cookie choices</h2><p>With your permission, Google tools use cookies and device identifiers to measure visits, enquiries and ads. Your request works without optional tracking. <a href="https://reviewremoval.ca/privacy-policy.html">Privacy policy</a>.</p><div class="measurement-actions"><button type="button" data-choice="accept">Accept optional</button><button type="button" data-choice="reject">Reject optional</button><button type="button" data-choice="customize" aria-expanded="false" aria-controls="measurement-options">Choose settings</button></div><div id="measurement-options" hidden><label><input type="checkbox" data-purpose="analytics"> Visit and enquiry analytics</label><label><input type="checkbox" data-purpose="advertising"> Advertising measurement (no ad personalization)</label><p class="measurement-signal" hidden>Your browser privacy signal keeps advertising measurement off.</p><button type="button" data-choice="save">Save choices</button></div><p class="measurement-status" role="status" aria-live="polite"></p></div>';
  panel.hidden = true;
  var skipLink = document.querySelector('body > .skip-link');
  if (skipLink) skipLink.after(panel); else document.body.prepend(panel);
  var returnFocus = null;
  panel.addEventListener('focusin', function (event) {
    if (event.relatedTarget instanceof HTMLElement && event.relatedTarget !== document.body && !panel.contains(event.relatedTarget)) returnFocus = event.relatedTarget;
  });
  var footer = document.querySelector('.footer-bottom') || document.querySelector('footer') || document.body;
  var settings = document.createElement('button'); settings.type = 'button'; settings.className = 'measurement-settings'; settings.textContent = 'Cookie choices'; settings.setAttribute('aria-controls', panel.id); settings.setAttribute('aria-expanded', 'false'); footer.appendChild(settings);
  var live = document.createElement('span'); live.className = 'measurement-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); footer.appendChild(live);
  var language = document.createElement('button'); language.type = 'button'; language.className = 'measurement-language'; panel.querySelector('.measurement-inner').prepend(language);
  var french = /^fr\b/i.test(window.navigator.language || '');
  function translate() {
    panel.lang = french ? 'fr-CA' : 'en-CA'; language.textContent = french ? 'English' : 'Français';
    settings.textContent = french ? 'Choix des témoins' : 'Cookie choices';
    panel.querySelector('h2').textContent = french ? 'Vos choix de témoins' : 'Cookie choices';
    panel.querySelector('p').innerHTML = french ? 'Avec votre accord, les outils Google utilisent des témoins et des identifiants d’appareil pour mesurer les visites, les demandes et la publicité. Votre demande fonctionne sans suivi facultatif. <a href="https://reviewremoval.ca/privacy-policy.html#confidentialite-fr">Confidentialité</a>.' : 'With your permission, Google tools use cookies and device identifiers to measure visits, enquiries and ads. Your request works without optional tracking. <a href="https://reviewremoval.ca/privacy-policy.html">Privacy policy</a>.';
    var labels = french ? { accept: 'Accepter les mesures', reject: 'Refuser les mesures', customize: 'Choisir les paramètres', save: 'Enregistrer' } :
      { accept: 'Accept optional', reject: 'Reject optional', customize: 'Choose settings', save: 'Save choices' };
    Object.keys(labels).forEach(function (choice) { panel.querySelector('[data-choice="' + choice + '"]').textContent = labels[choice]; });
    panel.querySelector('[data-purpose="analytics"]').parentElement.lastChild.textContent = french ? ' Mesure des visites et des demandes' : ' Visit and enquiry analytics';
    panel.querySelector('[data-purpose="advertising"]').parentElement.lastChild.textContent = french ? ' Mesure publicitaire (sans personnalisation)' : ' Advertising measurement (no ad personalization)';
    panel.querySelector('.measurement-signal').textContent = french ? 'Le signal de confidentialité de votre navigateur désactive la mesure publicitaire.' : 'Your browser privacy signal keeps advertising measurement off.';
  }
  language.addEventListener('click', function () { french = !french; translate(); }); translate();
  var analyticsInput = panel.querySelector('[data-purpose="analytics"]'), adsInput = panel.querySelector('[data-purpose="advertising"]');
  function syncInputs() { analyticsInput.checked = preferences.analytics; adsInput.checked = preferences.advertising; adsInput.disabled = privacySignal; panel.querySelector('.measurement-signal').hidden = !privacySignal; }
  function focusPanelControl(control) {
    control.focus({ preventScroll: true });
    var fieldBounds = control.getBoundingClientRect(), panelBounds = panel.getBoundingClientRect();
    if (fieldBounds.bottom > panelBounds.bottom - 16) panel.scrollTop += fieldBounds.bottom - panelBounds.bottom + 16;
    else if (fieldBounds.top < panelBounds.top + 16) panel.scrollTop += fieldBounds.top - panelBounds.top - 16;
  }
  function closePanel() {
    panel.hidden = true; settings.setAttribute('aria-expanded', 'false');
    panel.querySelector('#measurement-options').hidden = true;
    panel.querySelector('[data-choice="customize"]').setAttribute('aria-expanded', 'false');
    if (returnFocus && returnFocus.isConnected && returnFocus.getClientRects().length && !returnFocus.matches(':disabled')) returnFocus.focus({ preventScroll: true });
    else {
      var content = document.querySelector('main');
      if (content) {
        var temporaryFocus = !content.hasAttribute('tabindex');
        if (temporaryFocus) content.setAttribute('tabindex', '-1');
        content.focus({ preventScroll: true });
        if (temporaryFocus) content.addEventListener('blur', function () { content.removeAttribute('tabindex'); }, { once: true });
      }
    }
    returnFocus = null;
    live.textContent = french ? 'Vos choix ont été enregistrés.' : 'Your measurement choices have been saved.';
  }
  settings.addEventListener('click', function () { returnFocus = settings; syncInputs(); panel.hidden = false; panel.scrollTop = 0; settings.setAttribute('aria-expanded', 'true'); focusPanelControl(panel.querySelector('[data-choice="accept"]')); });
  panel.addEventListener('click', function (event) {
    var action = event.target.closest('[data-choice]'); if (!action) return;
    if (action.dataset.choice === 'customize') { syncInputs(); panel.querySelector('#measurement-options').hidden = false; action.setAttribute('aria-expanded', 'true'); focusPanelControl(analyticsInput); return; }
    if (action.dataset.choice === 'accept') savePreferences(true, true);
    else if (action.dataset.choice === 'reject') savePreferences(false, false);
    else savePreferences(analyticsInput.checked, adsInput.checked);
    closePanel();
  });
  window.addEventListener('storage', function (event) {
    if (event.key !== key) return;
    try { var value = JSON.parse(event.newValue); preferences = value && value.version === 1 && value.expires > Date.now() ?
      { analytics: value.analytics === true, advertising: value.advertising === true && !privacySignal } : { analytics: false, advertising: false }; } catch (_) { preferences = { analytics: false, advertising: false }; }
    applyPreferences(); syncInputs();
  });
})(window, document);
