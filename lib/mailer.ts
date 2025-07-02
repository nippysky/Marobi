import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// send a quick plain-html email
export async function sendStatusEmail(
  to: string,
  orderId: string,
  newStatus: string
) {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Your order ${orderId} is now ${newStatus}`,
    html: `
      <h2>Order ${orderId} Updated</h2>
      <p>Hi there,</p>
      <p>Your order <strong>${orderId}</strong> status has been updated to <strong>${newStatus}</strong>.</p>
      <p>Thank you for shopping with Marobi!</p>
    `,
  });
  return info;
}
