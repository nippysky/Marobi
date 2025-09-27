export const dynamic = "force-dynamic";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { prisma } from "@/lib/db";
import type { OrderRow } from "@/types/orders";

/* -----------------------------------------------------------------------------
   Small helpers to mirror order/inventory formatting logic
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
      (o.guestInfo as any).address ||
      o.guestInfo.billingAddress ||
      o.guestInfo.country ||
      o.guestInfo.state ||
      "—"
    );
  }
  return "—";
}

function humanizeDeliveryDetails(raw: unknown, deliveryOption?: { name?: string | null }): string {
  if (!raw) return "—";
  let val: any = raw;
  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch {
      return val;
    }
  }
  if (typeof val !== "object" || Array.isArray(val)) return String(val);

  const entries: string[] = [];
  if (val.aggregatedWeight) {
    entries.push(`Weight: ${parseFloat(val.aggregatedWeight).toLocaleString()}kg`);
  }
  if (deliveryOption?.name) entries.push(`Courier: ${deliveryOption.name}`);

  for (const [k, v] of Object.entries(val)) {
    if (k === "aggregatedWeight" || k === "deliveryOptionId") continue;
    if (v != null && v !== "") {
      entries.push(
        `${k[0].toUpperCase() + k.slice(1)}: ${typeof v === "object" ? JSON.stringify(v) : v}`
      );
    }
  }
  return entries.length ? entries.join(" • ") : "—";
}

/* -----------------------------------------------------------------------------
   Recent orders (5 latest). Prisma shape matches the schema you shared.
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
                select: { priceNGN: true, id: true, name: true, images: true, categorySlug: true },
              },
            },
          },
        },
      },
      offlineSale: true,
      // IMPORTANT: your DeliveryOption model has no `type` column.
      deliveryOption: {
        select: {
          id: true,
          name: true,
          provider: true,
          // no `type` here — removed to avoid Prisma validation error
        },
      },
    },
  });

  return orders.map((o) => {
    /** Customer / guest block */
    let customerObj: OrderRow["customer"];
    if (o.customer) {
      customerObj = {
        id: o.customer.id,
        name: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        email: o.customer.email,
        phone: o.customer.phone,
        address: normalizeAddress(o),
      };
    } else if (o.guestInfo && typeof o.guestInfo === "object" && !Array.isArray(o.guestInfo)) {
      const gi = o.guestInfo as Record<string, string>;
      customerObj = {
        id: null,
        name: `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim() || "Guest",
        email: gi.email ?? "",
        phone: gi.phone ?? "",
        address: normalizeAddress(o),
      };
    } else {
      customerObj = { id: null, name: "Guest", email: "", phone: "", address: "—" };
    }

    /** NGN total for reporting (from product price * qty) */
    const totalNGN = o.items.reduce((sum, it) => {
      const unit = it.variant?.product?.priceNGN ?? 0;
      return sum + unit * it.quantity;
    }, 0);

    /** Normalize product rows */
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

    /** Delivery option shape expected by UI types. */
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
      deliveryDetails: humanizeDeliveryDetails(o.deliveryDetails, deliveryOption ?? undefined),
    };
  });
}

/* -----------------------------------------------------------------------------
   Top products by qty (ignores Cancelled)
   NOTE: We previously grouped by variantId and then used product.id in the UI.
   That can produce duplicate product IDs if multiple variants of the same product
   appear. We now:
   - take a buffered groupBy on variantId,
   - join to variants/products,
   - collapse into unique products (sum quantities/revenue),
   - sort and slice to the requested limit.
----------------------------------------------------------------------------- */
async function fetchTopProducts(limit = 5) {
  const validOrderIds = (
    await prisma.order.findMany({
      where: { status: { not: "Cancelled" } },
      select: { id: true },
    })
  ).map((o) => o.id);

  if (!validOrderIds.length) return [];

  // Buffer results to survive collapsing variants->products
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

  // Collapse into unique products
  const perProduct = new Map<
    string,
    { id: string; name: string; sold: number; revenue: number; image: string; category?: string }
  >();

  for (const g of grouped) {
    const soldQty = g._sum.quantity ?? 0;
    const variant = variants.find((v) => v.id === g.variantId);
    if (!variant) continue;
    const prod = variant.product;
    const priceNGN = prod.priceNGN ?? 0;

    const existing = perProduct.get(prod.id);
    if (existing) {
      existing.sold += soldQty;
      existing.revenue += Math.round(priceNGN * soldQty);
    } else {
      perProduct.set(prod.id, {
        id: prod.id,
        name: prod.name,
        sold: soldQty,
        revenue: Math.round(priceNGN * soldQty),
        image: prod.images[0],
        category: prod.categorySlug,
      });
    }
  }

  return Array.from(perProduct.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
}

/* -----------------------------------------------------------------------------
   Revenue series (Day / Month / 6 Months / Year), non-cancelled only
----------------------------------------------------------------------------- */
async function buildRevenueSeries() {
  const now = new Date();
  const sumRange = async (gte: Date, lte: Date) => {
    const agg = await prisma.order.aggregate({
      where: {
        createdAt: { gte, lte },
        status: { not: "Cancelled" },
      },
      _sum: { totalNGN: true },
    });
    return agg._sum.totalNGN ?? 0;
  };

  // Last 7 days
  const daySeries: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    daySeries.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      value: await sumRange(start, end),
    });
  }

  // Each month of current year
  const monthSeries: { label: string; value: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(now.getFullYear(), m, 1);
    if (start > now) break;
    const end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
    monthSeries.push({
      label: start.toLocaleDateString(undefined, { month: "short" }),
      value: await sumRange(start, end),
    });
  }

  // Last 6 months
  const sixSeries: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    sixSeries.push({
      label: d.toLocaleDateString(undefined, { month: "short" }),
      value: await sumRange(start, end),
    });
  }

  // Last 5 years
  const yearSeries: { label: string; value: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const y = now.getFullYear() - i;
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    yearSeries.push({ label: String(y), value: await sumRange(start, end) });
  }

  return {
    Day: daySeries,
    Month: monthSeries,
    "6 Months": sixSeries,
    Year: yearSeries,
  };
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
