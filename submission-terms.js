(function (window) {
  'use strict';
  function prepare(payload) {
    if (!payload.get('terms_version') || payload.get('terms_recorded') === 'true') return payload;
    var now = new Date().toISOString();
    var page = window.location ? window.location.origin + window.location.pathname : '';
    payload.set('terms_acknowledged_at_client', now);
    payload.set('submission_page', page);
    var record = [
      '[Submission acknowledgement]',
      'Notice: ' + payload.get('terms_acknowledgement'),
      'Terms: ' + payload.get('terms_url') + ' | version ' + payload.get('terms_version'),
      'Policy snapshot: ' + payload.get('terms_snapshot_url'),
      'Privacy: ' + payload.get('privacy_url') + ' | version ' + payload.get('privacy_version'),
      'Language: ' + payload.get('terms_language'),
      'Method: submission after linked notice; not a claim of document reading',
      'Client-device time: ' + now,
      'Submission page: ' + page
    ].join('\n');
    // Preserve the existing deployed Apps Script's twelve-column layout. It
    // already saves Reason and timestamps the row on the server. Client fields
    // provide context, not independent proof of identity or document reading.
    payload.set('reason', String(payload.get('reason') || '').trim() + '\n\n' + record);
    payload.set('terms_recorded', 'true');
    return payload;
  }
  window.SubmissionTerms = Object.freeze({ prepare: prepare });
})(window);
