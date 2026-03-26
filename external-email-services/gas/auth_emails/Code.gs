// ═══════════════════════════════════════════════════════════════════════════════
// Code.gs — Auth Emails
//
// Request handling only. No HTML here — see Templates.gs.
// All config lives in Config.gs.
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
//     "secret":      "<GAS_AUTH_EMAIL_SECRET>",
//     "type":        "verification" | "password_reset",
//     "to_email":    "user@example.com",
//     "user_name":   "Alice",            // optional, falls back to email
//     "action_link": "https://..."
//   }
// ═══════════════════════════════════════════════════════════════════════════════


// ── Entry points ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var secret = cfg_secret();

    // Secret is mandatory — reject if not configured in Script Properties or doesn't match.
    // This closes the bypass where a missing GAS_SECRET would accept any request.
    if (!secret || data.secret !== secret) {
      cfg_log("Unauthorized request blocked");
      return jsonResponse({ success: false, error: "Unauthorized" });
    }

    var type       = data.type        || "";
    var toEmail    = (data.to_email   || "").trim();
    var userName   = (data.user_name  || toEmail).trim();
    var actionLink = data.action_link || "";

    if (!type || !toEmail) {
      return jsonResponse({ success: false, error: "Missing required fields" });
    }

    // Validate action_link must originate from our own site — prevents link injection.
    if (actionLink && !actionLink.startsWith(SITE_URL)) {
      cfg_log("Blocked request with untrusted action_link: " + actionLink);
      return jsonResponse({ success: false, error: "Untrusted action_link domain" });
    }

    cfg_log("Auth email request: type=" + type + " to=" + toEmail);

    if (type === "verification") {
      if (!actionLink) return jsonResponse({ success: false, error: "Missing required fields" });
      sendVerificationEmail(toEmail, userName, actionLink);
    } else if (type === "password_reset") {
      if (!actionLink) return jsonResponse({ success: false, error: "Missing required fields" });
      sendPasswordResetEmail(toEmail, userName, actionLink);
    } else {
      cfg_log("Rejected unknown or disallowed email type: " + type);
      return jsonResponse({ success: false, error: "Unknown email type: " + type });
    }

    return jsonResponse({ success: true });

  } catch (err) {
    cfg_log("ERROR: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// Health-check
function doGet(e) {
  return jsonResponse({ status: "ok" });
}


// ── Email senders ─────────────────────────────────────────────────────────────

function sendVerificationEmail(toEmail, userName, verifyLink) {
  var to      = cfg_recipientEmail(toEmail);
  var subject = SITE_NAME + " - Please Confirm Your Email Address";
  GmailApp.sendEmail(to, subject, buildVerificationText(userName, verifyLink), {
    htmlBody: buildVerificationHtml(userName, verifyLink, toEmail),
  });
  cfg_log("Verification email sent to " + to);
}

function sendPasswordResetEmail(toEmail, userName, resetLink) {
  var to      = cfg_recipientEmail(toEmail);
  var subject = SITE_NAME + " - Reset Your Password";
  GmailApp.sendEmail(to, subject, buildPasswordResetText(userName, resetLink), {
    htmlBody: buildPasswordResetHtml(userName, resetLink, toEmail),
  });
  cfg_log("Password reset email sent to " + to);
}


// ── Util ──────────────────────────────────────────────────────────────────────

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
