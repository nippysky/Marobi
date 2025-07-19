import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/account/OrdersTable";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const userWithOrders = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          currency: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });
  if (!userWithOrders) redirect("/auth/login");

  // convert dates to strings for the table
  const ordersForTable = userWithOrders.orders.map((o) => ({
    id: o.id,
    status: o.status,
    currency: o.currency,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="text-sm mb-6">
        <Link href="/" className="text-gray-700 hover:underline">
          Home
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link href="/account" className="text-gray-700 hover:underline">
          Account
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700">Orders</span>
      </nav>

      <section>
        <h2 className="text-lg font-semibold mb-4">Your Orders</h2>
        {ordersForTable.length > 0 ? (
          <OrdersTable orders={ordersForTable} />
        ) : (
          <div className="text-center py-10">
            <p className="mb-4">You haven’t placed any orders yet.</p>
            <Link href="/all-products">
              <Button>Shop Now</Button>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
