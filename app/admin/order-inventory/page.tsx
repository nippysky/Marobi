// app/admin/order-inventory/page.ts
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import OrderInventoryClient from "./OrderInventoryClient";
import EmptyState from "@/components/admin/EmptyState";
import type { OrderRow } from "@/types/orders";

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */

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

function normalizeAddress(o: {
  customer?: {
    deliveryAddress?: string | null;
    billingAddress?: string | null;
    country?: string | null;
    state?: string | null;
  } | null;
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

/** Extract a numeric kg weight from common fields in provider payloads. */
function extractWeightKg(obj: Record<string, any>): string | null {
  const cand =
    obj.aggregatedWeight ??
    obj.weight ??
    obj.totalWeight ??
    obj.packageWeight ??
    obj.pkg_weight;

  if (cand === undefined || cand === null) return null;
  const asStr = String(cand).trim();
  const n = parseFloat(asStr.replace(/[^0-9.]/g, ""));
  if (!isFinite(n)) return null;
  // Keep original unit if already includes 'kg', else append kg
  const hasKg = /kg/i.test(asStr);
  return hasKg ? asStr : `${n}kg`;
}

/**
 * Summarize delivery details for the table/CSV.
 * - Prefer short human text.
 * - For Shipbubble: "Shipbubble • Weight: 2kg • ETA: Within 32 hrs" (pieces only if present).
 * - Otherwise: "<CourierName> • Weight: 2kg".
 */
function humanizeDeliveryDetails(
  raw: unknown,
  deliveryOption?: { name?: string | null }
): string {
  const baseLabel = (deliveryOption?.name || "—").trim();

  if (!raw) return baseLabel;

  // Strings: try JSON; otherwise return short string or base label
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return humanizeDeliveryDetails(parsed, deliveryOption);
    } catch {
      const s = raw.trim();
      return s.length <= 64 ? s : baseLabel;
    }
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    const s = String(raw).trim();
    return s.length <= 64 ? s : baseLabel;
  }

  const obj = raw as Record<string, any>;
  const pieces: string[] = [];

  const isShipbubble =
    /shipbubble/i.test(baseLabel) ||
    Boolean(obj.shipbubble) ||
    typeof obj.meta === "object" ||
    typeof obj.raw === "object";

  // Label
  pieces.push(isShipbubble ? "Shipbubble" : baseLabel);

  // Weight
  const weight = extractWeightKg(obj) ??
    (obj.meta && extractWeightKg(obj.meta)) ??
    (obj.raw && extractWeightKg(obj.raw));
  if (weight) pieces.push(`Weight: ${weight}`);

  // ETA (nice-to-have, Shipbubble often has meta/raw.eta)
  const eta =
    (obj.meta && (obj.meta.eta || obj.meta.ETA)) ||
    (obj.raw && (obj.raw.eta || obj.raw.ETA));
  if (isShipbubble && eta) pieces.push(`ETA: ${String(eta)}`);

  return pieces.join(" • ");
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
      deliveryOption: { select: { id: true, name: true, provider: true } },
    },
  });

  return orders.map((o): OrderRow => {
    // customer/guest
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

    // NGN ledger subtotal (includes size-mod fee when order currency is NGN).
    const totalNGN: number = o.items.reduce((sum, it) => {
      const base = (it.variant?.product.priceNGN ?? 0) * it.quantity;
      const sizeFeeNGN = o.currency === "NGN" ? (it.sizeModFee ?? 0) * it.quantity : 0;
      return sum + base + sizeFeeNGN;
    }, 0);

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

    const deliveryOption: OrderRow["deliveryOption"] = o.deliveryOption
      ? {
          id: o.deliveryOption.id,
          name: o.deliveryOption.name,
          provider: o.deliveryOption.provider ?? null,
          type: "COURIER",
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
      deliveryDetails: humanizeDeliveryDetails(
        o.deliveryDetails,
        deliveryOption ?? undefined
      ),
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
