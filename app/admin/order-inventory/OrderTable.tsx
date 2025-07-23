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
import {
  ChevronUp,
  ChevronDown,
  Printer,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OrderRow } from "@/types/orders";

type Props = { initialData: OrderRow[] };

const STATUS_OPTIONS: OrderRow["status"][] = [
  "Processing",
  "Shipped",
  "Delivered",
];
const CURRENCY_OPTIONS: OrderRow["currency"][] = [
  "NGN",
  "USD",
  "EUR",
  "GBP",
];

export default function OrderTable({ initialData }: Props) {
  const [data] = useState<OrderRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderRow["status"]>("All");
  const [currencyFilter, setCurrencyFilter] = useState<"All" | OrderRow["currency"]>("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const [receiptOrder, setReceiptOrder] = useState<OrderRow | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // open the little “receipt preview” dialog
  function openReceiptModal(order: OrderRow) {
    setReceiptOrder(order);
    setReceiptOpen(true);
  }

  // filter & search
  const filtered = useMemo(() => {
    return data.filter((o) => {
      if (
        search &&
        !o.id.toLowerCase().includes(search.toLowerCase()) &&
        !o.customer.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (currencyFilter !== "All" && o.currency !== currencyFilter) return false;
      return true;
    });
  }, [data, search, statusFilter, currencyFilter]);

  // table definition
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
                  key={p.id}
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
          <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${color}`}>
            {s}
          </span>
        );
      },
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
        const { id, name } = row.original.customer;
        return id ? (
          <Link href={`/admin/customers/${id}`} className="text-indigo-600 hover:underline">
            {name}
          </Link>
        ) : (
          <span className="text-gray-500">Guest</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.print()} /* or call your handlePrint */
          className="text-gray-600 hover:text-gray-900"
        >
          <Printer className="h-5 w-5" />
        </Button>
      ),
    },
  ], []);

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
      {/* ── Filters Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
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

      {/* ── Table Card ──────────────────────────────────────────────────────────── */}
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
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell colSpan={columns.length} className="text-center py-6 text-gray-500">
                  No orders match your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-4">
        <Button
          variant="link"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ← Prev
        </Button>
        <span className="text-sm text-gray-700">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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

      {/* ── Receipt Preview Modal ──────────────────────────────────────────────── */}
      {receiptOrder && (
        <Dialog open={receiptOpen} onOpenChange={() => setReceiptOpen(false)}>
          <DialogContent className="max-w-lg rounded-lg shadow-lg print:hidden">
            <DialogHeader>
              <DialogTitle>Receipt — {receiptOrder.id}</DialogTitle>
              <DialogDescription>
                Payment: {receiptOrder.paymentMethod} —{" "}
                {new Date(receiptOrder.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="mt-6 max-h-[60vh] space-y-4">
              {/* … your existing receipt markup here … */}
            </ScrollArea>
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.print()}
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
