import { prisma } from "@/lib/db";
import OrderInventoryClient from "./OrderInventoryClient";
import EmptyState from "@/components/admin/EmptyState";
import type { OrderRow } from "@/types/orders";

export const dynamic = "force-dynamic"; // ensure fresh data (optional)

async function fetchOrders(): Promise<OrderRow[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          deliveryAddress: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          image: true,
          color: true,
          size: true,
          quantity: true,
          lineTotal: true,
          currency: true,
        },
      },
    },
  });

  // Map DB -> OrderRow
  return orders.map(o => {
    // original totalAmount is stored (already aggregated) but we also trust persisted totalAmount field.
    return {
      id: o.id,
      status: o.status,
      currency: o.currency,
      totalAmount: o.totalAmount,
      totalNGN: o.totalNGN,
      createdAt: o.createdAt.toISOString(),
      paymentMethod: o.paymentMethod,
      customer: {
        id: o.customer.id,
        name: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        email: o.customer.email,
        phone: o.customer.phone,
        address: o.customer.deliveryAddress || "—",
      },
      products: o.items.map(it => ({
        id: it.id,
        name: it.name,
        image: it.image,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
    };
  });
}

export default async function OrderInventoryPage() {
  const orders = await fetchOrders();

  if (orders.length === 0) {
    return (
      <div className="py-6 px-3">
        <EmptyState
          iconName="Package"
            title="No orders yet"
          message="When customers place orders they will appear here for processing."
        />
      </div>
    );
  }

  return <OrderInventoryClient initialData={orders} />;
}
