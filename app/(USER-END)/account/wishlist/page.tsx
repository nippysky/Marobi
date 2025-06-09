import WishlistSection from "@/components/account/WishlistSection";
import Link from "next/link";

export default function WishlistPage() {
  return (
    <>
      <nav className="text-sm mb-6">
        <Link
          href="/"
          className="text-gray-700 dark:text-gray-300 hover:underline"
        >
          Home
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link
          href="/account"
          className="text-gray-700 dark:text-gray-300 hover:underline"
        >
          Account
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700 dark:text-gray-300">Wishlist</span>
      </nav>

      <WishlistSection />
    </>
  );
}
