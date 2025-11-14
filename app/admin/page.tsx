// app/admin/page.tsx
export const dynamic = "force-dynamic";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { prisma } from "@/lib/db";
import type { OrderRow } from "@/types/orders";

/* -----------------------------------------------------------------------------
   Helpers (mirror inventory formatting, but concise)
----------------------------------------------------------------------------- */
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

/** Return a SHORT, UI-friendly summary. No JSON dump. */
function conciseDeliveryDetails(
  raw: unknown,
  deliveryOption?: { name?: string | null; provider?: string | null }
): string {
  // Prefer explicit name, else provider, else default Shipbubble
  const courier =
    (deliveryOption?.name?.trim() ||
      deliveryOption?.provider?.trim() ||
      "") || "Shipbubble";

  if (!raw) return courier;

  let val: any = raw;
  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch {
      // If it's already a nice short string, prepend courier
      return `${courier}${val.trim() ? ` • ${val}` : ""}`;
    }
  }
  if (typeof val !== "object" || Array.isArray(val)) return courier;

  const weight =
    val.aggregatedWeight ?? val.weight ?? null; // allowlist only
  const eta = val?.meta?.eta ?? val.eta ?? null; // optional, short field

  const parts: string[] = [courier];
  if (weight != null) {
    const kg = Number.parseFloat(String(weight));
    parts.push(`Weight: ${Number.isFinite(kg) ? `${kg}kg` : String(weight)}`);
  }
  if (eta) parts.push(`ETA: ${String(eta)}`);

  return parts.join(" • ");
}

/* -----------------------------------------------------------------------------
   Recent orders (latest 5)
----------------------------------------------------------------------------- */
async function fetchRecentOrders(): Promise<OrderRow[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
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
                  id: true,
                  name: true,
                  images: true,
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

    // NGN ledger subtotal
    const totalNGN = o.items.reduce((sum, it) => {
      const unit = it.variant?.product?.priceNGN ?? 0;
      return sum + unit * it.quantity;
    }, 0);

    const products: OrderRow["products"] = o.items.map((it) => ({
      id: it.id,
      name: it.name,
      image: it.image ?? "",
      category: it.category,
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      priceNGN: it.variant?.product?.priceNGN ?? 0,
      hasSizeMod: it.hasSizeMod,
      sizeModFee: it.sizeModFee,
      customSize: normalizeCustomSize(it.customSize),
    }));

    // Courier normalization
    const normalizedDeliveryOption = o.deliveryOption
      ? {
          id: o.deliveryOption.id,
          name:
            o.deliveryOption.name?.trim() ||
            o.deliveryOption.provider?.trim() ||
            "Shipbubble",
          provider: o.deliveryOption.provider ?? null,
          type: "COURIER" as const,
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
      deliveryOption: normalizedDeliveryOption,
      deliveryFee: o.deliveryFee ?? 0,
      // ✅ short, no JSON dump
      deliveryDetails: conciseDeliveryDetails(o.deliveryDetails, normalizedDeliveryOption ?? undefined),
    };
  });
}

/* -----------------------------------------------------------------------------
   Top products (by qty), collapse variants -> product
----------------------------------------------------------------------------- */
async function fetchTopProducts(limit = 3) {
  const validOrderIds = (
    await prisma.order.findMany({
      where: { status: { not: "Cancelled" } },
      select: { id: true },
    })
  ).map((o) => o.id);

  if (!validOrderIds.length) return [];

  const grouped = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true },
    where: { orderId: { in: validOrderIds } },
    orderBy: { _sum: { quantity: "desc" } },
    take: Math.max(limit * 4, limit),
  });

  const variantIds = grouped.map((g) => g.variantId);
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  const perProduct = new Map<
    string,
    { id: string; name: string; sold: number; revenue: number; image: string; category?: string }
  >();

  for (const g of grouped) {
    const qty = g._sum.quantity ?? 0;
    const v = variants.find((x) => x.id === g.variantId);
    if (!v) continue;
    const p = v.product;
    const price = p.priceNGN ?? 0;

    const agg = perProduct.get(p.id);
    if (agg) {
      agg.sold += qty;
      agg.revenue += Math.round(price * qty);
    } else {
      perProduct.set(p.id, {
        id: p.id,
        name: p.name,
        sold: qty,
        revenue: Math.round(price * qty),
        image: p.images?.[0] ?? "/placeholder.png",
        category: p.categorySlug,
      });
    }
  }

  return Array.from(perProduct.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
}

/* -----------------------------------------------------------------------------
   Revenue series (Day / Month / 6 Months / Year), excluding Cancelled
----------------------------------------------------------------------------- */
async function buildRevenueSeries() {
  const now = new Date();
  const sumRange = async (gte: Date, lte: Date) => {
    const agg = await prisma.order.aggregate({
      where: { createdAt: { gte, lte }, status: { not: "Cancelled" } },
      _sum: { totalNGN: true },
    });
    return agg._sum.totalNGN ?? 0;
  };

  const Day: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    Day.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), value: await sumRange(start, end) });
  }

  const Month: { label: string; value: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(now.getFullYear(), m, 1);
    if (start > now) break;
    const end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
    Month.push({ label: start.toLocaleDateString(undefined, { month: "short" }), value: await sumRange(start, end) });
  }

  const SixMonths: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    SixMonths.push({ label: d.toLocaleDateString(undefined, { month: "short" }), value: await sumRange(start, end) });
  }

  const Year: { label: string; value: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const y = now.getFullYear() - i;
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    Year.push({ label: String(y), value: await sumRange(start, end) });
  }

  return { Day, Month, "6 Months": SixMonths, Year };
}

/* -----------------------------------------------------------------------------
   Page
----------------------------------------------------------------------------- */
export default async function AdminDashboardPage() {
  const [totalProducts, totalCustomers, orderAgg, top3, recentOrders, revenueSeries] =
    await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.aggregate({
        _count: { _all: true },
        _sum: { totalNGN: true },
        where: { status: { not: "Cancelled" } },
      }),
      fetchTopProducts(3),
      fetchRecentOrders(),
      buildRevenueSeries(),
    ]);

  const totalOrders = orderAgg._count._all;
  const totalRevenue = orderAgg._sum.totalNGN ?? 0;

  return (
    <AdminDashboardClient
      totalProducts={totalProducts}
      totalCustomers={totalCustomers}
      totalOrders={totalOrders}
      totalRevenue={totalRevenue}
      top3={top3}
      recentOrders={recentOrders}
      revenueSeries={revenueSeries}
    />
  );
}
