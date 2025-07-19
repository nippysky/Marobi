import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rateLimiter";
import { z } from "zod";

const RegisterSchema = z.object({
  name:     z.string().min(3, "Name must be at least 3 characters"),
  email:    z.string().email("Invalid email address"),
  phone:    z.string().min(7, "Phone number too short"),
  country:  z.string().optional(),
  state:    z.string().optional(),
  address:  z.string().min(5, "Address must be at least 5 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

export async function POST(request: Request) {
  // Rate limit
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { ok, reset } = rateLimit(ip);
  if (!ok) {
    const wait = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Too many requests. Try again in ${wait}s.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(i => i.message).join("; ");
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const { name, email, phone, country, state, address, password } = parsed.data;
  const emailNorm = normalizeEmail(email);

  // Check for existing (case-insensitive safety upgrade)
  const existing = await prisma.customer.findFirst({
    where: { email: { equals: emailNorm, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered." },
      { status: 409 }
    );
  }

  // Split name safely
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts.shift()!;
  const lastName  = nameParts.join(" ");

  const passwordHash            = await bcrypt.hash(password, 12);
  const verificationToken       = randomUUID();
  const verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.customer.create({
    data: {
      firstName,
      lastName,
      email: emailNorm,          // stored normalized
      phone,
      country: country ?? null,
      state: state ?? null,
      deliveryAddress: address,  // correct column
      billingAddress: null,      // optional; user can fill later
      passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    },
  });

  // Send verification (fire & forget)
  await sendVerificationEmail(emailNorm, verificationToken).catch(err =>
    console.error("sendVerificationEmail error:", err)
  );

  return NextResponse.json(
    { message: "Registration successful. Check your email to verify." },
    { status: 201 }
  );
}
