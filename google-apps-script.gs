/**
 * ReviewRemoval form endpoint.
 * Sheet columns, in order:
 * Timestamp | Selected Plan | Full Name | Business Name | Email | Phone |
 * Preferred Contact | Contact Detail | Profile URL | Review Count |
 * Review Links | Reason
 *
 * Paste the entire file into Code.gs in a NEW, standalone ReviewRemoval project.
 * Script Properties: SPREADSHEET_ID, SHEET_NAME, NOTIFICATION_EMAIL,
 * TURNSTILE_SECRET, TURNSTILE_HOSTNAMES. See TURNSTILE-SETUP.md.
 * Do not paste into or update the existing ReviewsBoost/shared deployment.
 */
function doPost(e) {
  try {
    var data = (e && e.parameter) || {};
    // Gate every request before accessing Sheets or sending notifications.
    // Never exempt a request using a submitted brand, URL, action or plan field.
    if (!verifyTurnstile(data['cf-turnstile-response'])) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        code: 'verification_failed',
        error: 'Security verification failed. Please complete the check and try again.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    // Standalone web apps do not have an active spreadsheet. Resolve this
    // project's destination explicitly, without touching the shared deployment.
    var storage = PropertiesService.getScriptProperties();
    var spreadsheetId = storage.getProperty('SPREADSHEET_ID');
    var sheetName = storage.getProperty('SHEET_NAME');
    if (!spreadsheetId || !sheetName) throw new Error('The form storage is not configured.');
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
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

    // Prevent submitted text from being interpreted as a formula in Sheets.
    function sheetText(value) {
      var text = String(value);
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    }

    sheet.appendRow([
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
      sheetText(reason)
    ]);

    var formType = selectedPlan !== 'N/A' ? 'New Order Placement' : 'New Assessment / Quote Request';
    var subject = formType + ' from ' + fullName;
    var body = 'You received a new ReviewRemoval submission!\n\n' +
      'Form Type: ' + formType + '\n' +
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
        MailApp.sendEmail(ownerEmail, subject, body);
        notificationSent = true;
      } catch (mailError) {
        console.error('Sheet row saved, but owner notification failed: ' + mailError);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      notification_sent: notificationSent
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: String(error)
    })).setMimeType(ContentService.MimeType.JSON);
  }
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
    'Preferred Contact', 'Contact Detail', 'Profile URL', 'Review Count', 'Review Links', 'Reason'];
  var headers = sheet.getRange(1, 1, 1, expected.length).getValues()[0];
  if (expected.some(function (header, index) { return headers[index] !== header; })) {
    throw new Error('Row 1 must match the 12 headers in TURNSTILE-SETUP.md, in order.');
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
