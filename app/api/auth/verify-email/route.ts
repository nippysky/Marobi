// app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 })
  }

  const user = await prisma.customer.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: { gt: new Date() }
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 })
  }

  await prisma.customer.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    }
  })

  return NextResponse.json({ message: 'Email verified.' })
}
