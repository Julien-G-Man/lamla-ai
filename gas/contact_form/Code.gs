// ═══════════════════════════════════════════════════════════════════════════════
// Code.gs — Contact Form
//
// Request handling and sheet writes. No HTML here — see Templates.gs.
// All config lives in Config.gs.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
//
// After deploying:
//   Copy the Web App URL → set as Vercel env var:
//   REACT_APP_GAS_CONTACT_URL=<your-web-app-url>
// ═══════════════════════════════════════════════════════════════════════════════


// ── Entry points ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data    = JSON.parse(e.postData.contents);
    var name    = (data.name    || "").trim();
    var email   = (data.email   || "").trim();
    var title   = (data.title   || "").trim();
    var message = (data.message || "").trim();

    if (!name || !email || !title || !message) {
      return jsonResponse({ success: false, error: "Missing required fields" });
    }

    cfg_log("Contact form submission from " + email);

    if (!cfg_skipSheet()) {
      appendToSheet(name, email, title, message);
    } else {
      cfg_log("TEST_MODE: sheet write skipped");
    }

    sendAdminNotification(name, email, title, message);
    sendUserAcknowledgment(name, email, title);

    return jsonResponse({ success: true });

  } catch (err) {
    cfg_log("ERROR: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// Health-check / CORS preflight
function doGet(e) {
  return jsonResponse({ status: "ok", env: ENV, testMode: TEST_MODE });
}


// ── Google Sheets ─────────────────────────────────────────────────────────────

function appendToSheet(name, email, title, message) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Email", "Subject", "Message"]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
  }

  sheet.appendRow([new Date().toISOString(), name, email, title, message]);
  cfg_log("Sheet row appended for " + email);
}


// ── Email senders ─────────────────────────────────────────────────────────────

function sendAdminNotification(name, email, title, message) {
  var to      = cfg_adminEmail();
  var subject = "New Contact Message - " + SITE_NAME;
  var html    = buildAdminNotificationHtml(name, email, title, message);
  GmailApp.sendEmail(to, subject, stripTags(html), { htmlBody: html });
  cfg_log("Admin notification sent to " + to);
}

function sendUserAcknowledgment(name, email, title) {
  var to      = cfg_userEmail(email);
  var subject = "We received your message - " + SITE_NAME;
  var html    = buildUserAcknowledgmentHtml(name, email, title);
  GmailApp.sendEmail(to, subject, stripTags(html), { htmlBody: html });
  cfg_log("User acknowledgment sent to " + to);
}


// ── Util ──────────────────────────────────────────────────────────────────────

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
