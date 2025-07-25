import ResetPasswordClient from "@/components/admin/ResetPasswordClient";
import { prisma } from "@/lib/db";
import { ReactNode } from "react";

interface PageProps {
  searchParams: {
    token?: string | string[];
  };
}

export default async function AdminResetPasswordPage({
  searchParams,
}: PageProps): Promise<ReactNode> {
  // searchParams.token might be a string or string[]
  const raw = searchParams.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  if (!token) {
    return <p className="p-6">Invalid reset link.</p>;
  }

  // Compare expiry against ISO string (prisma.staff.resetTokenExpiry is stored as string)
  const staff = await prisma.staff.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date().toISOString() },
    },
    select: { id: true },
  });

  if (!staff) {
    return <p className="p-6">This link is invalid or has expired.</p>;
  }

  return <ResetPasswordClient token={token} />;
}
