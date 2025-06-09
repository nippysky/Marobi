import OrdersSection from "@/components/account/OrderSection";
import Link from "next/link";

export default function OrdersPage() {
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
        <span className="text-gray-700 dark:text-gray-300">Orders</span>
      </nav>

      <OrdersSection />
    </>
  );
}
