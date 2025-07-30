import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import WishlistSection from "./WishlistSection";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  return (
    <>
      <nav className="text-sm text-gray-600 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link href="/account" className="hover:underline">Account</Link>
        <span>/</span>
        <span className="font-medium">Wishlist</span>
      </nav>
      <WishlistSection />
    </>
  );
}
