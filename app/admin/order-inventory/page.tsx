// app/admin/order-inventory/page.tsx
import { prisma } from "@/lib/db";
import OrderInventoryClient from "./OrderInventoryClient";
import EmptyState from "@/components/admin/EmptyState";
import type { OrderRow } from "@/types/orders";

export const dynamic = "force-dynamic";

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
          billingAddress: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          image: true,
          category: true,
          color: true,
          size: true,
          quantity: true,
          lineTotal: true,
        },
      },
      // note: guestInfo is a scalar JSON, it will come back automatically
    },
  });

  return orders.map((o) => {
    // Build a unified customer object:
    let customerObj: OrderRow["customer"];
    if (o.customer) {
      customerObj = {
        id:      o.customer.id,
        name:    `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        email:   o.customer.email,
        phone:   o.customer.phone,
        address: o.customer.deliveryAddress ?? o.customer.billingAddress ?? "—",
      };
    } else if (o.guestInfo && typeof o.guestInfo === "object" && !Array.isArray(o.guestInfo)) {
      // guestInfo comes back as a JsonValue
      const gi = o.guestInfo as Record<string, string>;
      customerObj = {
        id:      null,
        name:    `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim() || "Guest",
        email:   gi.email ?? "",
        phone:   gi.phone ?? "",
        address: gi.address ?? "—",
      };
    } else {
      customerObj = {
        id:      null,
        name:    "Guest",
        email:   "",
        phone:   "",
        address: "—",
      };
    }

    return {
      id:            o.id,
      status:        o.status,
      currency:      o.currency,
      totalAmount:   o.totalAmount,
      totalNGN:      o.totalNGN,
      paymentMethod: o.paymentMethod,
      createdAt:     o.createdAt.toISOString(),
      products: o.items.map((it) => ({
        id:        it.id,
        name:      it.name,
        image:     it.image ?? "",
        category:  it.category,
        color:     it.color,
        size:      it.size,
        quantity:  it.quantity,
        lineTotal: it.lineTotal,
      })),
      customer: customerObj,
    };
  });
}

export default async function OrderInventoryPage() {
  const initialData = await fetchOrders();

  if (initialData.length === 0) {
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

  return <OrderInventoryClient initialData={initialData} />;
}
