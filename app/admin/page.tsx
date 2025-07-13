// app/admin/page.tsx
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { generateDummyOrders, type AdminOrder } from "@/lib/orders";

export default async function AdminDashboardPage() {
  // 1) Top‐line stats
  const totalProducts  = 12;
  const totalCustomers = 34;
  const totalOrders    = 56;
  const totalRevenue   = 123_456;

  // 2) Dummy top 3 products
  const top3 = [
    { name: "Floral Summer Dress", sold: 20, revenue: 400_000, image: "/dummy1.jpg" },
    { name: "Denim Jacket",          sold: 15, revenue:  75_000, image: "/dummy2.jpg" },
    { name: "Silk Scarf",            sold: 10, revenue:  50_000, image: "/dummy3.jpg" },
  ];

  // 3) Recent orders (take the first 5 of a longer list)
  const all = generateDummyOrders(10);
  // Compute a simple YYYY-MM-DD string on the server once:
  const recent = all.slice(0, 5).map((o) => ({
    ...o,
    createdAt: new Date().toISOString().split("T")[0],  // "2025-07-14"
  }));

  return (
    <AdminDashboardClient
      totalProducts={totalProducts}
      totalCustomers={totalCustomers}
      totalOrders={totalOrders}
      totalRevenue={totalRevenue}
      top3={top3}
      recentOrders={recent}
    />
  );
}
