import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { JobRole, UserRole } from "@/lib/generated/prisma-client";


function randomPassword(len = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requiredString = (v: any) => typeof v === "string" && v.trim().length;

  const {
    firstName,
    middleName,
    lastName,
    email,
    emailPersonal,
    phone,
    address,
    jobRoles,
    access,
    dateOfBirth,
    dateOfEmployment,
    dateOfResignation,
    guarantorName,
    guarantorAddress,
    guarantorPhone,
    password,
    generatePassword,
  } = body || {};

  // Basic validation
  if (!requiredString(firstName))
    return NextResponse.json({ error: "firstName required" }, { status: 400 });
  if (!requiredString(lastName))
    return NextResponse.json({ error: "lastName required" }, { status: 400 });
  if (!requiredString(email))
    return NextResponse.json({ error: "email required" }, { status: 400 });
  if (!requiredString(phone))
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  if (
    !Array.isArray(jobRoles) ||
    jobRoles.length === 0 ||
    !jobRoles.every(r => typeof r === "string")
  )
    return NextResponse.json(
      { error: "jobRoles must be non-empty string array" },
      { status: 400 }
    );
  if (!requiredString(access))
    return NextResponse.json({ error: "access required" }, { status: 400 });

  let rawPassword: string =
    generatePassword ? randomPassword() : (password as string);

  if (!rawPassword || rawPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  try {
    const created = await prisma.staff.create({
      data: {
        firstName: firstName.trim(),
        middleName: middleName?.trim() || "",
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        emailPersonal: emailPersonal?.trim() || null,
        phone: phone.trim(),
        address: address?.trim() || null,
        jobRoles: jobRoles as JobRole[],
        access: access as UserRole,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfEmployment: dateOfEmployment
          ? new Date(dateOfEmployment)
          : undefined,
        dateOfResignation: dateOfResignation
          ? new Date(dateOfResignation)
          : null,
        guarantorName: guarantorName?.trim() || null,
        guarantorAddress: guarantorAddress?.trim() || null,
        guarantorPhone: guarantorPhone?.trim() || null,
        passwordHash,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobRoles: true,
        access: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      staff: created,
      generatedPassword: generatePassword ? rawPassword : undefined,
    });
  } catch (e: any) {
    console.error("Create staff error:", e);
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
