// lib/mail.ts
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/pdf/invoice";

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

/* ---------- Teeka4-style Receipt HTML renderer ---------- */
function renderTeekaStyleReceiptEmail({
  order,
  recipient,
  currency,
  deliveryFee,
}: {
  order: {
    id: string;
    createdAt: string | Date;
    items: Array<{
      name: string;
      image?: string | null;
      quantity: number;
      lineTotal: number;
      color?: string | null;
      size?: string | null;
      hasSizeMod?: boolean;
      sizeModFee?: number;
      customSize?: any; // <-- include custom measurements when present
    }>;
    totalAmount: number;
    paymentMethod: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    deliveryAddress?: string;
    billingAddress?: string;
  };
  currency: "NGN" | "USD" | "EUR" | "GBP" | string;
  deliveryFee: number;
}) {
  const sym =
    currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";

  const subtotal = Number(order.totalAmount ?? 0);
  const shipping = Number(deliveryFee ?? 0);
  const total = +(subtotal + shipping).toFixed(2);

  const name = `${recipient.firstName} ${recipient.lastName}`.trim();
  const orderDate = new Date(order.createdAt).toLocaleDateString();

  const lineRows = order.items
    .map((p, i) => {
      const alt = i % 2 === 0 ? "background:#fafafa;" : "";
      const sub: string[] = [];
      if (p.color) sub.push(`Color: ${p.color}`);
      // Precedence: show "Custom" if size-mod present
      if (p.hasSizeMod) {
        sub.push(`Size: Custom`);
      } else if (p.size) {
        sub.push(`Size: ${p.size}`);
      }
      const subLine =
        sub.length ? `<div style="font-size:12px;color:#6b7280">${sub.join(" • ")}</div>` : "";

      const sizeMod =
        p.hasSizeMod && p.sizeModFee
          ? `<div style="font-size:12px;color:#92400e">+5% size-mod fee: ${sym}${(
              p.sizeModFee * p.quantity
            ).toLocaleString()}</div>`
          : "";

      // Custom measurements (compact, muted)
      const cm = (p as any).customSize || {};
      const parts: string[] = [];
      if (cm.chest ?? cm.bust) parts.push(`Chest/Bust: ${cm.chest ?? cm.bust}`);
      if (cm.waist !== undefined) parts.push(`Waist: ${cm.waist}`);
      if (cm.hip !== undefined) parts.push(`Hip: ${cm.hip}`);
      if (cm.length !== undefined) parts.push(`Length: ${cm.length}`);
      const customLine =
        p.hasSizeMod && parts.length
          ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">Custom measurements: ${parts.join(
              " • "
            )}</div>`
          : "";

      return `
      <tr style="${alt}">
        <td style="padding:10px 12px;">
          <div style="display:flex;gap:20px;align-items:flex-start">
            ${
              p.image
                ? `<img src="${p.image}" width="44" height="44" style="object-fit:cover;border-radius:6px;border:1px solid #e5e7eb" />`
                : ""
            }
            <div style="margin-left: 20px;">
              <div style="font-weight:600;color:#111827">${p.name}</div>
              ${subLine}
              ${sizeMod}
              ${customLine}
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;white-space:nowrap;text-align:center;color:#111827">${p.quantity}</td>
        <td style="padding:10px 12px;white-space:nowrap;text-align:right;color:#111827;font-weight:600">${sym}${p.lineTotal.toLocaleString()}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05);">
          <!-- Header -->
          <tr>
            <td style="padding:18px 22px;background:${BRAND_COLOR};color:#fff;">
              <div style="font-size:22px;font-weight:700;">${BRAND_NAME}</div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:16px 22px 0;">
              <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:6px;">Thanks for your order</div>
              <div style="font-size:13px;color:#374151;line-height:1.6;">
                Your order has been packed and would be picked up by a courier soon.
              </div>

              <div style="margin-top:14px;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#374151">
                <strong>ORDER ${order.id}</strong> (${orderDate})
              </div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:12px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb">
                    <th align="left"  style="font-size:12px;color:#6b7280;padding:10px 12px;">Product</th>
                    <th align="center" style="font-size:12px;color:#6b7280;padding:10px 12px;">Quantity</th>
                    <th align="right" style="font-size:12px;color:#6b7280;padding:10px 12px;">Price</th>
                  </tr>
                </thead>
                <tbody>${lineRows}</tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:6px 22px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td style="padding:10px 12px;font-size:13px;color:#111827;">Subtotal</td>
                  <td align="right" style="padding:10px 12px;font-size:13px;color:#111827;">${sym}${subtotal.toLocaleString()}</td>
                </tr>
                <tr style="background:#fafafa">
                  <td style="padding:10px 12px;font-size:13px;color:#111827;">Shipping</td>
                  <td align="right" style="padding:10px 12px;font-size:13px;color:#111827;">${sym}${shipping.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding:12px 12px;font-size:14px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;">Total</td>
                  <td align="right" style="padding:12px 12px;font-size:14px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;">${sym}${total.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CHECKOUT FIELDS -->
          <tr>
            <td style="padding:16px 22px">
              <div style="font-size:12px;color:#374151;margin-bottom:6px;font-weight:700;">CHECKOUT FIELDS</div>
              <ul style="margin:6px 0 0 16px;padding:0;color:#4b5563;font-size:12px;line-height:1.55;">
                <li>Shipping is processed promptly; ensure contact details are accurate for delivery updates.</li>
                <li>If anything looks off, reply to this email immediately.</li>
                <li>Keep your order number handy for support.</li>
              </ul>
            </td>
          </tr>

          <!-- Addresses -->
          <tr>
            <td style="padding:0 22px 18px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" style="width:50%;padding-right:10px;">
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
                      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">BILLING ADDRESS</div>
                      <div style="font-size:12px;color:#111827;white-space:pre-line;">
                        ${name}
                        ${recipient.billingAddress ? `\n${recipient.billingAddress}` : ""}
                        ${recipient.email ? `\n${recipient.email}` : ""}
                      </div>
                    </div>
                  </td>
                  <td valign="top" style="width:50%;padding-left:10px;">
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
                      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">SHIPPING ADDRESS</div>
                      <div style="font-size:12px;color:#111827;white-space:pre-line;">
                        ${name}
                        ${recipient.deliveryAddress ? `\n${recipient.deliveryAddress}` : ""}
                        ${recipient.email ? `\n${recipient.email}` : ""}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 22px;border-top:1px solid #e5e7eb;background:#fafafa;font-size:12px;color:#6b7280;text-align:center;">
              Thanks for shopping with ${BRAND_NAME}.
            </td>
          </tr>
        </table>
        <div style="height:20px">&nbsp;</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

  // Teeka4-style HTML
  const html = renderTeekaStyleReceiptEmail({
    order,
    recipient,
    currency: (currency as any) || "NGN",
    deliveryFee,
  });

  // PDF invoice attachment
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
      attachments: [
        {
          filename: `invoice-${order.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
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
