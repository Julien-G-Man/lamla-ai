// ═══════════════════════════════════════════════════════════════════════════════
// Code.gs — Auth Emails
//
// Handles POST requests from the Lamla AI Django backend to send auth emails.
// All config lives in Config.gs — do not hard-code values here.
//
// DEPLOY:
//   Extensions → Apps Script → Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
//
// After deploying:
//   1. Copy the Web App URL → set on Render: GAS_AUTH_EMAIL_URL=<url>
//   2. Generate a random secret → set on Render: GAS_AUTH_EMAIL_SECRET=<secret>
//      Set the same value in Script Properties as GAS_SECRET (see Config.gs)
//
// Expected POST body (JSON):
//   {
//     "secret":      "<GAS_AUTH_EMAIL_SECRET>",   // required if GAS_SECRET is set
//     "type":        "verification" | "password_reset",
//     "to_email":    "user@example.com",
//     "user_name":   "Alice",                     // optional, falls back to email
//     "action_link": "https://..."
//   }
// ═══════════════════════════════════════════════════════════════════════════════


// ── Entry points ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data    = JSON.parse(e.postData.contents);
    var secret  = cfg_secret();

    // Verify shared secret if one is configured in Script Properties
    if (secret && data.secret !== secret) {
      cfg_log("Unauthorized request blocked");
      return jsonResponse({ success: false, error: "Unauthorized" });
    }

    var type       = data.type        || "";
    var toEmail    = (data.to_email   || "").trim();
    var userName   = (data.user_name  || toEmail).trim();
    var actionLink = data.action_link || "";

    if (!type || !toEmail || !actionLink) {
      return jsonResponse({ success: false, error: "Missing required fields" });
    }

    cfg_log("Auth email request: type=" + type + " to=" + toEmail);

    if (type === "verification") {
      sendVerificationEmail(toEmail, userName, actionLink);
    } else if (type === "password_reset") {
      sendPasswordResetEmail(toEmail, userName, actionLink);
    } else {
      return jsonResponse({ success: false, error: "Unknown email type: " + type });
    }

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


// ── Email senders ─────────────────────────────────────────────────────────────

function sendVerificationEmail(toEmail, userName, verifyLink) {
  var to      = cfg_recipientEmail(toEmail);
  var subject = SITE_NAME + " - Please Confirm Your Email Address";
  var html    = buildVerificationHtml(userName, verifyLink, toEmail);
  var text    = buildVerificationText(userName, verifyLink);
  GmailApp.sendEmail(to, subject, text, { htmlBody: html });
  cfg_log("Verification email sent to " + to);
}

function sendPasswordResetEmail(toEmail, userName, resetLink) {
  var to      = cfg_recipientEmail(toEmail);
  var subject = SITE_NAME + " - Reset Your Password";
  var html    = buildPasswordResetHtml(userName, resetLink, toEmail);
  var text    = buildPasswordResetText(userName, resetLink);
  GmailApp.sendEmail(to, subject, text, { htmlBody: html });
  cfg_log("Password reset email sent to " + to);
}


// ── HTML builders ─────────────────────────────────────────────────────────────

function buildVerificationHtml(userName, verifyLink, realEmail) {
  return [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"><title>Verify Your Email - ' + SITE_NAME + '</title></head>',
    '<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#000;">',
    '  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:28px;">',

    '    <div style="text-align:center;margin-bottom:18px;">',
    '      <img src="' + LOGO_URL + '" alt="' + SITE_NAME + '" style="max-width:160px;">',
    '    </div>',
    '    <div style="height:4px;background:#FFD400;margin:24px 0;"></div>',

    TEST_MODE ? '    <p style="background:#fff3cd;padding:8px;font-size:13px;">⚠️ TEST MODE — real recipient was: ' + escHtml(realEmail) + '</p>' : '',

    '    <h1 style="font-size:22px;margin-bottom:14px;">Verify your email</h1>',
    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">Hello ' + escHtml(userName) + ',</p>',
    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">',
    '      Welcome to <strong>' + SITE_NAME + '</strong>.',
    '      Before you can start using Lamla, please confirm your email address.',
    '    </p>',

    '    <div style="background:#FFD400;padding:12px;font-weight:bold;text-align:center;margin:22px 0;">',
    '      Activate your account to begin using Lamla AI.',
    '    </div>',

    '    <div style="text-align:center;margin:30px 0;">',
    '      <a href="' + verifyLink + '" style="background:#000;color:#fff;text-decoration:none;padding:14px 24px;font-size:15px;font-weight:bold;border-radius:5px;display:inline-block;">',
    '        Verify Email',
    '      </a>',
    '    </div>',

    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">',
    '      If the button above does not work, copy and paste the link below into your browser:',
    '    </p>',
    '    <div style="font-size:13px;background:#f2f2f2;padding:12px;word-break:break-all;">' + verifyLink + '</div>',

    '    <p style="font-size:15px;line-height:1.6;margin-top:16px;">',
    '      If you did not create an account on ' + SITE_NAME + ', you can safely ignore this email.',
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

    '  </div>',
    '</body></html>',
  ].join("\n");
}


function buildPasswordResetHtml(userName, resetLink, realEmail) {
  return [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"><title>Reset Your Password - ' + SITE_NAME + '</title></head>',
    '<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#000;">',
    '  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:28px;">',

    '    <div style="text-align:center;margin-bottom:18px;">',
    '      <img src="' + LOGO_URL + '" alt="' + SITE_NAME + '" style="max-width:160px;">',
    '    </div>',
    '    <div style="height:4px;background:#FFD400;margin:24px 0;"></div>',

    TEST_MODE ? '    <p style="background:#fff3cd;padding:8px;font-size:13px;">⚠️ TEST MODE — real recipient was: ' + escHtml(realEmail) + '</p>' : '',

    '    <h1 style="font-size:22px;margin-bottom:14px;">Reset your password</h1>',
    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">Hello ' + escHtml(userName) + ',</p>',
    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">',
    '      We received a request to reset the password for your <strong>' + SITE_NAME + '</strong> account.',
    '      Click the button below to set a new password.',
    '    </p>',

    '    <div style="background:#FFD400;padding:12px;font-weight:bold;text-align:center;margin:22px 0;">',
    '      This link expires in 24 hours. If you did not request a reset, ignore this email.',
    '    </div>',

    '    <div style="text-align:center;margin:30px 0;">',
    '      <a href="' + resetLink + '" style="background:#000;color:#fff;text-decoration:none;padding:14px 24px;font-size:15px;font-weight:bold;border-radius:5px;display:inline-block;">',
    '        Reset Password',
    '      </a>',
    '    </div>',

    '    <p style="font-size:15px;line-height:1.6;margin-bottom:16px;">',
    '      If the button above does not work, copy and paste the link below into your browser:',
    '    </p>',
    '    <div style="font-size:13px;background:#f2f2f2;padding:12px;word-break:break-all;">' + resetLink + '</div>',

    '    <p style="font-size:15px;line-height:1.6;margin-top:16px;">&#8212; The ' + SITE_NAME + ' Team</p>',

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

    '  </div>',
    '</body></html>',
  ].join("\n");
}


// ── Text fallbacks ────────────────────────────────────────────────────────────

function buildVerificationText(userName, verifyLink) {
  return [
    "Hello " + userName + ",",
    "",
    "Welcome to " + SITE_NAME + "!",
    "",
    "Please verify your email by visiting the link below:",
    verifyLink,
    "",
    "If you did not create an account, you can safely ignore this email.",
    "",
    "— The " + SITE_NAME + " Team",
  ].join("\n");
}

function buildPasswordResetText(userName, resetLink) {
  return [
    "Hello " + userName + ",",
    "",
    "We received a request to reset your " + SITE_NAME + " password.",
    "",
    "Reset your password by visiting the link below:",
    resetLink,
    "",
    "This link expires in 24 hours.",
    "If you did not request a reset, you can safely ignore this email.",
    "",
    "— The " + SITE_NAME + " Team",
  ].join("\n");
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

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
