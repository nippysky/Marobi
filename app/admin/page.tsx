export const dynamic = "force-dynamic";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { prisma } from "@/lib/db";
import type { OrderRow } from "@/types/orders"; // Ensure this matches your OrderTable usage

/**
 * Helpers — exactly match order-inventory logic
 */
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
  // Add any extra info
  for (const [k, v] of Object.entries(raw)) {
    if (
      k !== "aggregatedWeight" &&
      k !== "deliveryOptionId" &&
      v != null &&
      v !== ""
    ) {
      entries.push(
        `${k[0].toUpperCase() + k.slice(1)}: ${typeof v === "object" ? JSON.stringify(v) : v}`
      );
    }
  }
  return entries.length ? entries.join(" • ") : "—";
}

/**
 * Fetches recent 5 orders, with all info, just like inventory.
 */
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
    // Customer normalization
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
        name:
          `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim() || "Guest",
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

    // Calculate NGN total for reporting
    const totalNGN: number = o.items.reduce(
      (sum: number, it) =>
        sum + (it.variant?.product.priceNGN ?? 0) * it.quantity,
      0
    );

    // Normalize each product row
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
      deliveryDetails: humanizeDeliveryDetails(o.deliveryDetails, o.deliveryOption),
    };
  });
}

/**
 * Build top N products by total quantity sold, always in NGN.
 * Excludes orders with status "Cancelled".
 */
async function fetchTopProducts(limit = 5) {
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
    take: limit,
  });

  const variantIds = grouped.map((g) => g.variantId);

  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  return grouped.map((g) => {
    const soldQty = g._sum.quantity ?? 0;
    const variant = variants.find((v) => v.id === g.variantId)!;
    const prod = variant.product;
    const revenueNGN = Math.round((prod.priceNGN ?? 0) * soldQty);

    return {
      id: prod.id,
      name: prod.name,
      sold: soldQty,
      revenue: revenueNGN,
      image: prod.images[0],
      category: prod.categorySlug,
    };
  });
}

/**
 * Build revenue time‑series (Day, Month, 6 Months, Year).
 * Only includes non-cancelled orders in calculations.
 */
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
  const daySeries = [];
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
  const monthSeries = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(now.getFullYear(), m, 1);
    if (start > now) break;
    const end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
    monthSeries.push({
      label: start.toLocaleDateString(undefined, { month: "short" }),
      value: await sumRange(start, end),
    });
  }

  // Last 6 distinct months
  const sixSeries = [];
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
  const yearSeries = [];
  for (let i = 4; i >= 0; i--) {
    const y = now.getFullYear() - i;
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    yearSeries.push({
      label: String(y),
      value: await sumRange(start, end),
    });
  }

  return {
    Day: daySeries,
    Month: monthSeries,
    "6 Months": sixSeries,
    Year: yearSeries,
  };
}

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    totalCustomers,
    orderAgg,
    top3,
    recentOrders,
    revenueSeries,
  ] = await Promise.all([
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
