import nodemailer from "nodemailer";

/* ---------- Brand Tokens ---------- */
const BRAND_NAME    = "Marobi";
const BRAND_COLOR   = "#043927";  // primary deep emerald
const BRAND_ACCENT  = "#FFC300";  // gold accent
const BG_OUTER      = "#f3f4f6";
const CARD_BG       = "#ffffff";
const TEXT_COLOR    = "#111827";
const MUTED_COLOR   = "#6b7280";
const BORDER_RADIUS = "8px";

/* ---------- Transporter ---------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify().catch(err => {
  console.warn("⚠️ Email transporter verification failed:", err);
});

/* ---------- Email Shell Renderer ---------- */
interface RenderEmailOptions {
  title: string;
  intro?: string;
  bodyHtml?: string;
  highlightCode?: string;
  note?: string;
  button?: {
    label: string;
    url: string;
    color?: string;
  };
  footerNote?: string;
  headerColor?: string;
  preheader?: string; // short hidden preview line
}

function renderEmail(opts: RenderEmailOptions): string {
  const {
    title,
    intro,
    bodyHtml,
    highlightCode,
    note,
    button,
    footerNote,
    headerColor,
    preheader,
  } = opts;

  const year     = new Date().getFullYear();
  const headerBg = headerColor || BRAND_COLOR;

  const buttonHtml = button
    ? `
      <p style="text-align:center;margin:28px 0 4px;">
        <a
          href="${button.url}"
          style="
            display:inline-block;
            background:${button.color || BRAND_COLOR};
            color:#ffffff;
            text-decoration:none;
            font-size:16px;
            font-weight:600;
            padding:12px 28px;
            border-radius:6px;
            letter-spacing:.3px;
          "
          target="_blank"
        >${button.label}</a>
      </p>`
    : "";

  const highlightHtml = highlightCode
    ? `
      <p style="
        font-size:30px;
        font-weight:700;
        letter-spacing:4px;
        text-align:center;
        margin:24px 0 12px;
        color:${BRAND_COLOR};
      ">
        ${highlightCode}
      </p>`
    : "";

  // Hidden preheader (improves inbox preview text)
  const preheaderHtml = preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title} - ${BRAND_NAME}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:${BG_OUTER};font-family:Arial,Segoe UI,sans-serif;">
  ${preheaderHtml}
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${BG_OUTER}">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background:${CARD_BG};border-collapse:separate;border-radius:${BORDER_RADIUS};overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
            <tr>
              <td style="background:${headerBg};padding:20px 24px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#ffffff;margin:0;font-family:Arial,Helvetica,sans-serif;">
                  ${BRAND_NAME}
                </div>
              </td>
            </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 28px;color:${TEXT_COLOR};font-size:15px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="font-size:20px;margin:0 0 16px;color:${TEXT_COLOR};font-weight:600;letter-spacing:.5px;font-family:Arial,Helvetica,sans-serif;">
                ${title}
              </h1>
              ${intro ? `<p style="margin:0 0 18px;color:${TEXT_COLOR};">${intro}</p>` : ""}
              ${highlightHtml}
              ${
                bodyHtml
                  ? `<div style="margin:0 0 4px;">${bodyHtml}</div>`
                  : ""
              }
              ${note ? `<p style="margin:24px 0 0;font-size:13px;color:${MUTED_COLOR};">${note}</p>` : ""}
              ${buttonHtml}
            </td>
          </tr>
          ${
            footerNote
              ? `<tr><td style="padding:0 32px 8px;font-size:12px;color:${MUTED_COLOR};font-family:Arial,Helvetica,sans-serif;">${footerNote}</td></tr>`
              : ""
          }
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 24px;text-align:center;font-size:12px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">
              &copy; ${year} ${BRAND_NAME}. All rights reserved.<br/>
              <span style="color:#9ca3af;">You are receiving this message because you interacted with ${BRAND_NAME}.</span>
            </td>
          </tr>
        </table>
        <div style="height:20px;">&nbsp;</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ---------- Specific Emails ---------- */

/** Email verification (code + link) */
export async function sendVerificationEmail(email: string, token: string) {
  const base      = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${base}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const html = renderEmail({
    title: "Verify Your Email",
    intro: `Welcome to <strong>${BRAND_NAME}</strong>! Use the code below or click the button to verify your account.`,
    highlightCode: token,
    bodyHtml: `
      <p style="margin:18px 0 0;">If the button does not work, copy and paste this URL into your browser:</p>
      <p style="margin:8px 0 0;word-break:break-all;font-size:13px;color:${MUTED_COLOR};">${verifyUrl}</p>
    `,
    note: "This code & link expire in 1 hour.",
    button: {
      label: "Verify My Email",
      url: verifyUrl,
    },
    preheader: "Verify your email to finish setting up your Marobi account.",
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Verify your ${BRAND_NAME} account`,
    html,
  });
}

/** Password reset (link only) */
export async function sendResetPasswordEmail(
  email: string,
  opts: { resetUrl: string }
) {
  const { resetUrl } = opts;

  const html = renderEmail({
    title: "Reset Your Password",
    intro: `We received a request to reset the password for <strong>${email}</strong>.`,
    bodyHtml: `
      <p style="margin:0 0 20px;">Click the button below to choose a new password. If you did not request this, you can safely ignore this email.</p>
      <p style="margin:0 0 6px;font-size:13px;color:${MUTED_COLOR};">If the button does not work, copy this link:</p>
      <p style="margin:0;word-break:break-all;font-size:12px;color:${MUTED_COLOR};">${resetUrl}</p>
    `,
    note: "This link expires in 1 hour.",
    button: {
      label: "Reset Password",
      url: resetUrl,
      color: BRAND_ACCENT, // accent color
    },
    preheader: "Reset your Marobi password securely.",
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Reset your ${BRAND_NAME} password`,
    html,
  });
}

/** Generic transactional / notification email */
export async function sendGenericEmail(args: {
  to: string;
  subject: string;
  title: string;
  intro?: string;
  bodyHtml?: string;
  button?: { label: string; url: string; color?: string };
  footerNote?: string;
  preheader?: string;
}) {
  const {
    to,
    subject,
    title,
    intro,
    bodyHtml,
    button,
    footerNote,
    preheader,
  } = args;

  const html = renderEmail({
    title,
    intro,
    bodyHtml,
    button,
    footerNote,
    preheader,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

export {
  BRAND_NAME,
  BRAND_COLOR,
  BRAND_ACCENT,
};
