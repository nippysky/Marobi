// app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.customer.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      )
    }

    const token = randomUUID()
    const expiry = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.customer.update({
      where: { email },
      data: {
        verificationToken: token,
        verificationTokenExpiry: expiry,
      },
    })

    // send the fresh code
    await sendVerificationEmail(email, token)

    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 200 }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    )
  }
}
