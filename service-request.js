/* Count a service lead only after the existing Formspree endpoint accepts it. */
(function () {
  'use strict';
  const form = document.getElementById('service-request');
  const phone = document.getElementById('phone');
  const formView = document.getElementById('form-view');
  const confirmation = document.getElementById('confirmation');
  const submit = document.getElementById('send-request');
  const status = document.getElementById('form-status');
  let sending = false, complete = false;
  function validatePhone() {
    const digits = phone.value.replace(/\D/g, '');
    const valid = /^[+\d().\s-]+$/.test(phone.value) && (digits.length === 10 || (digits.length === 11 && digits.startsWith('1')));
    phone.setCustomValidity(phone.value && !valid ? 'Enter a ten-digit US phone number, including the area code.' : '');
  }
  phone.addEventListener('input', validatePhone);
  phone.addEventListener('change', validatePhone);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || complete) return;
    validatePhone();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    // Keep the optional email field absent when empty so Reply-to remains valid.
    if (!String(values.get('email') || '').trim()) values.delete('email');
    values.set('_subject', window.cppTracking && window.cppTracking.test ? 'Riva tracking test — please disregard' : 'Clear Pro Pools — new service request');
    if (window.cppTracking && window.cppTracking.test) values.set('submission_type', 'TEST — exclude from lead totals; do not contact');
    values.set('request_page', '/request-service.html');
    sending = true;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, { method: 'POST', body: values, headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('Submission not accepted');
      const result = await response.json();
      if (result.ok !== true) throw new Error('Submission not confirmed');
      complete = true;
      formView.hidden = true;
      document.getElementById('success').hidden = false;
      document.getElementById('success-heading').focus();
      // Do not pass names, contact details, messages or mailto links to Analytics.
      if (window.cppTracking) window.cppTracking.event('generate_lead');
      form.reset();
    } catch (_) {
      status.textContent = 'We couldn’t confirm delivery. Your details are still here. Please call us or use “Prepare an email instead” below. If you retry, the earlier request may already have arrived.';
      status.hidden = false;
      status.focus();
    } finally {
      clearTimeout(timeout);
      sending = false;
      submit.disabled = complete;
      submit.textContent = complete ? 'Request sent' : 'Send service request';
    }
  });
  document.getElementById('prepare-email').addEventListener('click', () => {
    if (sending || complete) return;
    validatePhone();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const body = [
      'Hello Clear Pro Pools,', '', 'I would like to request pool service.', '',
      'Service: ' + values.get('service'), 'Name: ' + values.get('name'),
      'Phone: ' + values.get('phone'), 'Email: ' + (values.get('email') || 'Not provided'),
      'Pool ZIP code: ' + values.get('service_zip'), 'Preferred follow-up: ' + values.get('contact_preference'), '',
      'Additional details:', values.get('message') || 'None provided'
    ].join('\r\n');
    document.getElementById('email-draft').href = 'mailto:clearpropoolsllc@gmail.com?subject=' + encodeURIComponent('Pool service request — ' + values.get('service')) + '&body=' + encodeURIComponent(body);
    document.getElementById('summary-service').textContent = values.get('service');
    document.getElementById('summary-contact').textContent = values.get('contact_preference') + ' · ' + values.get('phone');
    document.getElementById('summary-zip').textContent = 'ZIP ' + values.get('service_zip');
    if (window.cppTracking) window.cppTracking.event('email_request_prepared');
    formView.hidden = true;
    confirmation.hidden = false;
    document.getElementById('confirmation-heading').focus();
  });
  document.getElementById('email-draft').addEventListener('click', () => {
    if (window.cppTracking) window.cppTracking.event('email_request_open');
  });
  document.getElementById('back').addEventListener('click', () => {
    confirmation.hidden = true;
    formView.hidden = false;
    document.getElementById('full-name').focus();
  });
})();
