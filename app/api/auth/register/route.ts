import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { sendVerificationEmail } from '@/lib/mail'

export async function POST(request: Request) {
  try {
    const { name, email, phone, country, state, address, password } =
      await request.json()

    // 1) Basic validation
    if (!name || !email || !phone || !address || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, address and password are required.' },
        { status: 400 }
      )
    }

    // 2) No duplicate emails
    const exists = await prisma.customer.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json(
        { error: 'Email already registered.' },
        { status: 409 }
      )
    }

    // 3) Split name
    const [firstName, ...rest] = name.trim().split(' ')
    const lastName = rest.join(' ') || ''

    // 4) Hash password
    const hash = await bcrypt.hash(password, 12)

    // 5) Create verification token + expiry (1h)
    const token = randomUUID()
    const expiry = new Date(Date.now() + 1000 * 60 * 60)

    // 6) Persist user *unverified*
    await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address: `${address}${state ? ', ' + state : ''}${
          country ? ', ' + country : ''
        }`,
        passwordHash: hash,
        emailVerified: false,           // ← must be false until they click link
        verificationToken: token,
        verificationTokenExpiry: expiry
      }
    })

    // 7) Email them the link
    //    https://your-domain.com/auth/verify-email?token=TOKEN&email=EMAIL
    sendVerificationEmail(email, token)

    return NextResponse.json(
      { message: 'Registration successful. Check your email to verify.' },
      { status: 201 }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}
