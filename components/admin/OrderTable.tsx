// components/admin/OrderTable.tsx
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
import { renderReceiptHTML } from "@/lib/receipt/html"; // shared renderer

type OrderTableProps = {
  data: OrderRow[];
  pageSize?: number;
  showSearch?: boolean;
  showExport?: boolean;
  showPagination?: boolean;
};

const STATUS_OPTIONS: OrderStatus[] = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];
const CURRENCY_OPTIONS: Currency[] = ["NGN", "USD", "EUR", "GBP"];

function displayDeliveryDetails(details: string | null | undefined) {
  if (!details || details === "—") return <span>—</span>;
  if (details.includes("•")) {
    return (
      <div className="space-y-1">
        {details.split("•").map((entry, idx) => (
          <div key={idx}>{entry.trim()}</div>
        ))}
      </div>
    );
  }
  return <span>{details}</span>;
}

export default function OrderTable({
  data: initialData,
  pageSize = 50,
  showSearch = true,
  showExport = true,
  showPagination = true,
}: OrderTableProps) {
  const [data, setData] = useState<OrderRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [currencyFilter, setCurrencyFilter] = useState<"All" | Currency>("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [receiptOrder, setReceiptOrder] = useState<OrderRow | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  function openReceiptModal(order: OrderRow) {
    setReceiptOrder(order);
    setReceiptOpen(true);
  }

  // Normalize OrderRow -> renderer input
  function toRenderPayload(o: OrderRow) {
    return {
      order: {
        id: o.id,
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        items: o.products.map((p) => ({
          name: p.name,
          image: p.image,
          quantity: p.quantity,
          lineTotal: p.lineTotal,
          color: p.color,
          size: p.size,
          hasSizeMod: p.hasSizeMod,
          sizeModFee: p.sizeModFee,
          customSize: p.customSize || undefined,
        })),
      },
      recipient: {
        firstName: o.customer?.name?.split(" ")[0] ?? "Customer",
        lastName: o.customer?.name?.split(" ").slice(1).join(" ") ?? "",
        email: o.customer?.email ?? "",
        deliveryAddress: o.customer?.address ?? "",
        billingAddress: o.customer?.address ?? "",
      },
      currency: o.currency as any,
      deliveryFee: o.deliveryFee ?? 0,
    };
  }

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

  async function handlePrint(order: OrderRow) {
    const { default: printJS } = await import("print-js");
    const html = renderReceiptHTML(toRenderPayload(order));
    printJS({ printable: html, type: "raw-html", scanStyles: false });
  }

  const filtered = useMemo(() => {
    return data.filter((o) => {
      if (showSearch && search) {
        const s = search.toLowerCase();
        if (
          !o.id.toLowerCase().includes(s) &&
          !(o.customer?.name.toLowerCase() ?? "").includes(s)
        ) {
          return false;
        }
      }
      if (showSearch && statusFilter !== "All" && o.status !== statusFilter)
        return false;
      if (showSearch && currencyFilter !== "All" && o.currency !== currencyFilter)
        return false;
      return true;
    });
  }, [data, search, statusFilter, currencyFilter, showSearch]);

  function handleExportCSV() {
    const rows = filtered.map((o) => {
      const productSummary = o.products
        .map(
          (p) =>
            `${p.name} x${p.quantity} (Color: ${p.color}, Size: ${p.size})`
        )
        .join(" | ");
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
        "Delivery Address": o.customer.address ?? "—",
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

  // Columns
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
            : s === "Delivered"
            ? "bg-green-100 text-green-800"
            : s === "Cancelled"
            ? "bg-red-100 text-red-800"
            : "";
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
          <div className="text-xs mt-1 text-gray-600">
            {displayDeliveryDetails(row.original.deliveryDetails)}
          </div>
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
      {(showExport || showSearch) && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {showExport && (
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-1 h-4 w-4" /> Export CSV
              </Button>
            )}
          </div>
          {showSearch && (
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
          )}
        </div>
      )}

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
                              {({
                                asc: <ChevronUp className="h-4 w-4" />,
                                desc: <ChevronDown className="h-4 w-4" />,
                              } as any)[header.column.getIsSorted() as string] ?? null}
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
      {showPagination && (
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
      )}

      {/* Receipt Modal — now fluid and responsive to the shared HTML */}
      {receiptOrder && (
        <Dialog open={receiptOpen} onOpenChange={() => setReceiptOpen(false)}>
          <DialogContent
            // fluid width that comfortably fits the 640px receipt plus padding,
            // but never exceeds the viewport
            className="w-[96vw] max-w-[980px] p-0 rounded-lg shadow-lg print:hidden"
          >
            {/* header section retains padding */}
            <div className="px-6 pt-5">
              <DialogHeader>
                <DialogTitle>Receipt — {receiptOrder.id}</DialogTitle>
                <DialogDescription>
                  Payment: <strong>{receiptOrder.paymentMethod}</strong> —{" "}
                  {new Date(receiptOrder.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* the receipt viewport */}
            <ScrollArea className="mt-3 max-h-[78vh] px-0 pb-4" type="auto">
              {/* Wrap to apply responsive overrides to the injected HTML */}
              <div className="receipt-frame mx-4">
                <div
                  className="receipt-html"
                  dangerouslySetInnerHTML={{
                    __html: renderReceiptHTML(toRenderPayload(receiptOrder)),
                  }}
                />
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 pb-5 space-x-2">
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

            {/* global overrides to make email-style HTML responsive inside the modal */}
            <style jsx global>{`
              .receipt-frame {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                overflow: hidden;
              }
              .receipt-frame,
              .receipt-frame * {
                box-sizing: border-box;
              }
              /* Make every nested table flexible */
              .receipt-frame table {
                width: 100% !important;
                max-width: 100% !important;
              }
              /* Avoid side-scroll */
              .receipt-frame {
                overflow-x: hidden;
              }
              /* Images should scale inside cells */
              .receipt-frame img {
                max-width: 100% !important;
                height: auto !important;
              }
              /* Break long content gracefully */
              .receipt-frame td,
              .receipt-frame th {
                word-break: break-word;
              }
            `}</style>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
