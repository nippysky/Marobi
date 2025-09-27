export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import OrderInventoryClient from "./OrderInventoryClient";
import EmptyState from "@/components/admin/EmptyState";
import type { OrderRow } from "@/types/orders";

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */

/** Coerce a JSON-ish customSize into a flat record of strings or null */
function normalizeCustomSize(raw: unknown): Record<string, string> | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v !== null && v !== undefined) out[k] = String(v);
    }
    return Object.keys(out).length ? out : null;
  }
  return null;
}

/** Display an address from either a linked customer or guestInfo */
function normalizeAddress(o: {
  customer?: {
    deliveryAddress?: string | null;
    billingAddress?: string | null;
    country?: string | null;
    state?: string | null;
  } | null;
  // Prisma gives JsonValue | null here, so accept unknown and narrow at runtime.
  guestInfo?: unknown;
}): string {
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
    const g = o.guestInfo as Record<string, unknown>;
    return (
      (g.deliveryAddress as string) ||
      (g.address as string) ||
      (g.billingAddress as string) ||
      (g.country as string) ||
      (g.state as string) ||
      "—"
    );
  }
  return "—";
}

/**
 * Human-readable summary of delivery details.
 * Always return a string (no `unknown` leaks).
 */
function humanizeDeliveryDetails(
  raw: unknown,
  deliveryOption?: { name?: string | null }
): string {
  if (!raw) return "—";

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      raw = parsed;
    } catch {
      // Ensure we return a string in this branch
      return raw as string;
    }
  }

  if (typeof raw !== "object" || Array.isArray(raw)) return String(raw);

  const obj = raw as Record<string, any>;
  const parts: string[] = [];

  if (obj.aggregatedWeight) {
    parts.push(`Weight: ${parseFloat(obj.aggregatedWeight).toLocaleString()}kg`);
  }
  if (deliveryOption?.name) {
    parts.push(`Courier: ${deliveryOption.name}`);
  }

  // Append other keys (exclude internal ones)
  for (const [k, v] of Object.entries(obj)) {
    if (k === "aggregatedWeight" || k === "deliveryOptionId") continue;
    if (v === null || v === undefined || v === "") continue;
    parts.push(
      `${k[0].toUpperCase()}${k.slice(1)}: ${
        typeof v === "object" ? JSON.stringify(v) : v
      }`
    );
  }

  return parts.length ? parts.join(" • ") : "—";
}

/* ──────────────────────────────────────────────────────────────────────────
   Data loader
   ────────────────────────────────────────────────────────────────────────── */

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
                  images: true,
                  name: true,
                  categorySlug: true,
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
          provider: true, // NOTE: your schema has no `type` column
        },
      },
    },
  });

  return orders.map((o): OrderRow => {
    /* Customer/guest block */
    let customerObj: OrderRow["customer"];
    if (o.customer) {
      customerObj = {
        id: o.customer.id,
        name: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        email: o.customer.email,
        phone: o.customer.phone,
        address: normalizeAddress({ customer: o.customer, guestInfo: o.guestInfo }),
      };
    } else if (o.guestInfo && typeof o.guestInfo === "object" && !Array.isArray(o.guestInfo)) {
      const gi = o.guestInfo as Record<string, string>;
      customerObj = {
        id: null,
        name: `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim() || "Guest",
        email: gi.email ?? "",
        phone: gi.phone ?? "",
        address: normalizeAddress({ customer: null, guestInfo: o.guestInfo }),
      };
    } else {
      customerObj = { id: null, name: "Guest", email: "", phone: "", address: "—" };
    }

    // Always compute NGN for dashboards
    const totalNGN: number = o.items.reduce(
      (sum, it) => sum + ((it.variant?.product.priceNGN ?? 0) * it.quantity),
      0
    );

    // Item rows for UI
    const products = o.items.map((it) => ({
      id: it.id,
      name: it.name,
      image: it.image ?? "",
      category: it.category,
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      priceNGN: it.variant?.product.priceNGN ?? 0,
      hasSizeMod: it.hasSizeMod,
      sizeModFee: it.sizeModFee,
      customSize: normalizeCustomSize(it.customSize),
    }));

    // UI type requires a `type` even though DB doesn't have it. Your schema comment
    // says only courier options exist, so we safely derive "COURIER".
    const deliveryOption: OrderRow["deliveryOption"] = o.deliveryOption
      ? {
          id: o.deliveryOption.id,
          name: o.deliveryOption.name,
          provider: o.deliveryOption.provider ?? null,
          type: "COURIER", // derive; satisfies DeliveryOptionShape
        }
      : null;

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
      deliveryOption,
      deliveryFee: o.deliveryFee ?? 0,
      // Do not pass `null` to a param typed as optional; use undefined instead.
      deliveryDetails: humanizeDeliveryDetails(o.deliveryDetails, deliveryOption ?? undefined),
    };
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

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

  return <OrderInventoryClient data={data} />;
}
