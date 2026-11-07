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
  var sent = Object.create(null);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.cppTracking = {
    test: test,
    internal: internal,
    event: function (name) {
      // Fixed event names and parameters: never send form values or mailto URLs.
      if (!enabled || sent[name] || !/^(email_request_prepared|email_request_open)$/.test(name)) return;
      sent[name] = true;
      gtag('event', name, {
        send_to: 'G-MZHY57J14G',
        form_id: 'service-request',
        lead_method: 'direct_email',
        submission_confirmed: 'false',
        ...(test ? { debug_mode: true } : {})
      });
    }
  };
  if (!enabled) return;
  window.gtag = window.gtag || gtag;
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
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadCallRail, { once: true });
    } else {
      loadCallRail();
    }
  }
})();
