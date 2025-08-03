// lib/mail.ts
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

/* ---------- Brand Tokens ---------- */
const BRAND_NAME = "Marobi";
const BRAND_COLOR = "#043927"; // primary deep emerald
const BRAND_ACCENT = "#FFC300"; // gold accent
const BG_OUTER = "#f3f4f6";
const CARD_BG = "#ffffff";
const TEXT_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const BORDER_RADIUS = "8px";

/* ---------- Transporter ---------- */
/**
 * SMTP configuration:
 * - EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS should be set in env.
 * - For Gmail: if using a Google account with 2FA enabled you must create an "App Password"
 *   and use that as EMAIL_PASS. Regular account password will often fail or be blocked.
 * - Consider using a transactional provider (SendGrid, Mailgun, etc.) for reliability.
 */
const smtpHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const smtpPort = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587; // prefer 587 (STARTTLS)
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS;

if (!smtpUser || !smtpPass) {
  console.warn(
    "[mail] WARNING: EMAIL_USER or EMAIL_PASS not set. Outbound emails will fail until configured."
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true if using port 465
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
  tls: {
    rejectUnauthorized: false, // in production you might want to enforce true
  },
});

// Verify transporter once at startup (non-blocking)
transporter
  .verify()
  .then(() => {
    console.info("[mail] SMTP transporter verified and ready.");
  })
  .catch((err) => {
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

  const year = new Date().getFullYear();
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
          <tr>
            <td style="background:${headerBg};padding:20px 24px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#ffffff;margin:0;font-family:Arial,Helvetica,sans-serif;">
                ${BRAND_NAME}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;color:${TEXT_COLOR};font-size:15px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="font-size:20px;margin:0 0 16px;color:${TEXT_COLOR};font-weight:600;letter-spacing:.5px;font-family:Arial,Helvetica,sans-serif;">
                ${title}
              </h1>
              ${intro ? `<p style="margin:0 0 18px;color:${TEXT_COLOR};">${intro}</p>` : ""}
              ${highlightHtml}
              ${bodyHtml ? `<div style="margin:0 0 4px;">${bodyHtml}</div>` : ""}
              ${note ? `<p style="margin:24px 0 0;font-size:13px;color:${MUTED_COLOR};">${note}</p>` : ""}
              ${buttonHtml}
            </td>
          </tr>
          ${
            footerNote
              ? `<tr><td style="padding:0 32px 8px;font-size:12px;color:${MUTED_COLOR};font-family:Arial,Helvetica,sans-serif;">${footerNote}</td></tr>`
              : ""
          }
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
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${base}/auth/verify-email?token=${token}&email=${encodeURIComponent(
    email
  )}`;

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

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Verify your ${BRAND_NAME} account`,
      html,
    });
  } catch (err) {
    console.warn(`[mail] sendVerificationEmail failed for ${email}:`, err);
    throw err;
  }
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
      color: BRAND_ACCENT,
    },
    preheader: "Reset your Marobi password securely.",
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Reset your ${BRAND_NAME} password`,
      html,
    });
  } catch (err) {
    console.warn(`[mail] sendResetPasswordEmail failed for ${email}:`, err);
    throw err;
  }
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
  const { to, subject, title, intro, bodyHtml, button, footerNote, preheader } =
    args;

  const html = renderEmail({
    title,
    intro,
    bodyHtml,
    button,
    footerNote,
    preheader,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.warn(`[mail] sendGenericEmail failed for ${to}:`, err);
    throw err;
  }
}

/** Status update email (wrapper for clarity) */
export async function sendStatusEmail(params: {
  to: string;
  name: string;
  orderId: string;
  status: string;
}) {
  const { to, name, orderId, status } = params;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendGenericEmail({
    to,
    subject: `Your order ${orderId} is now ${status}`,
    title: `Order ${orderId} — ${status}`,
    intro: `Hi ${name},`,
    bodyHtml: `<p>Your order <strong>${orderId}</strong> status has been updated to <strong>${status}</strong>.</p>`,
    button: {
      label: "View Your Orders",
      url: `${baseUrl}/account`,
    },
    preheader: `Your order is now ${status}`,
    footerNote: "Questions? Just reply to this email and we’ll help.",
  });
}

/** Helper to compute exponential backoff in seconds (capped at 1h) */
function computeBackoffSeconds(attempts: number) {
  const base = 60; // 1 minute
  const max = 3600; // 1 hour
  const val = base * Math.pow(2, attempts - 1);
  return Math.min(val, max);
}

/** Unified receipt email sender with retry metadata management */
export async function sendReceiptEmailWithRetry({
  order,
  recipient,
  currency,
  deliveryFee,
}: {
  order: any;
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    deliveryAddress?: string;
    billingAddress?: string;
  };
  currency: string;
  deliveryFee: number;
}) {
  const to = recipient.email;
  const name = `${recipient.firstName} ${recipient.lastName}`;

  const vatRate = 0.075;
  const subtotal = +order.totalAmount.toFixed(2);
  const vat = +(subtotal * vatRate).toFixed(2);
  const deliveryCharge = deliveryFee;
  const grandTotal = +(subtotal + vat + deliveryCharge).toFixed(2);
  const sym =
    currency === "NGN"
      ? "₦"
      : currency === "USD"
      ? "$"
      : currency === "EUR"
      ? "€"
      : "£";

  const lineRows = order.items
    .map((p: any) => {
      return `
        <tr style="border-bottom:1px solid #e1e1e1">
          <td style="padding:8px; vertical-align:top;">
            <div style="display:flex; align-items:center;gap:8px;">
              <img src="${p.image ?? ""}" width="50" style="border-radius:6px; object-fit:cover;" alt="${p.name}" />
              <div>
                <div style="font-weight:600;">${p.name} × ${p.quantity}</div>
                <div style="font-size:12px;color:#555;">
                  Color: ${p.color} • Size: ${p.size}
                  ${
                    p.hasSizeMod
                      ? `<br/>Size Mod Fee: ${sym}${(
                          p.sizeModFee * p.quantity
                        ).toLocaleString()}`
                      : ""
                  }
                </div>
              </div>
            </div>
          </td>
          <td align="right" style="font-family:monospace; padding:8px;">
            ${sym}${p.lineTotal.toLocaleString()}
          </td>
        </tr>`;
    })
    .join("");

  const addressHtml = recipient.deliveryAddress
    ? `<p><strong>Address:</strong> ${recipient.deliveryAddress}</p>`
    : "";

  const bodyHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#333">
      <p style="margin:0 0 12px;">Order <strong>${order.id}</strong> confirmed.</p>
      <p style="margin:0 0 4px;">Payment: <strong>${
        order.paymentMethod
      }</strong> — ${new Date(order.createdAt).toLocaleString()}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:12px;">
        ${lineRows}
      </table>
      <div style="margin-top:24px; font-family:monospace;">
        <p style="margin:4px 0;">
          Subtotal:&nbsp;<strong>${sym}${subtotal.toLocaleString()}</strong>
        </p>
        <p style="margin:4px 0;">
          VAT (7.5%):&nbsp;<strong>${sym}${vat.toLocaleString()}</strong>
        </p>
        <p style="margin:4px 0;">
          Delivery Fee:&nbsp;<strong>${sym}${deliveryCharge.toLocaleString()}</strong>
        </p>
        <p style="margin:8px 0; font-size:16px;">
          <strong>Grand Total:&nbsp;${sym}${grandTotal.toLocaleString()}</strong>
        </p>
      </div>
      <div style="margin-top:16px;font-size:14px;">
        <p><strong>Customer:</strong> ${name}</p>
        <p><strong>Email:</strong> ${to}</p>
        ${
          recipient.phone
            ? `<p><strong>Phone:</strong> ${recipient.phone}</p>`
            : ""
        }
        ${addressHtml}
      </div>
    </div>
  `;

  try {
    await sendGenericEmail({
      to,
      subject: `Your Receipt — Order ${order.id}`,
      title: `Payment Successful`,
      intro: `Hi ${name}, thank you for your purchase! Your order <strong>${order.id}</strong> has been confirmed.`,
      bodyHtml,
      button: {
        label: "Continue Shopping",
        url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/all-products`,
      },
      preheader: `Receipt for order ${order.id}`,
      footerNote: "If you have any questions, reply to this email.",
    });

    // mark as sent / upsert with deliveryFee
    await prisma.receiptEmailStatus.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        attempts: 1,
        sent: true,
        deliveryFee: deliveryFee,
      },
      update: {
        attempts: { increment: 1 },
        sent: true,
        lastError: null,
        nextRetryAt: null,
        deliveryFee: deliveryFee,
      },
    });
  } catch (err: any) {
    const errMsg = (err?.message || String(err)).slice(0, 1000);

    const existing = await prisma.receiptEmailStatus.findUnique({
      where: { orderId: order.id },
    });
    const previousAttempts = existing?.attempts ?? 0;
    const newAttempts = previousAttempts + 1;
    const backoffSec = computeBackoffSeconds(newAttempts);
    const nextRetry = new Date(Date.now() + backoffSec * 1000);

    await prisma.receiptEmailStatus.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        attempts: newAttempts,
        lastError: errMsg,
        nextRetryAt: nextRetry,
        sent: false,
        deliveryFee: deliveryFee,
      },
      update: {
        attempts: newAttempts,
        lastError: errMsg,
        nextRetryAt: nextRetry,
        sent: false,
        deliveryFee: deliveryFee,
      },
    });

    console.warn(
      `Receipt email send failed for order ${order.id}, will retry at ${nextRetry.toISOString()}`,
      err
    );
    throw err;
  }
}

export {
  BRAND_NAME,
  BRAND_COLOR,
  BRAND_ACCENT,
  renderEmail,
  transporter,
};
