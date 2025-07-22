import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Build top 3 products by total quantity sold (across all orders).
 * We aggregate via OrderItem.
 */
async function fetchTopProducts(limit = 3) {
  // Aggregate quantities & revenue per product name + image (if you store image in OrderItem)
  // If you want to join back to Product for canonical image, do an extra lookup.
  const items = await prisma.orderItem.groupBy({
    by: ["name", "image", "category"],
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return items.map(i => ({
    name: i.name,
    sold: i._sum.quantity ?? 0,
    revenue: Math.round(i._sum.lineTotal ?? 0),
    image: i.image || "/placeholder-product.png",
  }));
}

/**
 * Fetch most recent orders with minimal fields for the recent list.
 */
async function fetchRecentOrders(limit = 5) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      currency: true,
      totalAmount: true,
      totalNGN: true,
      createdAt: true,
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
          color: true,
          size: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });

  return orders.map(o => ({
    id: o.id,
    status: o.status,
    currency: o.currency,
    totalAmount: o.totalAmount,
    totalNGN: o.totalNGN,
    createdAt: o.createdAt.toISOString().split("T")[0],
    customer: {
      id: o.customer.id,
      name: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      email: o.customer.email,
      phone: o.customer.phone,
      address:
        o.customer.deliveryAddress ||
        o.customer.billingAddress ||
        "No address on file",
    },
    products: o.items.map(it => ({
      id: it.id,
      name: it.name,
      image: it.image || "/placeholder-product.png",
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      category: "", // not required in the dashboard UI
    })),
  }));
}

/**
 * Revenue series builder.
 * mode = "day" | "month" | "6m" | "year"
 * We return consistent shape { label, value }.
 */
async function buildRevenueSeries() {
  const now = new Date();

  // Helper: first day of period
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1); // inclusive

  // 1. Day (last 7 days)
  const daySeries: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const sum = await prisma.order.aggregate({
      _sum: { totalNGN: true },
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
    });
    daySeries.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      value: sum._sum.totalNGN ?? 0,
    });
  }

  // 2. Month (each month of current year)
  const monthSeries: { label: string; value: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(now.getFullYear(), m, 1);
    const mEnd = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
    if (mStart > now) break; // future months
    const sum = await prisma.order.aggregate({
      _sum: { totalNGN: true },
      where: { createdAt: { gte: mStart, lte: mEnd } },
    });
    monthSeries.push({
      label: mStart.toLocaleString(undefined, { month: "short" }),
      value: sum._sum.totalNGN ?? 0,
    });
  }

  // 3. 6 Months (rolling last 6 distinct months)
  const sixSeries: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const sum = await prisma.order.aggregate({
      _sum: { totalNGN: true },
      where: { createdAt: { gte: mStart, lte: mEnd } },
    });
    sixSeries.push({
      label: d.toLocaleString(undefined, { month: "short" }),
      value: sum._sum.totalNGN ?? 0,
    });
  }

  // 4. Year (last 5 years including current)
  const yearSeries: { label: string; value: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const y = now.getFullYear() - i;
    const yStart = new Date(y, 0, 1);
    const yEnd = new Date(y, 11, 31, 23, 59, 59, 999);
    const sum = await prisma.order.aggregate({
      _sum: { totalNGN: true },
      where: { createdAt: { gte: yStart, lte: yEnd } },
    });
    yearSeries.push({ label: String(y), value: sum._sum.totalNGN ?? 0 });
  }

  return {
    Day: daySeries,
    Month: monthSeries,
    "6 Months": sixSeries,
    Year: yearSeries,
  };
}

export default async function AdminDashboardPage() {
  // Parallelize
  const [totalProducts, totalCustomers, orderAgg, top3, recentOrders, revenueSeries] =
    await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.aggregate({
        _count: { _all: true },
        _sum: { totalNGN: true },
      }),
      fetchTopProducts(3),
      fetchRecentOrders(5),
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
