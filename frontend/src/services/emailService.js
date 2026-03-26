// src/services/emailService.js
// Sends auth emails (verification, password reset) via EmailJS — no backend required.
// Templates are managed in the EmailJS dashboard at https://dashboard.emailjs.com/
//
// Required env vars (REACT_APP_ prefix because this is CRA):
//   REACT_APP_EMAILJS_PUBLIC_KEY    — found under Account > API Keys
//   REACT_APP_EMAILJS_SERVICE_ID    — found under Email Services
//   REACT_APP_EMAILJS_TEMPLATE_VERIFY  — template ID for verification emails
//   REACT_APP_EMAILJS_TEMPLATE_RESET   — template ID for password reset emails
//
// Each template must have these variables wired up in the EmailJS dashboard:
//   Verification : {{to_email}}, {{user_name}}, {{verify_link}}
//   Password reset: {{to_email}}, {{user_name}}, {{reset_link}}
//
// To send to a dynamic recipient set the "To Email" field in the template to {{to_email}}.

import emailjs from "@emailjs/browser";

const PUBLIC_KEY   = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const SERVICE_ID   = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_VERIFY = process.env.REACT_APP_EMAILJS_TEMPLATE_VERIFY;
const TEMPLATE_RESET  = process.env.REACT_APP_EMAILJS_TEMPLATE_RESET;

/**
 * Send an email verification link to a newly-registered (or re-requesting) user.
 *
 * @param {object} params
 * @param {string} params.toEmail   - Recipient email address
 * @param {string} params.userName  - Display name or username
 * @param {string} params.verifyLink - Full verification URL with uid+token
 */
export const sendVerificationEmail = ({ toEmail, userName, verifyLink }) => {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_VERIFY) {
    console.warn("[emailService] EmailJS not configured — skipping verification email.");
    return Promise.resolve();
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_VERIFY,
    {
      to_email:    toEmail,
      user_name:   userName,
      verify_link: verifyLink,
    },
    PUBLIC_KEY
  );
};

/**
 * Send a password-reset link to an existing user.
 *
 * @param {object} params
 * @param {string} params.toEmail   - Recipient email address
 * @param {string} params.userName  - Display name or username
 * @param {string} params.resetLink - Full reset URL with uid+token
 */
export const sendPasswordResetEmail = ({ toEmail, userName, resetLink }) => {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_RESET) {
    console.warn("[emailService] EmailJS not configured — skipping password reset email.");
    return Promise.resolve();
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_RESET,
    {
      to_email:   toEmail,
      user_name:  userName,
      reset_link: resetLink,
    },
    PUBLIC_KEY
  );
};
