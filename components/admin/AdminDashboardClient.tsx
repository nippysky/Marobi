// components/admin/AdminDashboardClient.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight } from "lucide-react";
import type { AdminOrder } from "@/lib/orders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RevenueChartCard = dynamic(
  () => import("@/components/admin/RevenueChartCard"),
  { ssr: false }
);

interface RecentOrderWithDate extends AdminOrder {
  createdAt: string; // YYYY-MM-DD
}

interface Props {
  totalProducts:  number;
  totalCustomers: number;
  totalOrders:    number;
  totalRevenue:   number;
  top3: {
    name:    string;
    sold:    number;
    revenue: number;
    image:   string;
  }[];
  recentOrders: RecentOrderWithDate[];
}

export default function AdminDashboardClient({
  totalProducts,
  totalCustomers,
  totalOrders,
  totalRevenue,
  top3,
  recentOrders,
}: Props) {
  return (
    <div className="p-6 space-y-6 text-gray-800">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* ─── Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Products",  value: totalProducts,  href: "/admin/products"  },
          { label: "Total Customers", value: totalCustomers, href: "/admin/customers" },
          { label: "Total Orders",    value: totalOrders,    href: "/admin/orders"    },
          { label: "Total Revenue",   value: `₦${totalRevenue.toLocaleString()}`, href: "/admin/reports" },
        ].map((c) => (
          <Card key={c.label} className="hover:shadow-lg transition">
            <Link href={c.href} className="block">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{c.label}</CardTitle>
                <ChevronRight />
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {c.value}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* ─── Revenue Chart + Top-3 Products ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Monthly Revenue</CardTitle>
            <ChevronRight
              className="cursor-pointer"
              onClick={() => (location.href = "/admin/reports")}
            />
          </CardHeader>
          <CardContent className="pt-0">
            <RevenueChartCard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Top 3 Products</CardTitle>
            <ChevronRight
              className="cursor-pointer"
              onClick={() => (location.href = "/admin/products")}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {top3.map((p) => (
              <div key={p.name} className="flex items-center space-x-4">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-12 w-12 rounded border object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">Sold: {p.sold}</div>
                  <div className="text-sm text-gray-600">
                    Revenue: ₦{p.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Orders (mini‐list) ───────────────────────────────── */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Recent Orders</CardTitle>
          <ChevronRight
            className="cursor-pointer"
            onClick={() => (location.href = "/admin/orders")}
          />
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {recentOrders.length > 0 ? (
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <div>
                  <div className="font-medium">{o.id}</div>
                  <div className="text-sm text-gray-600">
                    {o.createdAt}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (location.href = `/admin/orders/${o.id}`)}
                >
                  View
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No recent orders.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
