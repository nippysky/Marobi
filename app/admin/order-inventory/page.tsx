export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import OrderInventoryClient from "./OrderInventoryClient";
import EmptyState from "@/components/admin/EmptyState";
import type { OrderRow } from "@/types/orders";

function normalizeCustomSize(raw: any): Record<string, string> | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== null && v !== undefined) {
        out[k] = String(v);
      }
    }
    return Object.keys(out).length ? out : null;
  }
  return null;
}

function normalizeAddress(o: any): string {
  if (o.customer) {
    return (
      o.customer.deliveryAddress ||
      o.customer.billingAddress ||
      o.customer.country ||
      o.customer.state ||
      "—"
    );
  }
  if (o.guestInfo && typeof o.guestInfo === "object") {
    return (
      o.guestInfo.deliveryAddress ||
      o.guestInfo.address ||
      o.guestInfo.billingAddress ||
      o.guestInfo.country ||
      o.guestInfo.state ||
      "—"
    );
  }
  return "—";
}

function humanizeDeliveryDetails(raw: any, deliveryOption?: any): string {
  if (!raw) return "—";
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return String(raw);

  const entries: string[] = [];
  if (raw.aggregatedWeight) {
    entries.push(
      `Weight: ${parseFloat(raw.aggregatedWeight).toLocaleString()}kg`
    );
  }
  if (deliveryOption?.name) {
    entries.push(`Courier: ${deliveryOption.name}`);
  }
  for (const [k, v] of Object.entries(raw)) {
    if (
      k !== "aggregatedWeight" &&
      k !== "deliveryOptionId" &&
      v != null &&
      v !== ""
    ) {
      entries.push(
        `${k[0].toUpperCase() + k.slice(1)}: ${
          typeof v === "object" ? JSON.stringify(v) : v
        }`
      );
    }
  }
  return entries.length ? entries.join(" • ") : "—";
}

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
          country: true,
          state: true,
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
          hasSizeMod: true,
          sizeModFee: true,
          customSize: true,
          variant: {
            select: {
              product: {
                select: {
                  priceNGN: true,
                },
              },
            },
          },
        },
      },
      offlineSale: true,
      deliveryOption: {
        select: {
          id: true,
          name: true,
          provider: true,
          type: true,
        },
      },
    },
  });

  return orders.map((o) => {
    let customerObj: OrderRow["customer"];
    if (o.customer) {
      customerObj = {
        id: o.customer.id,
        name: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        email: o.customer.email,
        phone: o.customer.phone,
        address: normalizeAddress(o),
      };
    } else if (
      o.guestInfo &&
      typeof o.guestInfo === "object" &&
      !Array.isArray(o.guestInfo)
    ) {
      const gi = o.guestInfo as Record<string, string>;
      customerObj = {
        id: null,
        name: `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim() || "Guest",
        email: gi.email ?? "",
        phone: gi.phone ?? "",
        address: normalizeAddress(o),
      };
    } else {
      customerObj = {
        id: null,
        name: "Guest",
        email: "",
        phone: "",
        address: "—",
      };
    }

    const totalNGN: number = o.items.reduce(
      (sum: number, it) =>
        sum + (it.variant?.product.priceNGN ?? 0) * it.quantity,
      0
    );

    const products = o.items.map((it) => ({
      id: it.id,
      name: it.name,
      image: it.image ?? "",
      category: it.category,
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      priceNGN: it.variant.product.priceNGN ?? 0,
      hasSizeMod: it.hasSizeMod,
      sizeModFee: it.sizeModFee,
      customSize: normalizeCustomSize(it.customSize),
    }));

    return {
      id: o.id,
      status: o.status,
      currency: o.currency,
      totalAmount: o.totalAmount,
      totalNGN,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.toISOString(),
      products,
      customer: customerObj,
      channel: o.channel,
      deliveryOption: o.deliveryOption
        ? {
            id: o.deliveryOption.id,
            name: o.deliveryOption.name,
            provider: o.deliveryOption.provider,
            type: o.deliveryOption.type,
          }
        : null,
      deliveryFee: o.deliveryFee ?? 0,
      deliveryDetails: humanizeDeliveryDetails(
        o.deliveryDetails,
        o.deliveryOption
      ),
    };
  });
}

export default async function OrderInventoryPage() {
  const data = await fetchOrders();

  if (data.length === 0) {
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

  // Pass as data (not initialData)
  return <OrderInventoryClient data={data} />;
}
