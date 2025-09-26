// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import prisma, { prismaReady } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rateLimiter";
import { z } from "zod";

export const runtime = "nodejs";

/** Zod schema for input validation */
const RegisterSchema = z.object({
  name:     z.string().min(3, "Name must be at least 3 characters"),
  email:    z.email("Invalid email address"),
  phone:    z.string().min(7, "Phone number too short"),
  country:  z.string().optional(),
  state:    z.string().optional(),
  address:  z.string().min(5, "Address must be at least 5 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

/** Human-friendly customer ID, unique enough for practical use */
function generateCustomerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 7; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `M-CUS${suffix}`;
}

export async function POST(request: Request) {
  try {
    await prismaReady;

    // Basic rate limiting by IP (trust first x-forwarded-for when present)
    const xff = request.headers.get("x-forwarded-for") ?? "";
    const ip  = xff.split(",")[0].trim() || "unknown";
    const { ok, reset } = rateLimit(ip);
    if (!ok) {
      const wait = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: `Too many requests. Try again in ${wait}s.` },
        { status: 429 }
      );
    }

    // Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, email, phone, country, state, address, password } = parsed.data;
    const emailNorm = normalizeEmail(email);

    // Case-insensitive uniqueness check
    const existing = await prisma.customer.findFirst({
      where: { email: { equals: emailNorm, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    // Safe name split
    const parts = name.trim().split(/\s+/);
    const firstName = parts.shift() ?? "";
    const lastName  = parts.join(" ");

    // Hash password & create verification token
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = randomUUID();
    const verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Branded customer ID (overrides default if your schema has @default(cuid()))
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

    // Send verification email (do not await to avoid blocking)
    sendVerificationEmail(emailNorm, verificationToken).catch(err =>
      console.error("[sendVerificationEmail] error:", err)
    );

    return NextResponse.json(
      { message: "Registration successful. Check your email to verify.", id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/register] error:", err);
    return NextResponse.json(
      { error: "Unable to register right now." },
      { status: 500 }
    );
  }
}
