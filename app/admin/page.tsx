export const dynamic = "force-dynamic";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { prisma } from "@/lib/db";

/**
 * Build top N products by total quantity sold, always in NGN.
 */
async function fetchTopProducts(limit = 5) {
  // 1) Group orderItems by variantId to get quantities sold
  const grouped = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const variantIds = grouped.map((g) => g.variantId);

  // 2) Fetch the matching Variants & their Product
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  // 3) Assemble top-products array
  return grouped.map((g) => {
    const soldQty = g._sum.quantity ?? 0;
    const variant = variants.find((v) => v.id === g.variantId)!;
    const prod    = variant.product;
    // always compute NGN revenue
    const revenueNGN = Math.round((prod.priceNGN ?? 0) * soldQty);

    return {
      id:       prod.id, 
      name:     prod.name,
      sold:     soldQty,
      revenue:  revenueNGN,
      image:    prod.images[0],
      category: prod.categorySlug,
    };
  });
}

/**
 * Fetch most recent orders, with either customer or guest info.
 */
async function fetchRecentOrders(limit = 5) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id:           true,
      status:       true,
      currency:     true,
      totalAmount:  true,
      totalNGN:     true,
      createdAt:    true,
      paymentMethod:true,
      customer: {
        select: {
          id:              true,
          firstName:       true,
          lastName:        true,
          email:           true,
          phone:           true,
          deliveryAddress: true,
          billingAddress:  true,
        },
      },
      guestInfo: true,
      items: {
        select: {
          id:        true,
          name:      true,
          image:     true,
          category:  true,
          color:     true,
          size:      true,
          quantity:  true,
          lineTotal: true,
        },
      },
    },
  });

  return orders.map((o) => {
    let customerData;
    if (o.customer) {
      customerData = {
        id:      o.customer.id,
        name:    `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        email:   o.customer.email,
        phone:   o.customer.phone,
        address:
          o.customer.deliveryAddress ||
          o.customer.billingAddress ||
          "No address on file",
      };
    } else if (o.guestInfo && typeof o.guestInfo === "object") {
      const gi = o.guestInfo as {
        firstName: string;
        lastName:  string;
        email:     string;
        phone:     string;
        address:   string;
      };
      customerData = {
        id:      "",
        name:    `${gi.firstName} ${gi.lastName}`.trim() || "Guest",
        email:   gi.email,
        phone:   gi.phone,
        address: gi.address,
      };
    } else {
      customerData = {
        id:      "",
        name:    "Guest",
        email:   "",
        phone:   "",
        address: "—",
      };
    }

    return {
      id:           o.id,
      status:       o.status,
      currency:     o.currency,
      totalAmount:  o.totalAmount,
      totalNGN:     o.totalNGN,      // <— always correct NGN total
      paymentMethod:o.paymentMethod,
      createdAt:    o.createdAt.toISOString(),
      customer:     customerData,
      products:     o.items.map((it) => ({
        id:        it.id,
        name:      it.name,
        image:     it.image ?? "",
        category:  it.category,
        color:     it.color,
        size:      it.size,
        quantity:  it.quantity,
        lineTotal: it.lineTotal,
      })),
    };
  });
}

/**
 * Build revenue time‑series (Day, Month, 6 Months, Year).
 */
async function buildRevenueSeries() {
  const now = new Date();
  const sumRange = async (gte: Date, lte: Date) => {
    const agg = await prisma.order.aggregate({
      where: { createdAt: { gte, lte } },
      _sum:  { totalNGN: true },
    });
    return agg._sum.totalNGN ?? 0;
  };

  // Last 7 days
  const daySeries = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    sixSeries.push({
      label: d.toLocaleDateString(undefined, { month: "short" }),
      value: await sumRange(start, end),
    });
  }

  // Last 5 years
  const yearSeries = [];
  for (let i = 4; i >= 0; i--) {
    const y     = now.getFullYear() - i;
    const start = new Date(y, 0, 1);
    const end   = new Date(y, 11, 31, 23, 59, 59, 999);
    yearSeries.push({
      label: String(y),
      value: await sumRange(start, end),
    });
  }

  return {
    Day:        daySeries,
    Month:      monthSeries,
    "6 Months": sixSeries,
    Year:       yearSeries,
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
      _sum:   { totalNGN: true },
    }),
    fetchTopProducts(3),
    fetchRecentOrders(5),
    buildRevenueSeries(),
  ]);

  const totalOrders  = orderAgg._count._all;
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
