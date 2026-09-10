/**
 * CITI Academy — registration receiver
 * -------------------------------------------------------------
 * Deploy this file as a Google Apps Script Web App bound to a
 * Google Spreadsheet. Every course registration is appended to
 * its own sheet tab (created automatically the first time a
 * registration for that course arrives), named after the
 * course's id — e.g. "python-developer", "ms-office".
 *
 * Setup steps are in the project README under
 * "Connect registrations to Google Sheets".
 */

var HEADERS = [
  "Timestamp",
  "Course",
  "Name",
  "Phone",
  "Email",
  "Qualification",
  "Preferred Mode",
  "Message",
  "Page URL",
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = sanitizeSheetName(data.courseId || "general");
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      data.courseName || sheetName,
      data.name || "",
      data.phone || "",
      data.email || "",
      data.qualification || "",
      data.preferredMode || "",
      data.message || "",
      data.source || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple health check so you can open the web app URL in a browser to confirm it's live.
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "CITI Academy registration endpoint is live." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeSheetName(id) {
  // Google Sheets tab names can't contain: [ ] * ? / \ : and can't be blank or over 100 chars
  var cleaned = String(id).replace(/[\[\]\*\?\/\\:]/g, "-").trim();
  if (!cleaned) cleaned = "general";
  return cleaned.substring(0, 90);
}
