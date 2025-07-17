import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail", // using Gmail for dev; swap to your production SMTP later
  auth: {
    user: process.env.EMAIL_USER, // e.g. your Gmail address
    pass: process.env.EMAIL_PASS, // app‑password or real password
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const link = `${base}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Please verify your email address",
    html: `
      <p>Thanks for registering! Click the link below to verify your email:</p>
      <a href="${link}" target="_blank" rel="noopener">${link}</a>
      <p>This link will expire in one hour.</p>
    `,
  })
}
