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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Printer, Download, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

import Papa from "papaparse";

import type { OrderRow } from "@/types/orders";
import { OrderStatus, Currency } from "@/lib/generated/prisma-client";
import { receiptCSS } from "@/lib/utils";

type Props = { initialData: OrderRow[] };

const STATUS_OPTIONS: OrderStatus[] = ["Processing", "Shipped", "Delivered"];
const CURRENCY_OPTIONS: Currency[] = ["NGN", "USD", "EUR", "GBP"];

export default function OrderTable({ initialData }: Props) {
  // ─── State ────────────────────────────────────────────────────────────
  const [data, setData] = useState<OrderRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [currencyFilter, setCurrencyFilter] = useState<"All" | Currency>("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

    // single & bulk delete states
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [receiptOrder, setReceiptOrder] = useState<OrderRow | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [rowSelection, setRowSelection] = useState<{ [key: string]: boolean }>({});



  function openReceiptModal(order: OrderRow) {
    setReceiptOrder(order);
    setReceiptOpen(true);
  }


    // ─── DELETE logic ─────────────────────────────────────────────────────
  async function doDelete(ids: string[]) {
    try {
      await toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(`/api/orders/${id}`, { method: "DELETE" }).then(res => {
              if (!res.ok) throw new Error("Delete failed");
            })
          )
        ),
        {
          loading: `Deleting ${ids.length} order(s)…`,
          success: `Deleted ${ids.length} order(s)!`,
          error: `Could not delete orders`,
        }
      );
      // remove from UI
      setData((d) => d.filter((o) => !ids.includes(o.id)));
    } catch {
      /* handled by toast */
    } finally {
      setDeleteOpen(false);
      table.resetRowSelection();
    }
  }

  function confirmDelete(id: string) {
    setPendingDelete([id]);
    setDeleteOpen(true);
  }

  function confirmBulkDelete() {
    setPendingDelete(selectedIds);
    setDeleteOpen(true);
  }


  // ─── Inline status update ─────────────────────────────────────────────
  async function handleStatusChange(id: string, newStatus: OrderStatus) {
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
      toast.success("Status updated");
    } catch (err: any) {
      toast.error("❌ " + err.message);
    }
  }

  // ─── Print with print‑js ──────────────────────────────────────────────
  async function handlePrint(order: OrderRow) {
    if (typeof window === "undefined") return;

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
    const grand = +(subtotal + vat + deliveryCharge).toFixed(2);

    const lines = order.products
      .map(
        (p) => `
      <div class="line">
        <div>
          ${p.name}<br/>
          <span class="small">Color: ${p.color} • Size: ${p.size} • Qty: ${
          p.quantity
        }</span>
        </div>
        <div>${sym}${p.lineTotal.toLocaleString()}</div>
      </div>`
      )
      .join("");

    const html = `
      <html>
        <head><style>${receiptCSS}</style></head>
        <body>
          <div class="header">
            <div>${now}</div>
            <div>Marobi Receipt</div>
            <div>Order: ${order.id}</div>
          </div>
          <div>Payment: ${order.paymentMethod}</div>
          ${lines}
          <div class="total"><span>Subtotal</span><span>${sym}${subtotal.toLocaleString()}</span></div>
          <div class="line"><span>VAT ${(vatRate * 100).toFixed(1)}%</span><span>${sym}${vat.toLocaleString()}</span></div>
          <div class="line"><span>Delivery</span><span>${sym}${deliveryCharge.toLocaleString()}</span></div>
          <div class="line"><span>Weight</span><span>${totalWeight}kg</span></div>
          <div class="line"><span>Courier</span><span>${courier}</span></div>
          <div class="total"><span>Grand Total</span><span>${sym}${grand.toLocaleString()}</span></div>
          <div class="footer small">
            Customer: ${order.customer?.name ?? "Guest"}<br/>
            Email: ${order.customer?.email ?? "-"}<br/>
            Phone: ${order.customer?.phone ?? "-"}<br/>
            Address: ${order.customer?.address ?? "-"}
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

  // ─── Filtering & searching ────────────────────────────────────────────
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

  // ─── CSV Export ───────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = filtered.map((o) => ({
      "Order ID": o.id,
      Status: o.status,
      "Amount (NGN)": o.totalNGN,
      Amount: o.totalAmount,
      Currency: o.currency,
      "Payment Method": o.paymentMethod,
      "Customer Name": o.customer.name,
      "Customer Email": o.customer.email,
      "Customer Phone": o.customer.phone,
      "Customer Address": o.customer.address,
      "Created At": o.createdAt,
    }));
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

  // ─── Columns & table instance ────────────────────────────────────────
  const columns = useMemo<ColumnDef<OrderRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
    },
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ getValue }) => (
        <code className="font-mono text-sm">{getValue<string>()}</code>
      ),
    },
    {
      id: "preview",
      header: "Order Contents",
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
              View All
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
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-sm font-medium ${color}`}
          >
            {s}
          </span>
        );
      },
    },
    {
      id: "amountNGN",
      header: "Amount (NGN)",
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
          <Select
            value={row.original.status}
            onValueChange={(v) =>
              handleStatusChange(row.original.id, v as OrderStatus)
            }
          >
            <SelectTrigger className="h-8 px-2 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-800"
            onClick={() => confirmDelete(row.original.id)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      ),
    },
  ], []);

  // ─── Columns & table instance ────────────────────────────────────────
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ─── Helpers ───────────────────────────────────────────────────────────
  const selectedIds = useMemo(
    () => table.getSelectedRowModel().flatRows.map(r => r.original.id),
    [table]
  );
  const anySelected = selectedIds.length > 0;

  return (
    <>
      {/* Bulk toolbar */}
      {anySelected && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-4">
          <span>
            <strong>{selectedIds.length}</strong> selected
          </span>
          <Button size="sm" variant="destructive" onClick={confirmBulkDelete}>
            Delete Selected
          </Button>
        </div>
      )}


      {/* ── Export + Filters Bar ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="mb-2 md:mb-0"
        >
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>

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

      {/* ── Table ── */}
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

      {/* ── Pagination ── */}
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

      {/* ── Receipt Preview Modal ── */}
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
                const grand = +(subtotal + vat + deliveryCharge).toFixed(2);

                return (
                  <div className="px-2">
                    {o.products.map((p) => (
                      <div key={p.id} className="flex justify-between mb-2">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-gray-600">
                            Color: {p.color} • Size: {p.size} • Qty: {p.quantity}
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

      
      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete {pendingDelete.length > 1 ? `${pendingDelete.length} orders?` : `order?`}
            </DialogTitle>
            <DialogDescription>
              This <strong>cannot</strong> be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => doDelete(pendingDelete)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
