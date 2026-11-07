/* Clear Pro Pools: reuse the original GTM container and its existing phone_click tag. */
(function () {
  'use strict';
  if (window.cppTracking) return;
  var query = new URLSearchParams(window.location.search);
  var internal = false;
  var test = query.get('cpp_test') === '1';
  try {
    if (query.get('cpp_internal') === '1') localStorage.setItem('cpp_internal', '1');
    if (query.get('cpp_internal') === '0') localStorage.removeItem('cpp_internal');
    internal = localStorage.getItem('cpp_internal') === '1';
    if (query.get('cpp_test') === '1') sessionStorage.setItem('cpp_test', '1');
    if (query.get('cpp_test') === '0') sessionStorage.removeItem('cpp_test');
    test = sessionStorage.getItem('cpp_test') === '1';
  } catch (_) {
    internal = query.get('cpp_internal') === '1';
  }
  var production = /^(www\.)?clearpropools\.com$/.test(location.hostname);
  var enabled = (production || (test && /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) && (!internal || test);
  var consentKey = 'cpp_measurement_consent_v1';
  var consentAge = 180 * 24 * 60 * 60 * 1000;
  var choice = null;
  var privacySignal = navigator.globalPrivacyControl === true;
  try {
    var saved = JSON.parse(localStorage.getItem(consentKey));
    if (saved && (saved.choice === 'granted' || saved.choice === 'denied') &&
        saved.at <= Date.now() && Date.now() - saved.at < consentAge) choice = saved.choice;
  } catch (_) {}
  if (privacySignal) choice = 'denied';
  var started = false;
  var sent = Object.create(null);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.cppTracking = {
    test: test,
    internal: internal,
    event: function (name) {
      // Fixed event names and parameters: never send form values or mailto URLs.
      if (!started || choice !== 'granted' || sent[name] || !/^(generate_lead|email_request_prepared|email_request_open)$/.test(name)) return;
      sent[name] = true;
      gtag('event', name, {
        send_to: 'G-MZHY57J14G',
        form_id: 'service-request',
        lead_method: name === 'generate_lead' ? 'formspree' : 'direct_email',
        submission_confirmed: name === 'generate_lead' ? 'true' : 'false',
        ...(test ? { debug_mode: true } : {})
      });
    }
  };
  window.gtag = window.gtag || gtag;
  // Basic consent: no Google or CallRail request is made before an affirmative choice.
  // Queue defaults before GTM. Personalized advertising always remains denied.
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }
  function start() {
  if (!enabled || started || choice !== 'granted' || privacySignal) return;
  started = true;
  gtag('consent', 'update', {
    analytics_storage: 'granted', ad_storage: 'granted',
    ad_user_data: 'granted', ad_personalization: 'denied'
  });
  gtag('set', 'allow_ad_personalization_signals', false);
  // GTM reads this only for explicit QA; absent for ordinary visitors.
  if (test) window.dataLayer.push({ cpp_debug_mode: true });
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-W7DQD9PF';
  document.head.appendChild(tag);
  // One company-specific CallRail installation; form capture stays disabled.
  if (production) {
    var loadCallRail = function () {
      if (document.getElementById('cpp-callrail')) return;
      var calls = document.createElement('script');
      calls.id = 'cpp-callrail';
      calls.async = true;
      calls.src = 'https://cdn.callrail.com/companies/560093907/aa5fb0947b4a84f12243/12/swap.js';
      document.body.appendChild(calls);
    };
    ready(loadCallRail);
  }
  }
  function clearMeasurementStorage() {
    // Remove only measurement identifiers belonging to this website.
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat|_gcl_|calltrk[_-])/.test(name)) return;
      ['', location.hostname, '.' + location.hostname, 'clearpropools.com', '.clearpropools.com'].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
      });
    });
    try {
      [localStorage, sessionStorage].forEach(function (storage) {
        for (var i = storage.length - 1; i >= 0; i--) {
          var key = storage.key(i);
          if (/^calltrk[_-]/.test(key)) storage.removeItem(key);
        }
      });
    } catch (_) {}
  }
  var panel;
  window.cppPrivacy = {
    open: function () { if (panel) { panel.hidden = false; panel.querySelector('h2').focus(); } },
    choose: function (value) {
      if (value !== 'granted' && value !== 'denied') return;
      choice = privacySignal ? 'denied' : value;
      try { localStorage.setItem(consentKey, JSON.stringify({ choice: choice, at: Date.now() })); } catch (_) {}
      if (panel) panel.hidden = true;
      if (choice === 'granted') { start(); return; }
      clearMeasurementStorage();
      if (started) {
        window['ga-disable-G-MZHY57J14G'] = true;
        gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        location.reload(); // Unload CallRail's existing timers and restore the direct phone number.
      }
    }
  };
  window.addEventListener('storage', function (event) {
    if (event.key !== consentKey || !started) return;
    // A withdrawal in another tab must also stop this tab's measurement.
    var next;
    try { next = JSON.parse(event.newValue); } catch (_) {}
    if (!next || next.choice !== 'granted') {
      window['ga-disable-G-MZHY57J14G'] = true;
      clearMeasurementStorage();
      location.reload();
    }
  });
  if (choice !== 'granted') clearMeasurementStorage();
  start();
  ready(function () {
    var style = document.createElement('style');
    style.textContent = '#cpp-privacy{position:fixed;z-index:10000;bottom:18px;left:18px;right:18px;max-width:680px;margin:auto;padding:22px;background:#fff;color:#182b45;border:1px solid #c7d3e2;border-top:4px solid #efb13f;border-radius:12px;box-shadow:0 8px 35px #11284f35;font:14px/1.5 "Segoe UI",Arial,sans-serif;max-height:80vh;overflow:auto}#cpp-privacy[hidden]{display:none!important}#cpp-privacy h2{font-size:20px;margin:0 0 8px;color:#11284f}#cpp-privacy p{margin:0 0 14px}#cpp-privacy a{color:#19386f;text-decoration:underline}#cpp-privacy .choices{display:flex;gap:12px;flex-wrap:wrap}#cpp-privacy button{flex:1;min-width:160px;min-height:44px;border:1px solid #19386f;border-radius:7px;background:#fff;color:#19386f;font:600 14px/1.4 "Segoe UI",Arial,sans-serif;padding:11px 15px;cursor:pointer}#cpp-privacy button:focus-visible{outline:3px solid #efb13f;outline-offset:3px}#cpp-privacy button:disabled{opacity:.55;cursor:default}.cpp-privacy-settings{border:0;background:none;color:inherit;text-decoration:underline;font:inherit;cursor:pointer;padding:4px}';
    document.head.appendChild(style);
    panel = document.createElement('section');
    panel.id = 'cpp-privacy';
    panel.setAttribute('aria-labelledby', 'cpp-privacy-title');
    panel.hidden = choice !== null;
    panel.innerHTML = '<h2 id="cpp-privacy-title" tabindex="-1">Your privacy choices</h2><p>Allow Google Analytics and CallRail to use cookies and similar tools to measure website visits, calls, and ad results? They can link your website visit to a call and its marketing source. Calling and requesting service work either way. <a href="/privacy.html">Read our privacy notice</a>.</p>' +
      (privacySignal ? '<p>Your browser\'s Global Privacy Control signal is on. Optional measurement is disabled.</p>' : '') +
      '<div class="choices"><button type="button" data-choice="denied">Decline measurement</button><button type="button" data-choice="granted"' + (privacySignal ? ' disabled' : '') + '>Allow measurement</button></div><p style="font-size:12px;margin:12px 0 0">You can change this in Privacy settings. Declining after allowing reloads this page; copy any unsent request first.</p>';
    document.body.appendChild(panel);
    panel.querySelectorAll('[data-choice]').forEach(function (button) {
      button.addEventListener('click', function () { window.cppPrivacy.choose(button.getAttribute('data-choice')); });
    });
    document.querySelectorAll('[data-privacy-settings]').forEach(function (button) {
      button.addEventListener('click', function () { window.cppPrivacy.open(); });
    });
  });
})();
