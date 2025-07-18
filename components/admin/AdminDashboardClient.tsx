"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronRight,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Printer,
} from "lucide-react";
import type { AdminOrder } from "@/lib/orders";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const RevenueChartCard = dynamic(
  () => import("@/components/admin/RevenueChartCard"),
  { ssr: false }
);

interface RecentOrderWithDate extends AdminOrder {
  createdAt: string;
}

interface Props {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  top3: {
    name: string;
    sold: number;
    revenue: number;
    image: string;
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
  // ───────────────────────────────────────────────── Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<RecentOrderWithDate | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const receiptCSS = `
    @page { size: 80mm auto; margin: 0; }
    body { width: 80mm; font-family: monospace; margin:0; padding:4mm; }
    .header, .footer { text-align: center; margin-bottom:4mm; }
    .line { display:flex; justify-content:space-between; margin-bottom:2mm; }
    .total { font-weight:bold; display:flex; justify-content:space-between; margin-top:4mm; }
    .small { font-size:0.8em; }
  `;

  function generateReceiptHtml(order: RecentOrderWithDate) {
    const now = new Date().toLocaleString();
    const vatRate = 0.075;
    const subtotal = +order.totalAmount.toFixed(2);
    const vat = +(subtotal * vatRate).toFixed(2);
    const deliveryCharge = 500;
    const totalWeight = order.products
      .reduce((w, p) => w + p.quantity * 0.2, 0)
      .toFixed(2);
    const courier = "DHL Express";
    const sym =
      order.currency === "NGN"
        ? "₦"
        : order.currency === "USD"
        ? "$"
        : order.currency === "EUR"
        ? "€"
        : "£";
    const grandTotal = +(subtotal + vat + deliveryCharge).toFixed(2);

    const itemsHtml = order.products
      .map(
        (p) => `
      <div class="line">
        <div>
          ${p.name}<br>
          <span class="small">Color: ${p.color} • Size: ${p.size} • Qty: ${p.quantity}</span>
        </div>
        <div>${sym}${p.lineTotal.toLocaleString()}</div>
      </div>
    `
      )
      .join("");

    return `
      <html><head><style>${receiptCSS}</style></head>
      <body>
        <div class="header">
          <div>${now}</div>
          <div>Marobi Receipt</div>
          <div>Order: ${order.id}</div>
        </div>
        ${itemsHtml}
        <div class="total"><span>Subtotal</span><span>${sym}${subtotal.toLocaleString()}</span></div>
        <div class="line"><span>VAT (${(vatRate * 100).toFixed(1)}%)</span><span>${sym}${vat.toLocaleString()}</span></div>
        <div class="line"><span>Delivery</span><span>${sym}${deliveryCharge.toLocaleString()}</span></div>
        <div class="line"><span>Weight</span><span>${totalWeight}kg</span></div>
        <div class="line"><span>Courier</span><span>${courier}</span></div>
        <div class="total"><span>Grand Total</span><span>${sym}${grandTotal.toLocaleString()}</span></div>
        <div class="footer small">
          Customer: ${order.customer.name}<br>
          Email: ${order.customer.email}<br>
          Phone: ${order.customer.phone}<br>
          Address: ${order.customer.address}
        </div>
      </body></html>
    `;
  }

  async function handlePrint(order: RecentOrderWithDate) {
    const html = generateReceiptHtml(order);
    if (typeof window === "undefined") return;
    const { default: printJS } = await import("print-js");
    printJS({
      printable: html,
      type: "raw-html",
      scanStyles: false,
      style: receiptCSS,
    });
  }

  function openReceiptModal(order: RecentOrderWithDate) {
    setReceiptOrder(order);
    setReceiptOpen(true);
  }

  // ─────────────────────────────────────────────────── Top‐line Stats
  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      href: "/admin/products",
      icon: Package,
      iconBg: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Total Customers",
      value: totalCustomers,
      href: "/admin/customers",
      icon: Users,
      iconBg: "bg-green-100 text-green-700",
    },
    {
      label: "Total Orders",
      value: totalOrders,
      href: "/admin/orders",
      icon: ShoppingCart,
      iconBg: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Total Revenue",
      value: `₦${totalRevenue.toLocaleString()}`,
      href: "/admin/reports",
      icon: DollarSign,
      iconBg: "bg-pink-100 text-pink-700",
    },
  ];

  return (
    <div className="p-6 space-y-6 text-gray-800">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.label}
              className="hover:shadow-lg transition bg-white overflow-hidden"
            >
              <Link href={c.href} className="block">
                <CardHeader className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className={`${c.iconBg} p-2 rounded-md`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-medium">
                      {c.label}
                    </CardTitle>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent className="px-4 pb-4 text-3xl font-semibold">
                  {c.value}
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart + Top-3 Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex justify-between items-center px-4 py-3">
            <CardTitle>Revenue</CardTitle>
            <ChevronRight
              className="h-4 w-4 text-gray-400 cursor-pointer"
              onClick={() => (location.href = "/admin/reports")}
            />
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-4">
            <RevenueChartCard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center px-4 py-3">
            <CardTitle>Top 3 Products</CardTitle>
            <ChevronRight
              className="h-4 w-4 text-gray-400 cursor-pointer"
              onClick={() => (location.href = "/admin/products")}
            />
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            {top3.map((p) => (
              <div key={p.name} className="flex items-center space-x-4">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-12 w-12 rounded border object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    Sold: {p.sold}
                  </div>
                  <div className="text-sm text-gray-600">
                    Revenue: ₦{p.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders (with View + Print) */}
      <Card>
        <CardHeader className="flex justify-between items-center px-4 py-3">
          <CardTitle>Recent Orders</CardTitle>
          <ChevronRight
            className="h-4 w-4 text-gray-400 cursor-pointer"
            onClick={() => (location.href = "/admin/orders")}
          />
        </CardHeader>
        <CardContent className="pt-0 space-y-2 px-4 pb-4">
          {recentOrders.length > 0 ? (
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <div className="flex items-center space-x-4">
                  <div className="-space-x-2 flex">
                    {o.products.slice(0, 3).map((p, i) => (
                      <img
                        key={i}
                        src={p.image}
                        alt={p.name}
                        className="h-8 w-8 rounded-lg border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="font-medium">{o.id}</div>
                    <div className="text-sm text-gray-600">
                      {o.createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReceiptModal(o)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePrint(o)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No recent orders.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── Receipt Preview Modal ─────────────────────────── */}
      {receiptOrder && (
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-lg print:hidden">
            <DialogHeader>
              <DialogTitle>Receipt — {receiptOrder.id}</DialogTitle>
              <DialogDescription>
                Payment: Credit Card — {receiptOrder.createdAt}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="mt-6 max-h-[60vh] space-y-4">
              {(() => {
                const o = receiptOrder!;
                const subtotal = o.totalAmount;
                const vatRate = 0.075;
                const vat = +(subtotal * vatRate).toFixed(2);
                const deliveryCharge = 500;
                const totalWeight = o.products
                  .reduce((w, p) => w + p.quantity * 0.2, 0)
                  .toFixed(2);
                const courier = "DHL Express";
                const sym =
                  o.currency === "NGN"
                    ? "₦"
                    : o.currency === "USD"
                    ? "$"
                    : o.currency === "EUR"
                    ? "€"
                    : "£";
                const grandTotal = +(
                  subtotal +
                  vat +
                  deliveryCharge
                ).toFixed(2);

                return (
                  <div className="px-2">
                    {o.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between mb-2"
                      >
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-gray-600">
                            Color: {p.color} • Size: {p.size} • Qty:{" "}
                            {p.quantity}
                          </div>
                        </div>
                        <div className="font-medium">
                          {sym}
                          {p.lineTotal.toLocaleString()}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span>
                        {sym}
                        {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (7.5%)</span>
                      <span>
                        {sym}
                        {vat.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>
                        {sym}
                        {deliveryCharge.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight</span>
                      <span>{totalWeight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courier</span>
                      <span>{courier}</span>
                    </div>
                    <div className="flex justify-between font-semibold mt-2">
                      <span>Grand Total</span>
                      <span>
                        {sym}
                        {grandTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-4 text-sm space-y-1">
                      <div>
                        <strong>Customer:</strong> {o.customer.name}
                      </div>
                      <div>
                        <strong>Email:</strong> {o.customer.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {o.customer.phone}
                      </div>
                      <div>
                        <strong>Address:</strong> {o.customer.address}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </ScrollArea>

            <DialogFooter className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setReceiptOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => handlePrint(receiptOrder!)}
              >
                <Printer className="mr-1 h-4 w-4" /> Print
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
