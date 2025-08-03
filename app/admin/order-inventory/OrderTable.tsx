// file: app/admin/order-inventory/OrderTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  Printer,
  Download,
  RefreshCcw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import Papa from "papaparse";

import type { OrderChannel, OrderRow } from "@/types/orders";
import { OrderStatus, Currency } from "@/lib/generated/prisma-client";
import { receiptCSS } from "@/lib/utils";

type Props = { initialData: OrderRow[] };

const STATUS_OPTIONS: OrderStatus[] = ["Processing", "Shipped", "Delivered"];
const CURRENCY_OPTIONS: Currency[] = ["NGN", "USD", "EUR", "GBP"];

export default function OrderTable({ initialData }: Props) {
  const [data, setData] = useState<OrderRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [currencyFilter, setCurrencyFilter] = useState<"All" | Currency>("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [receiptOrder, setReceiptOrder] = useState<OrderRow | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  function openReceiptModal(order: OrderRow) {
    setReceiptOrder(order);
    setReceiptOpen(true);
  }

  // Inline status change with indicator
  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    if (updatingIds.has(id)) return;
    setUpdatingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      setData((d) =>
        d.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order ${id} status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error("❌ " + err.message);
    } finally {
      setUpdatingIds((s) => {
        const copy = new Set(s);
        copy.delete(id);
        return copy;
      });
    }
  }

  // Print (modern/futuristic)
  async function handlePrint(order: OrderRow) {
    if (typeof window === "undefined") return;

    const now = new Date().toLocaleString();
    const vatRate = 0.075;
    const subtotal = +order.totalAmount.toFixed(2);
    const vat = +(subtotal * vatRate).toFixed(2);
    const deliveryCharge = order.deliveryFee ?? 0;
    const deliveryOptionName = order.deliveryOption?.name || "—";
    const totalWeight = order.products
      .reduce((w, p) => w + p.quantity * 0.2, 0)
      .toFixed(2);
    const sym =
      order.currency === "NGN"
        ? "₦"
        : order.currency === "USD"
        ? "$"
        : order.currency === "EUR"
        ? "€"
        : "£";
    const grand = +(subtotal + vat + deliveryCharge).toFixed(2);

    const productLines = order.products
      .map((p) => {
        const sizeModDetails = p.hasSizeMod
          ? `<div class="mod">
               <div><strong>Size modification fee:</strong> ${sym}${p.sizeModFee.toFixed(
                 2
               )}</div>
               ${
                 p.customSize
                   ? `<div class="custom-sizes"><strong>Custom sizes:</strong> ${Object.entries(
                       p.customSize
                     )
                       .map(([k, v]) => `${k}:${v}`)
                       .join(", ")}</div>`
                   : ""
               }
             </div>`
          : "";
        return `
          <div class="prod">
            <div class="prod-info">
              <div class="name">${p.name}</div>
              <div class="meta">Color: ${p.color} • Size: ${p.size} • Qty: ${
          p.quantity
        }</div>
              ${sizeModDetails}
            </div>
            <div class="price">${sym}${p.lineTotal.toLocaleString()}</div>
          </div>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            :root {
              --bg:#0f111a;
              --card:#1f233e;
              --text:#f0f5ff;
              --muted:#8a9bb8;
              --accent:#5c7cfa;
              --radius:16px;
              font-family: system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;
            }
            body { background: #07091e; color: var(--text); padding:24px; margin:0;}
            .wrapper { max-width:800px; margin:0 auto; }
            .header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
            .title { font-size:1.75rem; font-weight:700; letter-spacing:0.5px; }
            .small { font-size:0.75rem; color: var(--muted); margin-top:4px;}
            .card { background: var(--card); border-radius: var(--radius); padding:24px; margin-top:16px; position:relative; overflow:hidden; }
            .section { margin-bottom:20px; }
            .prod { display:flex; justify-content:space-between; align-items:flex-start; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.08); }
            .prod-info { max-width:70%; }
            .name { font-weight:600; font-size:1rem; }
            .meta { font-size:0.65rem; color: var(--muted); margin-top:4px; }
            .mod { margin-top:6px; font-size:0.65rem; background: rgba(92,124,250,0.08); padding:6px 8px; border-radius:8px; }
            .custom-sizes { margin-top:4px; }
            .price { font-weight:700; font-size:1rem; }
            .totals { display:grid; grid-template-columns:1fr auto; gap:8px; margin-top:16px; }
            .line { display:flex; justify-content:space-between; padding:6px 0; }
            .grand { display:flex; justify-content:space-between; padding:12px 0; font-size:1.125rem; font-weight:700; border-top:2px solid var(--accent); margin-top:8px; }
            .footer { margin-top:32px; font-size:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
            .badge { background: var(--accent); padding:4px 8px; border-radius:999px; font-size:0.5rem; text-transform:uppercase; letter-spacing:1px; display:inline-block; }
            .info { display:flex; flex-direction:column; gap:4px; }
            .delivery { margin-top:12px; background: rgba(255,255,255,0.03); padding:12px; border-radius:8px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <div class="title">Marobi Receipt</div>
              <div class="info">
                <div><span class="badge">${order.status}</span></div>
                <div class="small">Order: ${order.id}</div>
                <div class="small">Date: ${now}</div>
              </div>
            </div>

            <div class="card">
              <div class="section">
                ${productLines}
              </div>

              <div class="section totals">
                <div>
                  <div class="line">
                    <div>Subtotal</div>
                    <div>${sym}${subtotal.toLocaleString()}</div>
                  </div>
                  <div class="line">
                    <div>VAT (7.5%)</div>
                    <div>${sym}${vat.toLocaleString()}</div>
                  </div>
                  <div class="line">
                    <div>Delivery (${deliveryOptionName})</div>
                    <div>${sym}${deliveryCharge.toLocaleString()}</div>
                  </div>
                  <div class="line">
                    <div>Weight</div>
                    <div>${totalWeight}kg</div>
                  </div>
                </div>
                <div>
                  <div class="grand">
                    <div>Grand Total</div>
                    <div>${sym}${grand.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div class="delivery">
                <div><strong>Delivery Option:</strong> ${deliveryOptionName}</div>
                <div><strong>Delivery Fee:</strong> ${sym}${deliveryCharge.toLocaleString()}</div>
                ${
                  order.deliveryDetails
                    ? `<div><strong>Details:</strong> ${order.deliveryDetails}</div>`
                    : ""
                }
              </div>

              <div class="footer">
                <div>
                  <div><strong>Customer:</strong> ${
                    order.customer?.name ?? "Guest"
                  }</div>
                  <div><strong>Email:</strong> ${
                    order.customer?.email ?? "-"
                  }</div>
                  <div><strong>Phone:</strong> ${
                    order.customer?.phone ?? "-"
                  }</div>
                  <div><strong>Address:</strong> ${
                    order.customer?.address ?? "-"
                  }</div>
                </div>
                <div>
                  <div><strong>Payment:</strong> ${order.paymentMethod}</div>
                  <div><strong>Channel:</strong> ${
                    order.channel === "OFFLINE"
                      ? "Offline Sale"
                      : "Online Store"
                  }</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { default: printJS } = await import("print-js");
    printJS({
      printable: html,
      type: "raw-html",
      scanStyles: false,
      style: receiptCSS,
    });
  }

  const filtered = useMemo(() => {
    return data.filter((o) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !o.id.toLowerCase().includes(s) &&
          !(o.customer?.name.toLowerCase() ?? "").includes(s)
        ) {
          return false;
        }
      }
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (currencyFilter !== "All" && o.currency !== currencyFilter)
        return false;
      return true;
    });
  }, [data, search, statusFilter, currencyFilter]);

  function handleExportCSV() {
    const rows = filtered.map((o) => {
      // product summary
      const productSummary = o.products
        .map(
          (p) =>
            `${p.name} x${p.quantity} (Color: ${p.color}, Size: ${p.size})`
        )
        .join(" | ");

      // size mod summary per product
      const sizeModSummary = o.products
        .map((p) => {
          if (!p.hasSizeMod) return null;
          const custom = p.customSize
            ? `; custom: ${Object.entries(p.customSize)
                .map(([k, v]) => `${k}:${v}`)
                .join(", ")}`
            : "";
          return `${p.name}: fee ${p.sizeModFee.toFixed(2)}${custom}`;
        })
        .filter(Boolean)
        .join(" | ");

      return {
        "Order ID": o.id,
        Status: o.status,
        Channel: o.channel === "OFFLINE" ? "Offline Sale" : "Online Store",
        Currency: o.currency,
        "Amount (NGN)": o.totalNGN,
        Amount: o.totalAmount,
        "Payment Method": o.paymentMethod,
        "Customer Name": o.customer.name,
        "Customer Email": o.customer.email,
        "Customer Phone": o.customer.phone,
        "Customer Address": o.customer.address,
        "Delivery Option": o.deliveryOption?.name ?? "—",
        "Delivery Fee": o.deliveryFee ?? 0,
        "Delivery Details": o.deliveryDetails || "—",
        Products: productSummary,
        "Size Modifications": sizeModSummary || "None",
        "Created At": o.createdAt,
      };
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const columns = useMemo<ColumnDef<OrderRow>[]>(() => [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ getValue }) => (
        <code className="font-mono text-sm">{getValue<string>()}</code>
      ),
    },
    {
      id: "preview",
      header: "Order Contents",
      cell: ({ row }) => {
        const prods = row.original.products.slice(0, 3);
        return (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {prods.map((p, i) => (
                <img
                  key={i}
                  src={p.image || "/placeholder.png"}
                  alt={p.name}
                  className="h-8 w-8 rounded-md border-2 border-white object-cover"
                  style={{ zIndex: prods.length - i }}
                />
              ))}
              {row.original.products.length > 3 && (
                <div className="h-8 w-8 rounded-md bg-gray-200 text-xs font-medium flex items-center justify-center border-2 border-white">
                  +{row.original.products.length - 3}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-2 whitespace-nowrap"
              onClick={() => openReceiptModal(row.original)}
            >
              View All
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const color =
          s === "Processing"
            ? "bg-blue-100 text-blue-800"
            : s === "Shipped"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800";
        const isUpdating = updatingIds.has(row.original.id);
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-sm font-medium ${color}`}
            >
              {s}
            </span>
            <Select
              value={row.original.status}
              onValueChange={(v) =>
                handleStatusChange(row.original.id, v as OrderStatus)
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 px-2 w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s2) => (
                  <SelectItem key={s2} value={s2}>
                    {s2}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdating && (
              <RefreshCcw className="animate-spin h-4 w-4 text-gray-600" />
            )}
          </div>
        );
      },
    },
    {
      id: "amountNGN",
      header: "Amount (NGN)",
      accessorFn: (r) => r.totalNGN,
      cell: ({ getValue }) => (
        <span className="font-medium">
          ₦{getValue<number>().toLocaleString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "amount",
      header: "Amount",
      accessorFn: (r) => r.totalAmount,
      cell: ({ getValue, row }) => {
        const sym =
          row.original.currency === "NGN"
            ? "₦"
            : row.original.currency === "USD"
            ? "$"
            : row.original.currency === "EUR"
            ? "€"
            : "£";
        return (
          <span className="font-medium">
            {sym}
            {getValue<number>().toLocaleString()}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "currency",
      header: "Currency",
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ getValue }) => {
        const v = getValue<OrderChannel>();
        return v === "OFFLINE" ? "Offline Sale" : "Online Store";
      },
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const cust = row.original.customer;
        if (cust.id) {
          return (
            <Link
              href={`/admin/customers/${cust.id}`}
              className="text-indigo-600 hover:underline"
            >
              {cust.name}
            </Link>
          );
        }
        return <span className="text-gray-500">Guest</span>;
      },
    },
    {
      id: "delivery",
      header: "Delivery",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.deliveryOption?.name ?? "—"}</div>
          {typeof row.original.deliveryFee === "number" && (
            <div className="text-xs text-gray-500">
              Fee: ₦{row.original.deliveryFee.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePrint(row.original)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Printer className="h-5 w-5" />
          </Button>
        </div>
      ),
    },
  ], [updatingIds]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      {/* Export + filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <Input
            placeholder="Search orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm"
          />
          <div className="flex space-x-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currencyFilter}
              onValueChange={(v) => setCurrencyFilter(v as any)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Currencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Currencies</SelectItem>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-gray-50">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={`px-4 py-2 text-left text-gray-700 font-semibold ${
                        canSort ? "cursor-pointer select-none" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {!header.isPlaceholder && (
                        <div className="flex items-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="ml-1">
                              {{
                                asc: <ChevronUp className="h-4 w-4" />,
                                desc: <ChevronDown className="h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="even:bg-white odd:bg-gray-50 hover:bg-gray-100"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="text-center py-6 text-gray-500"
                >
                  No orders match your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <Button
          variant="link"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ← Prev
        </Button>
        <span className="text-sm text-gray-700">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button
          variant="link"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next →
        </Button>
        <select
          className="ml-2 border rounded p-1"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 50].map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      {/* Receipt Modal */}
      {receiptOrder && (
        <Dialog open={receiptOpen} onOpenChange={() => setReceiptOpen(false)}>
          <DialogContent className="max-w-lg rounded-lg shadow-lg print:hidden">
            <DialogHeader>
              <DialogTitle>Receipt — {receiptOrder.id}</DialogTitle>
              <DialogDescription>
                Payment: <strong>{receiptOrder.paymentMethod}</strong> —{" "}
                {new Date(receiptOrder.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="mt-6 max-h-[60vh] space-y-4">
              {(() => {
                const o = receiptOrder!;
                const vatRate = 0.075;
                const subtotal = +o.totalAmount.toFixed(2);
                const vat = +(subtotal * vatRate).toFixed(2);
                const deliveryCharge = o.deliveryFee ?? 0;
                const deliveryOptionName = o.deliveryOption?.name || "—";
                const totalWeight = o.products
                  .reduce((w, p) => w + p.quantity * 0.2, 0)
                  .toFixed(2);
                const sym =
                  o.currency === "NGN"
                    ? "₦"
                    : o.currency === "USD"
                    ? "$"
                    : o.currency === "EUR"
                    ? "€"
                    : "£";
                const grand = +(subtotal + vat + deliveryCharge).toFixed(2);

                return (
                  <div className="px-2 space-y-4">
                    {o.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between mb-2 border-b pb-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-gray-600">
                            Color: {p.color} • Size: {p.size} • Qty:{" "}
                            {p.quantity}
                          </div>
                          {p.hasSizeMod && (
                            <div className="mt-1 text-[12px] bg-indigo-50 p-2 rounded">
                              <div>
                                <strong>Size Mod:</strong> applied (5%)
                              </div>
                              <div>
                                <strong>Fee:</strong> {sym}
                                {p.sizeModFee.toFixed(2)}
                              </div>
                              {p.customSize && (
                                <div className="text-xs mt-1">
                                  <div className="font-medium">
                                    Custom measurements:
                                  </div>
                                  <div>
                                    {Object.entries(p.customSize)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(" • ")}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
                      <span>Delivery ({deliveryOptionName})</span>
                      <span>
                        {sym}
                        {deliveryCharge.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight</span>
                      <span>{totalWeight}kg</span>
                    </div>
                    <div className="flex justify-between font-semibold mt-2">
                      <span>Grand Total</span>
                      <span>
                        {sym}
                        {grand.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 text-sm space-y-1">
                      <div>
                        <strong>Customer:</strong> {o.customer?.name ?? "Guest"}
                      </div>
                      <div>
                        <strong>Email:</strong> {o.customer?.email ?? "-"}
                      </div>
                      <div>
                        <strong>Phone:</strong> {o.customer?.phone ?? "-"}
                      </div>
                      <div>
                        <strong>Address:</strong> {o.customer?.address ?? "-"}
                      </div>
                      <div className="mt-2">
                        <div>
                          <strong>Delivery Option:</strong>{" "}
                          {deliveryOptionName}
                        </div>
                        <div>
                          <strong>Delivery Details:</strong>{" "}
                          {o.deliveryDetails || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </ScrollArea>
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>
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
    </>
  );
}
