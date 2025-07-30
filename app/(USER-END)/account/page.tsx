import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileSection from "./ProfileSection";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const user = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      deliveryAddress: true,
      billingAddress: true,
      country: true,
      state: true,
      registeredAt: true,
      lastLogin: true,
    },
  });
  if (!user) redirect("/auth/login");

  // build a fully non-nullable profile object
  const profile = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.deliveryAddress ?? "",
    billingAddress: user.billingAddress ?? "",
    country: user.country ?? "",
    state: user.state ?? "",
    registeredAt: user.registeredAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() ?? null,
  };

  return (
    <>
      <nav className="text-sm text-gray-600 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="font-medium">Account</span>
      </nav>
      <ProfileSection user={profile} />
    </>
  );
}
