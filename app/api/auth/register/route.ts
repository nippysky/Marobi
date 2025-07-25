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

function generateCustomerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 7; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `M-CUS${suffix}`;
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

  // Check for existing (case-insensitive)
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

  // Hash password & generate verification token
  const passwordHash            = await bcrypt.hash(password, 12);
  const verificationToken       = randomUUID();
  const verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Generate branded customer ID
  const id = generateCustomerId();

  await prisma.customer.create({
    data: {
      id,
      firstName,
      lastName,
      email: emailNorm,
      phone,
      country: country ?? null,
      state: state ?? null,
      deliveryAddress: address,
      billingAddress: null,
      passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    },
  });

  // Send verification email (fire & forget)
  sendVerificationEmail(emailNorm, verificationToken).catch(err =>
    console.error("sendVerificationEmail error:", err)
  );

  return NextResponse.json(
    { message: "Registration successful. Check your email to verify.", id },
    { status: 201 }
  );
}
