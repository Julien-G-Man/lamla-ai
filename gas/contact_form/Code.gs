// ═══════════════════════════════════════════════════════════════════════════════
// Code.gs — Contact Form
//
// Handles POST requests from the Lamla AI frontend contact form.
// All config lives in Config.gs — do not hard-code values here.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
//
// After deploying:
//   Copy the Web App URL → set as Vercel env var:
//   REACT_APP_GAS_CONTACT_URL=<your-web-app-url>
//
// What this does on each POST:
//   1. Validates required fields
//   2. Appends a row to the Google Sheet  (skipped in TEST_MODE)
//   3. Sends an admin notification email
//   4. Sends a user acknowledgment email
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

// Handles CORS preflight (browser GET health-check)
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

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#000;">',
    '  <div style="max-width:600px;margin:0 auto;background:#fff;padding:28px;">',

    '    <div style="text-align:center;margin-bottom:18px;">',
    '      <img src="' + LOGO_URL + '" alt="' + SITE_NAME + '" style="max-width:160px;">',
    '    </div>',
    '    <div style="height:4px;background:#FFD400;margin:24px 0;"></div>',

    '    <h2 style="font-size:20px;margin-bottom:16px;">New Contact Message</h2>',
    TEST_MODE ? '    <p style="background:#fff3cd;padding:8px;font-size:13px;">⚠️ TEST MODE — real recipient was: ' + escHtml(email) + '</p>' : '',

    '    <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.6;">',
    '      <tr><td style="padding:8px 0;font-weight:bold;width:90px;">Subject:</td><td>' + escHtml(title)   + '</td></tr>',
    '      <tr><td style="padding:8px 0;font-weight:bold;">Name:</td><td>'                + escHtml(name)    + '</td></tr>',
    '      <tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td>'               + escHtml(email)   + '</td></tr>',
    '    </table>',

    '    <div style="margin-top:16px;">',
    '      <p style="font-weight:bold;margin-bottom:6px;">Message:</p>',
    '      <div style="background:#f2f2f2;padding:12px;font-size:15px;line-height:1.6;white-space:pre-wrap;">' + escHtml(message) + '</div>',
    '    </div>',

    '    <div style="height:4px;background:#FFD400;margin:24px 0;"></div>',
    '    <p style="font-size:12px;color:#555;text-align:center;">© 2026 ' + SITE_NAME + '. All rights reserved.</p>',
    '  </div>',
    '</body></html>',
  ].join("\n");

  GmailApp.sendEmail(to, subject, stripHtml(html), { htmlBody: html });
  cfg_log("Admin notification sent to " + to);
}


function sendUserAcknowledgment(name, email, title) {
  var to      = cfg_userEmail(email);
  var subject = "We received your message - " + SITE_NAME;

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#000;">',
    '  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:28px;">',

    '    <div style="text-align:center;margin-bottom:18px;">',
    '      <img src="' + LOGO_URL + '" alt="' + SITE_NAME + '" style="max-width:160px;">',
    '    </div>',
    '    <div style="height:4px;background:#FFD400;margin:24px 0;"></div>',

    TEST_MODE ? '    <p style="background:#fff3cd;padding:8px;font-size:13px;">⚠️ TEST MODE — real recipient was: ' + escHtml(email) + '</p>' : '',

    '    <h1 style="font-size:22px;margin-bottom:14px;">Message Received</h1>',
    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">Hi ' + escHtml(name) + ',</p>',
    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">',
    '      Thanks for contacting <strong>' + SITE_NAME + '</strong>. We received your message regarding',
    '      &#8220;<strong>' + escHtml(title) + '</strong>&#8221; and will get back to you as soon as possible.',
    '    </p>',

    '    <div style="background:#FFD400;padding:12px;font-weight:bold;text-align:center;margin:22px 0;">',
    '      We typically respond within 24&#8211;48 hours.',
    '    </div>',

    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">',
    '      If you did not send this message, you can safely ignore this email.',
    '    </p>',
    '    <p style="font-size:15px;line-height:1.6;">&#8212; The ' + SITE_NAME + ' Team</p>',

    '    <div style="height:4px;background:#FFD400;margin:24px 0;"></div>',

    '    <div style="text-align:center;margin:16px 0;">',
    '      <a href="' + SITE_URL + '" style="background:#FFD400;color:#000;padding:10px 16px;text-decoration:none;font-size:14px;font-weight:bold;border-radius:4px;">',
    '        Visit Lamla AI',
    '      </a>',
    '    </div>',

    socialLinksHtml(),

    '    <p style="font-size:12px;color:#555;text-align:center;margin-top:8px;">',
    '      © 2026 ' + SITE_NAME + '. All rights reserved.<br>Study Smarter, Perform Better.',
    '    </p>',
    '    <p style="font-size:11px;color:#888;text-align:center;margin-top:4px;">',
    '      This email was sent to ' + escHtml(email) + ' for your security.',
    '    </p>',

    '  </div>',
    '</body></html>',
  ].join("\n");

  GmailApp.sendEmail(to, subject, stripHtml(html), { htmlBody: html });
  cfg_log("User acknowledgment sent to " + to);
}


// ── Shared helpers ────────────────────────────────────────────────────────────

function socialLinksHtml() {
  var base  = "https://staticassets.netlify.app/public/icons/social/";
  var links = [
    ["https://www.instagram.com/lamla.io",                       base + "instagram.png"],
    ["https://www.linkedin.com/company/lamla-ai",                base + "linkedin.png"],
    ["https://www.facebook.com/people/LamlaAI/61578006032583/",  base + "facebook.png"],
    ["https://x.com/lamla.ai",                                   base + "twitter.png"],
  ];
  var items = links.map(function(l) {
    return '<a href="' + l[0] + '" style="margin:0 6px;display:inline-block;"><img src="' + l[1] + '" width="20" height="20"></a>';
  });
  return '<div style="text-align:center;margin:18px 0;">' + items.join("") + '</div>';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
