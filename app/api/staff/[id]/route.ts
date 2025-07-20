import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { JobRole, UserRole } from "@/lib/generated/prisma-client";


export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
    password, // optional new password
  } = body || {};

  if (!firstName || !lastName || !email || !phone)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (
    !Array.isArray(jobRoles) ||
    jobRoles.length === 0 ||
    !jobRoles.every(r => typeof r === "string")
  )
    return NextResponse.json(
      { error: "jobRoles must be non-empty string array" },
      { status: 400 }
    );
  if (!access)
    return NextResponse.json({ error: "access required" }, { status: 400 });

  let passwordHash: string | undefined;
  if (password) {
    if (String(password).length < 6)
      return NextResponse.json(
        { error: "Password must be >= 6 characters" },
        { status: 400 }
      );
    passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const updated = await prisma.staff.update({
      where: { id },
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
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobRoles: true,
        access: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (e: any) {
    console.error("Update staff error:", e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}
