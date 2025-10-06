// lib/mail.ts
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import { renderReceiptHTML } from "@/lib/receipt/html";

/* ---------- Brand Tokens ---------- */
const BRAND_NAME = "Marobi";
const BRAND_COLOR = "#043927";
const BRAND_ACCENT = "#FFC300";
const BG_OUTER = "#f3f4f6";
const CARD_BG = "#ffffff";
const TEXT_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const BORDER_RADIUS = "8px";

/* ---------- Transporter ---------- */
/**
 * Use Gmail (or any SMTP that supports SSL on 465).
 * If you want a custom From domain (e.g., no-reply@yourdomain.com),
 * either configure "Send mail as" in Gmail or switch to a provider
 * like Resend/Mailgun/SendGrid with proper SPF/DKIM.
 */
const smtpHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const smtpPort = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465;
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS;

if (!smtpUser || !smtpPass) {
  console.warn(
    "[mail] WARNING: EMAIL_USER or EMAIL_PASS not set. Outbound emails will fail until configured."
  );
}

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: true, // SSL on 465 is most reliable across networks
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,

  // Small connection pool improves reliability during bursts
  pool: true,
  maxConnections: 1,
  maxMessages: 50,

  // Give slower networks time to complete TLS handshake
  connectionTimeout: 20_000,
  greetingTimeout: 20_000,
  socketTimeout: 20_000,

  // Keep TLS strict; do not disable cert checks
  tls: { minVersion: "TLSv1.2" },
});

transporter
  .verify()
  .then(() => console.info("[mail] SMTP transporter verified and ready."))
  .catch((err) => console.warn("⚠️ Email transporter verification failed:", err));

/* ---------- Generic templated email shell ---------- */
interface RenderEmailOptions {
  title: string;
  intro?: string;
  bodyHtml?: string;
  highlightCode?: string;
  note?: string;
  button?: { label: string; url: string; color?: string };
  footerNote?: string;
  headerColor?: string;
  preheader?: string;
}
export function renderEmail(opts: RenderEmailOptions): string {
  const {
    title, intro, bodyHtml, highlightCode, note, button, footerNote, headerColor, preheader,
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
            ${footerNote ? `<tr><td style="padding:0 32px 8px;font-size:12px;color:${MUTED_COLOR};font-family:Arial,Helvetica,sans-serif;">${footerNote}</td></tr>` : ""}
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

/* ---------- Specific emails (verification, reset, generic, status) ---------- */
export async function sendVerificationEmail(email: string, token: string) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
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
    button: { label: "Verify My Email", url: verifyUrl },
    preheader: "Verify your email to finish setting up your Marobi account.",
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Verify your ${BRAND_NAME} account`,
    html,
  });
}

export async function sendResetPasswordEmail(email: string, opts: { resetUrl: string }) {
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
    button: { label: "Reset Password", url: resetUrl, color: BRAND_ACCENT },
    preheader: "Reset your Marobi password securely.",
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Reset your ${BRAND_NAME} password`,
    html,
  });
}

export async function sendGenericEmail(args: {
  to: string; subject: string; title: string; intro?: string; bodyHtml?: string;
  button?: { label: string; url: string; color?: string }; footerNote?: string; preheader?: string;
}) {
  const { to, subject, title, intro, bodyHtml, button, footerNote, preheader } = args;
  const html = renderEmail({ title, intro, bodyHtml, button, footerNote, preheader });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to, subject, html,
  });
}

export async function sendStatusEmail(params: { to: string; name: string; orderId: string; status: string }) {
  const { to, name, orderId, status } = params;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendGenericEmail({
    to,
    subject: `Your order ${orderId} Status: ${status}`,
    title: `Order ${orderId} — ${status}`,
    intro: `Hi ${name},`,
    bodyHtml: `<p>Your order <strong>${orderId}</strong> has been <strong>${status}</strong>.</p>`,
    button: { label: "View Your Orders", url: `${baseUrl}/account` },
    preheader: `Your order has been ${status}`,
    footerNote: "Questions? Just reply to this email and we’ll help.",
  });
}

/* ---------- Receipt sending (shared renderer + PDF) ---------- */
function computeBackoffSeconds(attempts: number) {
  const base = 60, max = 3600;
  return Math.min(base * Math.pow(2, attempts - 1), max);
}

export async function sendReceiptEmailWithRetry({
  order, recipient, currency, deliveryFee,
}: {
  order: any;
  recipient: { firstName: string; lastName: string; email: string; phone?: string; deliveryAddress?: string; billingAddress?: string; };
  currency: string;
  deliveryFee: number;
}) {
  const to = recipient.email;

  // Shared, brand-consistent HTML for email + admin
  const html = renderReceiptHTML({
    order,
    recipient,
    currency: (currency as any) || "NGN",
    deliveryFee,
  });

  // PDF invoice (also shows size-mod details)
  const pdfBuffer = await generateInvoicePDF({
    order,
    recipient,
    currency: (currency as any) || "NGN",
    deliveryFee,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: `Invoice for order ${order.id}`,
      html,
      attachments: [{ filename: `invoice-${order.id}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });

    await prisma.receiptEmailStatus.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, attempts: 1, sent: true, deliveryFee },
      update: { attempts: { increment: 1 }, sent: true, lastError: null, nextRetryAt: null, deliveryFee },
    });
  } catch (err: any) {
    const msg = (err?.message || String(err)).slice(0, 1000);
    const existing = await prisma.receiptEmailStatus.findUnique({ where: { orderId: order.id } });
    const attempts = (existing?.attempts ?? 0) + 1;
    const backoff = computeBackoffSeconds(attempts);
    const nextRetry = new Date(Date.now() + backoff * 1000);

    await prisma.receiptEmailStatus.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, attempts, lastError: msg, nextRetryAt: nextRetry, sent: false, deliveryFee },
      update: { attempts, lastError: msg, nextRetryAt: nextRetry, sent: false, deliveryFee },
    });

    console.warn(`Receipt email send failed for order ${order.id}, retry at ${nextRetry.toISOString()}`, err);
    throw err;
  }
}
