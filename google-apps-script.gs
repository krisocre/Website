/**
 * ReviewRemoval form endpoint.
 * Sheet columns, in order:
 * Timestamp | Selected Plan | Full Name | Business Name | Email | Phone |
 * Preferred Contact | Contact Detail | Profile URL | Review Count |
 * Review Links | Reason
 *
 * Deploy as a web app that executes as the script owner. For reliable owner
 * notifications, set the NOTIFICATION_EMAIL script property to your inbox.
 */
function doPost(e) {
  try {
    var data = (e && e.parameter) || {};
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
      'Google Business Profile URL: ' + businessUrl + '\n' +
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
