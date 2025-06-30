// components/admin/OrderTable.tsx
"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

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
import { ChevronUp, ChevronDown } from "lucide-react";

import { AdminOrder } from "@/lib/orders";

type Props = { initialData: AdminOrder[] };

// central source of truth for status strings
const STATUS_OPTIONS: AdminOrder["status"][] = [
  "Processing",
  "Delivering",
  "Delivered",
];

export default function OrderTable({ initialData }: Props) {
  // — state
  const [data, setData] = useState<AdminOrder[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | AdminOrder["status"]
  >("All");
  const [currencyFilter, setCurrencyFilter] = useState<
    "All" | AdminOrder["currency"]
  >("All");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  // — dialogs
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [dialogProducts, setDialogProducts] = useState<
    AdminOrder["products"]
  >([]);

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [dialogCustomer, setDialogCustomer] = useState<
    AdminOrder["customer"] | undefined
  >(undefined);

  const [selectedStatusDialog, setSelectedStatusDialog] =
    useState(false);

  function openProductsDialog(prods: AdminOrder["products"]) {
    setDialogProducts(prods);
    setProductsDialogOpen(true);
  }
  function openCustomerDialog(cus: AdminOrder["customer"]) {
    setDialogCustomer(cus);
    setCustomerDialogOpen(true);
  }

  // — filtered + searched data
  const filteredData = useMemo(
    () =>
      data.filter((o) => {
        if (
          search &&
          !o.id.includes(search) &&
          !o.customer.name
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        if (statusFilter !== "All" && o.status !== statusFilter)
          return false;
        if (
          currencyFilter !== "All" &&
          o.currency !== currencyFilter
        )
          return false;
        return true;
      }),
    [data, search, statusFilter, currencyFilter]
  );

  // — column definitions
  const columns = useMemo<ColumnDef<AdminOrder>[]>(() => [
    // 0) multi-select
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) =>
            table.toggleAllPageRowsSelected(!!v)
          }
          aria-label="Select all orders"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select order ${row.original.id}`}
        />
      ),
    },
    // 1) Order ID
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ getValue }) => (
        <code className="font-mono">{getValue<string>()}</code>
      ),
    },
    // 2) stacked images + “View all”
    {
      id: "order",
      header: "Order",
      cell: ({ row }) => {
        const prods = row.original.products;
        const display = prods.slice(0, 3);
        return (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {display.map((p, i) => (
                <img
                  key={p.id}
                  src={p.image}
                  alt={p.name}
                  className="h-8 w-8 rounded-md border-2 border-white object-cover"
                  style={{ zIndex: display.length - i }}
                />
              ))}
              {prods.length > 3 && (
                <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                  +{prods.length - 3}
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="ml-2"
              onClick={() => openProductsDialog(prods)}
            >
              View all
            </Button>
          </div>
        );
      },
    },
    // 3) Status pill
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const color =
          s === "Processing"
            ? "bg-blue-100 text-blue-800"
            : s === "Delivering"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800";
        return (
          <span className={`px-2 py-0.5 rounded-full ${color}`}>
            {s}
          </span>
        );
      },
    },
    // 4) ₦ Total
    {
      id: "totalNGN",
      header: "₦ Amount",
      accessorFn: (row) => row.totalNGN,
      cell: ({ getValue }) =>
        `₦${getValue<number>().toLocaleString()}`,
      enableSorting: true,
    },
    // 5) Currency code
    { accessorKey: "currency", header: "Order Currency" },
    // 6) Amount in order currency
    {
      id: "amount",
      header: "Order Amount",
      accessorFn: (row) => row.totalAmount,
      cell: ({ getValue, row }) => {
        const sym =
          row.original.currency === "NGN"
            ? "₦"
            : row.original.currency === "USD"
            ? "$"
            : row.original.currency === "EUR"
            ? "€"
            : "£";
        return `${sym}${getValue<number>().toLocaleString()}`;
      },
      enableSorting: true,
    },
    // 7) Customer link
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <Button
          variant="link"
          size="sm"
          onClick={() =>
            openCustomerDialog(row.original.customer)
          }
        >
          {row.original.customer.name}
        </Button>
      ),
    },
    // 8) Change status dropdown
    {
      id: "actions",
      header: "Change Status",
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.status}
          onValueChange={(val) =>
            setData((d) =>
              d.map((o) =>
                o.id === row.original.id
                  ? { ...o, status: val as AdminOrder["status"] }
                  : o
              )
            )
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((st) => (
              <SelectItem key={st} value={st}>
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ], []);

  // — table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // — bulk-select logic
  const selectedIds = table
    .getSelectedRowModel()
    .flatRows.map((r) => r.original.id);

  function applyStatus(status: AdminOrder["status"]) {
    setData((d) =>
      d.map((o) =>
        selectedIds.includes(o.id) ? { ...o, status } : o
      )
    );
    table.resetRowSelection();
    setSelectedStatusDialog(false);
  }

  return (
    <div>
      {/* Bulk toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-4">
          <strong>{selectedIds.length}</strong> selected
          <Button
            variant="outline"
            onClick={() => setSelectedStatusDialog(true)}
          >
            Change Status
          </Button>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <div className="flex space-x-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Currencies</SelectItem>
              {["NGN", "USD", "EUR", "GBP"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="p-2">
                    {!header.isPlaceholder && (
                      <>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1 inline-block align-middle">
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </span>
                        )}
                      </>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="even:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-2">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
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
        <span>
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
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 50].map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products dialog */}
      <Dialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Items</DialogTitle>
            <DialogDescription>
              {dialogProducts.length} item
              {dialogProducts.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4">
            {dialogProducts.map((p) => (
              <a
                key={p.id}
                href={`/admin/product-management/${p.id}/edit`}
                target="_blank"
                className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    Qty: {p.quantity} &bull;{" "}
                    {p.currency === "NGN"
                      ? `₦${p.lineTotal.toLocaleString()}`
                      : p.currency === "USD"
                      ? `$${p.lineTotal.toLocaleString()}`
                      : p.currency === "EUR"
                      ? `€${p.lineTotal.toLocaleString()}`
                      : `£${p.lineTotal.toLocaleString()}`}
                  </div>
                </div>
              </a>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer dialog */}
      <Dialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              {dialogCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          {dialogCustomer && (
            <div className="space-y-2 p-4 text-sm">
              <div>
                <strong>Phone:</strong> {dialogCustomer.phone}
              </div>
              <div>
                <strong>Email:</strong> {dialogCustomer.email}
              </div>
              <div>
                <strong>Address:</strong> {dialogCustomer.address}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk‐status dialog */}
      <Dialog
        open={selectedStatusDialog}
        onOpenChange={setSelectedStatusDialog}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Apply to {selectedIds.length} selected order
              {selectedIds.length > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 p-4">
            {STATUS_OPTIONS.map((st) => (
              <Button
                key={st}
                className="w-full"
                onClick={() => applyStatus(st)}
              >
                {st}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
