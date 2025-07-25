import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import WishlistSection from "@/app/(USER-END)/account/wishlist/WishlistSection"

export default async function WishlistPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/auth/login")

  return (
    <>
      <nav className="text-sm mb-6">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link href="/account" className="hover:underline">
          Account
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span>Wishlist</span>
      </nav>

      <WishlistSection />
    </>
  )
}
