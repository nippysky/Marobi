import ResetPasswordClient from "@/components/admin/ResetPasswordClient";
import { prisma } from "@/lib/db";


export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // pull your token off safely
  const raw = searchParams.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  if (!token) {
    return <p className="p-6">Invalid reset link.</p>;
  }

  const staff = await prisma.staff.findFirst({
    where: {
      resetToken:        token,
      resetTokenExpiry: { gt: new Date().toISOString() },
    },
    select: { id: true },
  });

  if (!staff) {
    return <p className="p-6">This link is invalid or has expired.</p>;
  }

  return <ResetPasswordClient token={token} />;
}
