/**
 * ReviewRemoval form endpoint.
 * Sheet columns, in order:
 * Timestamp | Selected Plan | Full Name | Business Name | Email | Phone |
 * Preferred Contact | Contact Detail | Profile URL | Review Count |
 * Review Links | Reason | Traffic Source
 *
 * Maintain this file as Code.gs in the existing separate ReviewRemoval project.
 * Script Properties: SPREADSHEET_ID, SHEET_NAME, NOTIFICATION_EMAIL,
 * TURNSTILE_SECRET, TURNSTILE_HOSTNAMES. See TURNSTILE-SETUP.md.
 * Do not paste into or update the existing ReviewsBoost/shared deployment.
 */
// BEGIN ACKNOWLEDGEMENT STORAGE
function submissionAcknowledgements(value) {
  var text = String(value == null ? '' : value);
  var record = /\[Submission acknowledgement\]\r?\nNotice:[^\r\n]*\r?\nTerms:[^\r\n]*\r?\nPolicy snapshot:[^\r\n]*\r?\nPrivacy:[^\r\n]*\r?\nLanguage:[^\r\n]*\r?\nMethod:[^\r\n]*\r?\nClient-device time:[^\r\n]*(?:\r?\nSubmission page:[^\r\n]*)?/g;
  return { text: text.replace(record, ''), records: text.match(record) || [] };
}

// Hide generated metadata in emails; customer notes/source/references remain.
function notificationBodyWithoutAcknowledgement(body) {
  return submissionAcknowledgements(body).text;
}

// Caller holds the script lock. Archive first; clear only the matching cell.
function archiveAcknowledgementRow(spreadsheet, leadSheet, rowNumber, brand, expectedReason) {
  try {
    if (['ReviewRemoval', 'ReviewsBoost'].indexOf(brand) === -1) throw new Error('Unknown acknowledgement brand.');
    var cell = leadSheet.getRange(rowNumber, 12);
    var originalValue = cell.getValue();
    var original = String(originalValue == null ? '' : originalValue);
    if (expectedReason !== undefined && original !== expectedReason) return false;
    var parts = submissionAcknowledgements(original);
    if (!parts.records.length) return true;
    var record = parts.records.join('\n\n');
    var auditName = brand + ' Acknowledgements';
    if (leadSheet.getName() === auditName) throw new Error('The audit tab must differ from the leads tab.');
    var headers = ['Audit ID', 'Archived at', 'Lead sheet', 'Lead row', 'Request reference', 'Acknowledgement'];
    var audit = spreadsheet.getSheetByName(auditName);
    if (!audit) {
      audit = spreadsheet.insertSheet(auditName);
      audit.appendRow(headers);
      audit.hideSheet();
    } else {
      var actual = audit.getRange(1, 1, 1, headers.length).getValues()[0];
      if (headers.some(function (header, index) { return actual[index] !== header; })) {
        throw new Error('The existing audit tab has unexpected headers.');
      }
    }
    // Stable for an unchanged row, so retries cannot duplicate an archived record.
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      brand + '\n' + leadSheet.getSheetId() + '\n' + rowNumber + '\n' + record, Utilities.Charset.UTF_8);
    var id = 'ACK-' + digest.map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
    var last = audit.getLastRow(), previous = null;
    if (last > 1) previous = audit.getRange(2, 1, last - 1, 1).createTextFinder(id)
      .matchCase(true).matchEntireCell(true).useRegularExpression(false).findNext();
    if (previous) {
      if (String(audit.getRange(previous.getRow(), 6).getValue()) !== record) throw new Error('The audit record does not match.');
    } else {
      var reference = original.match(/Request reference:\s*(RB-[a-z0-9-]{10,60})/i);
      audit.appendRow([id, new Date(), leadSheet.getName(), rowNumber, reference ? reference[1] : '', record].map(function (value) {
        return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value;
      }));
      SpreadsheetApp.flush();
    }
    // Do not overwrite notes that changed while the archive was being written.
    var currentValue = cell.getValue();
    if (String(currentValue == null ? '' : currentValue) !== original) return false;
    var cleaned = parts.text.trim();
    cell.setValue(/^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned);
    SpreadsheetApp.flush();
    return true;
  } catch (_) {
    // Keep the saved lead and original acknowledgement intact on archive failure.
    console.error('Acknowledgement cleanup incomplete; check the lead and acknowledgement tabs.');
    return false;
  }
}

// Owner-operated, bounded migration. No emails, tokens or form submissions.
function processExistingAcknowledgements(brand, dryRun) {
  var properties = PropertiesService.getScriptProperties();
  var id = (properties.getProperty('SPREADSHEET_ID') || '').trim();
  var name = properties.getProperty('SHEET_NAME') || '';
  if (!id || !name) throw new Error('Set this project\'s SPREADSHEET_ID and SHEET_NAME first.');
  var spreadsheet = SpreadsheetApp.openById(id), sheet = spreadsheet.getSheetByName(name);
  if (!sheet || sheet.getRange(1, 12).getValue() !== 'Reason') {
    throw new Error('The configured leads tab must have Reason in L1. No cells changed.');
  }
  var lock = null;
  if (!dryRun) { lock = LockService.getScriptLock(); lock.waitLock(10000); }
  try {
    var last = sheet.getLastRow(), values = last > 1 ? sheet.getRange(2, 12, last - 1, 1).getValues() : [];
    var matching = 0, cleaned = 0, failed = 0, attempted = 0;
    values.forEach(function (row, index) {
      if (!submissionAcknowledgements(row[0]).records.length) return;
      matching++;
      if (dryRun || attempted >= 50) return;
      attempted++;
      if (archiveAcknowledgementRow(spreadsheet, sheet, index + 2, brand)) cleaned++; else failed++;
    });
    var result = { dry_run: dryRun, scanned: values.length, matching: matching,
      cleaned: cleaned, failed: failed, remaining: matching - cleaned, batch_limit: 50 };
    console.log(JSON.stringify(result));
    return result;
  } finally { if (lock) lock.releaseLock(); }
}
// END ACKNOWLEDGEMENT STORAGE

function previewAcknowledgementCleanup() { return processExistingAcknowledgements('ReviewRemoval', true); }
function cleanExistingAcknowledgements() { return processExistingAcknowledgements('ReviewRemoval', false); }

function doPost(e) {
  try {
    var data = (e && e.parameter) || {};
    // Gate every request before accessing Sheets or sending notifications.
    // Never exempt a request using a submitted brand, URL, action or plan field.
    if (!verifyTurnstile(data['cf-turnstile-response']) ||
        !claimVerifiedTurnstileToken(data['cf-turnstile-response'])) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        code: 'verification_failed',
        error: 'Security verification failed. Please complete the check and try again.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    // Browser constraints can be bypassed. Reject malformed/spam input before
    // opening Sheets or sending either kind of notification.
    var inputErrors = leadInputErrors(data, true);
    var invalidField = Object.keys(inputErrors)[0];
    if (invalidField) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error', code: 'invalid_input', field: invalidField,
        error: inputErrors[invalidField]
      })).setMimeType(ContentService.MimeType.JSON);
    }
    // Standalone web apps do not have an active spreadsheet. Resolve this
    // project's destination explicitly, without touching the shared deployment.
    var storage = PropertiesService.getScriptProperties();
    var spreadsheetId = storage.getProperty('SPREADSHEET_ID');
    var sheetName = storage.getProperty('SHEET_NAME');
    if (!spreadsheetId || !sheetName) throw new Error('The form storage is not configured.');
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error('The configured submissions tab was not found.');
    var timestamp = new Date();

    var selectedPlan = data.selected_plan || 'N/A';
    var fullName = data.full_name || 'N/A';
    var businessName = data.business_name || 'N/A';
    var email = data.email_address || data.email || 'N/A';
    var phone = data.phone_number || data.phone || 'N/A';
    var contactMethod = data.contact_method || 'Email';
    var contactInfo = data.contact_detail || (email !== 'N/A' ? email : phone);
    var businessUrl = data.business_url || 'N/A';
    var reviewCount = data.review_count || data.reviews_to_remove || 'N/A';
    var reviewLinks = data.review_links || 'N/A';
    var reason = data.reason && data.reason.trim() ? data.reason.trim() : 'None Provided';
    var trafficSource = reviewRemovalTrafficSource(data.traffic_source);

    // Prevent submitted text from being interpreted as a formula in Sheets.
    function sheetText(value) {
      var text = String(value);
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    }

    var row = [
      timestamp,
      sheetText(selectedPlan),
      sheetText(fullName),
      sheetText(businessName),
      sheetText(email),
      sheetText(phone),
      sheetText(contactMethod),
      sheetText(contactInfo),
      sheetText(businessUrl),
      sheetText(reviewCount),
      sheetText(reviewLinks),
      sheetText(reason),
      trafficSource
    ];
    var hasAcknowledgement = submissionAcknowledgements(reason).records.length > 0;
    var acknowledgementArchived = true, writeLock = LockService.getScriptLock();
    writeLock.waitLock(5000);
    try {
      sheet.appendRow(row);
      if (hasAcknowledgement) {
        try {
          SpreadsheetApp.flush();
          acknowledgementArchived = archiveAcknowledgementRow(spreadsheet, sheet, sheet.getLastRow(), 'ReviewRemoval', reason);
        } catch (_) {
          acknowledgementArchived = false;
          console.error('Lead saved; acknowledgement cleanup pending.');
        }
      }
    } finally { if (writeLock) writeLock.releaseLock(); }

    var formType = selectedPlan !== 'N/A' ? 'New Order Placement' : 'New Assessment / Quote Request';
    var subject = formType + ' from ' + fullName;
    var body = 'You received a new ReviewRemoval submission!\n\n' +
      'Form Type: ' + formType + '\n' +
      'Traffic Source: ' + trafficSource + '\n' +
      'Selected Plan: ' + selectedPlan + '\n' +
      'Full Name: ' + fullName + '\n' +
      'Business Name: ' + businessName + '\n' +
      'Email Address: ' + email + '\n' +
      'Phone: ' + phone + '\n' +
      'Preferred Contact Method: ' + contactMethod + '\n' +
      'Contact Detail: ' + contactInfo + '\n' +
      'Business profile or review URL: ' + businessUrl + '\n' +
      'Reviews to Remove: ' + reviewCount + '\n' +
      'Review Links: ' + reviewLinks + '\n' +
      'Reason: ' + reason + '\n';

    var ownerEmail = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL') ||
      Session.getEffectiveUser().getEmail();
    var notificationSent = false;
    if (ownerEmail) {
      try {
        MailApp.sendEmail(ownerEmail, subject, notificationBodyWithoutAcknowledgement(body));
        notificationSent = true;
      } catch (mailError) {
        console.error('Sheet row saved, but owner notification failed: ' + mailError);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      notification_sent: notificationSent,
      acknowledgement_archived: acknowledgementArchived
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: String(error)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Client-detected attribution is a descriptive hint, not verified ad billing data.
// Only fixed labels can enter Sheets/email; never store raw referrer/query values.
function reviewRemovalTrafficSource(value) {
  var labels = {
    paid_google: 'Paid - Google Ads', paid_other: 'Paid - Other campaign',
    organic_google: 'Organic - Google', organic_bing: 'Organic - Bing',
    organic_other: 'Organic - Other search', referral: 'Referral / other'
  };
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(labels, value)
    ? labels[value] : 'Direct / unknown';
}

function verifyTurnstile(token) {
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) return false;
  try {
    var properties = PropertiesService.getScriptProperties();
    var secret = properties.getProperty('TURNSTILE_SECRET');
    var hostnames = (properties.getProperty('TURNSTILE_HOSTNAMES') || '')
      .split(',').map(function (hostname) { return hostname.trim(); }).filter(Boolean);
    // This is the production handler. Localhost and other brands are not allowed.
    var productionHosts = ['reviewremoval.ca', 'www.reviewremoval.ca'];
    if (!secret || !secret.trim() || !hostnames.length || hostnames.some(function (hostname) {
      return productionHosts.indexOf(hostname) === -1;
    })) return false;

    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: {secret: secret, response: token},
      muteHttpExceptions: true,
      followRedirects: false
      // Apps Script exposes no trustworthy client IP or per-request timeout option.
      // Do not accept a browser-supplied IP or forward lead data to Cloudflare.
    });
    if (response.getResponseCode() !== 200) return false;
    var result = JSON.parse(response.getContentText());
    return result && result.success === true && result.action === 'quote_request' &&
      hostnames.indexOf(result.hostname) !== -1;
  } catch (_) {
    // No token, secret, provider response or personal information in logs/errors.
    return false;
  }
}

// Additional application-level replay protection. Persist only a SHA-256 hash
// and expiry, never the raw token or form fields. Script properties are durable;
// a shared script lock makes the check-and-record atomic across web requests.
function claimVerifiedTurnstileToken(token) {
  var lock;
  var acquired = false;
  try {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
    var hash = digest.map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
    var marker = 'TURNSTILE_USED_' + hash;
    lock = LockService.getScriptLock();
    acquired = lock.tryLock(10000);
    if (!acquired) return false;
    var storage = PropertiesService.getScriptProperties();
    var now = Date.now();
    if (Number(storage.getProperty(marker)) > now) return false;
    var properties = storage.getProperties();
    Object.keys(properties).forEach(function (name) {
      if (/^TURNSTILE_USED_[a-f0-9]{64}$/.test(name) && !(Number(properties[name]) > now)) {
        storage.deleteProperty(name);
      }
    });
    // Six minutes exceeds Turnstile's five-minute token validity window.
    storage.setProperty(marker, String(now + 6 * 60 * 1000));
    return true;
  } catch (_) {
    // Refuse the submission if locking or persistence fails; never log tokens.
    return false;
  } finally {
    if (acquired) lock.releaseLock();
  }
}

/**
 * Run manually in the new project's editor before creating a test deployment.
 * Reads configuration and headers; sends one dummy token to Cloudflare.
 * Does not write a row, send an email, expose the secret or accept a lead.
 * This is a configuration check, not proof of a real-token success or replay test.
 */
function checkReviewRemovalSetup() {
  var properties = PropertiesService.getScriptProperties();
  ['SPREADSHEET_ID', 'SHEET_NAME', 'NOTIFICATION_EMAIL', 'TURNSTILE_SECRET', 'TURNSTILE_HOSTNAMES']
    .forEach(function (name) {
      var value = properties.getProperty(name);
      if (!value || !value.trim()) throw new Error('Missing Script Property: ' + name);
    });
  var hostnames = properties.getProperty('TURNSTILE_HOSTNAMES').split(',')
    .map(function (hostname) { return hostname.trim(); }).filter(Boolean);
  if (!hostnames.length || hostnames.some(function (hostname) {
    return ['reviewremoval.ca', 'www.reviewremoval.ca'].indexOf(hostname) === -1;
  })) throw new Error('TURNSTILE_HOSTNAMES must contain only ReviewRemoval production hostnames.');

  var sheet = SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID'))
    .getSheetByName(properties.getProperty('SHEET_NAME'));
  if (!sheet) throw new Error('The configured submissions tab was not found.');
  var expected = ['Timestamp', 'Selected Plan', 'Full Name', 'Business Name', 'Email', 'Phone',
    'Preferred Contact', 'Contact Detail', 'Profile URL', 'Review Count', 'Review Links', 'Reason', 'Traffic Source'];
  var headers = sheet.getRange(1, 1, 1, expected.length).getValues()[0];
  if (expected.some(function (header, index) { return headers[index] !== header; })) {
    throw new Error('Keep the existing 12 headers in A1:L1 and add Traffic Source in M1. See FORM-SETUP.md.');
  }
  var validSecret = false;
  try {
    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', contentType: 'application/x-www-form-urlencoded',
      payload: {secret: properties.getProperty('TURNSTILE_SECRET'), response: 'XXXX.DUMMY.TOKEN.XXXX'},
      muteHttpExceptions: true, followRedirects: false
    });
    var result = response.getResponseCode() === 200 ? JSON.parse(response.getContentText()) : {};
    var errors = result['error-codes'] || [];
    validSecret = result.success === false && errors.indexOf('invalid-input-response') !== -1 &&
      errors.indexOf('invalid-input-secret') === -1;
  } catch (_) { /* Only the generic diagnostic below is returned. */ }
  if (!validSecret) throw new Error('The secret check failed. Verify the matching production secret and Cloudflare connectivity.');
  var summary = {configuration: 'passed', spreadsheet_headers: 'matched', secret_probe: 'passed',
    real_token_validation: 'pending', email_delivery: 'not tested'};
  console.log(JSON.stringify(summary));
  return summary;
}

// Run in the Apps Script editor if a tab appears to match but cannot be found.
// Reads only the destination properties and spreadsheet/tab metadata, not leads.
function diagnoseReviewRemovalSheet() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheet = SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID'));
  var result = {
    spreadsheet_url: spreadsheet.getUrl(),
    configured_tab: properties.getProperty('SHEET_NAME'),
    actual_tabs: spreadsheet.getSheets().map(function (sheet) { return sheet.getName(); })
  };
  console.log('Opened spreadsheet: ' + result.spreadsheet_url);
  console.log('Configured tab: ' + JSON.stringify(result.configured_tab));
  console.log('Actual tabs: ' + JSON.stringify(result.actual_tabs));
  return result;
}

// BEGIN LEAD INPUT RULES
// Keep this pure validation function identical in the browser and Apps Script.
// It uses no browser/Node APIs; Apps Script's V8 runtime can execute it directly.
function leadInputErrors(data, requireReviewCount) {
  var errors = {};
  function text(name) { return typeof data[name] === 'string' ? data[name].trim() : ''; }
  function blockedEmail(address) {
    var domain = address.toLowerCase().split('@').pop().replace(/\.+$/, '');
    return domain === 'fldubai.com' || domain.slice(-12) === '.fldubai.com';
  }
  var name = text('full_name');
  if (!name) errors.full_name = 'Enter your name.';
  else if (data.full_name.length > 150) errors.full_name = 'Keep your name to 150 characters or fewer.';
  else if (/[$\uFE69\uFF04\u0000-\u001F\u007F]|https?:\/\/|www\./i.test(data.full_name) || !/\p{L}/u.test(name)) {
    errors.full_name = 'Enter your name without links, dollar signs or line breaks.';
  }
  var business = text('business_name');
  if (!business) errors.business_name = 'Enter your business name.';
  else if (data.business_name.length > 250) errors.business_name = 'Keep the business name to 250 characters or fewer.';
  else if (/[\u0000-\u001F\u007F]|https?:\/\//i.test(data.business_name)) errors.business_name = 'Enter a business name without web links or line breaks.';

  var contact = text('contact_detail');
  var email = text('email_address') || text('email') || ((/^Email\b/i.test(text('contact_method')) || contact.indexOf('@') !== -1) ? contact : '');
  if (!email || email.length > 254 || /[\u0000-\u0020\u007F]/.test(email) || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) errors.email_address = 'Enter a valid email address.';
  else if (blockedEmail(email) || (contact.indexOf('@') !== -1 && blockedEmail(contact))) errors.email_address = 'Please use a different email address.';

  var count = text('review_count') || text('reviews_to_remove') || text('review_quantity');
  if ((requireReviewCount || count) && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 50)) {
    errors.review_count = 'Enter a whole number of reviews from 1 to 50.';
  }
  // business_url is optional free text; do not validate its format or length.
  if (text('phone_number').length > 80 || text('phone').length > 80) errors.phone_number = 'Keep the phone number to 80 characters or fewer.';
  if (text('review_links').length > 12000) errors.review_links = 'Keep review details to 12,000 characters or fewer.';
  if (text('reason').length > 20000) errors.reason = 'Keep additional details to 20,000 characters or fewer.';
  return errors;
}
// END LEAD INPUT RULES
