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
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronUp, ChevronDown, MoreVertical } from "lucide-react";

/* ---------- Types ---------- */
export type AdminProduct = {
  id: string;
  name: string;
  image: string;
  category:
    | "Corporate Wears"
    | "African Print"
    | "Casual Looks"
    | "I Have an Event"
    | string;
  price: { NGN: number; USD: number; EUR: number; GBP: number };
  stockCount: number;
  stockTotal: number;
  status: "Draft" | "Published" | "Archived";
  averageRating?: number;
  ratingCount?: number;
  createdAt?: Date;
};

interface Props {
  initialData: AdminProduct[]; // never undefined
}

/* ---------- Component ---------- */
export default function ProductsTable({ initialData }: Props) {
  // Defensive: ensure array
  const safeInitial: AdminProduct[] = Array.isArray(initialData) ? initialData : [];

  const [data, setData] = useState<AdminProduct[]>(safeInitial);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<"All" | AdminProduct["category"]>("All");
  const [statusFilter, setStatusFilter] =
    useState<"All" | AdminProduct["status"]>("All");
  const [stockFilter, setStockFilter] =
    useState<"All" | "InStock" | "OutOfStock">("All");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  function openDeleteModal(ids: string[]) {
    setPendingDeleteIds(ids);
    setDeleteModalOpen(true);
  }
  function handleConfirmDelete() {
    setData(d => d.filter(p => !pendingDeleteIds.includes(p.id)));
    table.resetRowSelection();
    setPendingDeleteIds([]);
    setDeleteModalOpen(false);
  }
  function handleCancelDelete() {
    setPendingDeleteIds([]);
    setDeleteModalOpen(false);
  }

  /* ---------- Filtering ---------- */
  const filteredData = useMemo(() => {
    return data.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (stockFilter === "InStock" && p.stockCount === 0) return false;
      if (stockFilter === "OutOfStock" && p.stockCount > 0) return false;
      return true;
    });
  }, [data, search, categoryFilter, statusFilter, stockFilter]);

  /* ---------- Columns ---------- */
  const columns = useMemo<ColumnDef<AdminProduct>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={val => table.toggleAllPageRowsSelected(!!val)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
            onCheckedChange={val => row.toggleSelected(!!val)}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {row.original.image ? (
            <img
              src={row.original.image}
              alt={row.original.name}
              className="h-10 w-10 rounded object-cover border"
            />
          ) : (
            <div className="h-10 w-10 rounded border bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
              NO IMG
            </div>
          )}
          <span>{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const style =
          s === "Published"
            ? "bg-green-100 text-green-800"
            : s === "Draft"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-200 text-gray-700";
        return (
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
            {s}
          </span>
        );
      },
    },
    {
      id: "priceNGN",
      header: "₦",
      accessorFn: r => r.price.NGN,
      cell: ({ getValue }) => `₦${getValue<number>().toLocaleString()}`,
      enableSorting: true,
    },
    {
      id: "priceUSD",
      header: "$",
      accessorFn: r => r.price.USD,
      cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
      enableSorting: true,
    },
    {
      id: "priceEUR",
      header: "€",
      accessorFn: r => r.price.EUR,
      cell: ({ getValue }) => `€${getValue<number>().toLocaleString()}`,
      enableSorting: true,
    },
    {
      id: "priceGBP",
      header: "£",
      accessorFn: r => r.price.GBP,
      cell: ({ getValue }) => `£${getValue<number>().toLocaleString()}`,
      enableSorting: true,
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const { stockCount, stockTotal } = row.original;
        const inStock = stockCount > 0;
        return (
          <div className="flex items-center space-x-2">
            <span
              className={`h-2 w-2 rounded-full ${
                inStock ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span>
              {stockCount}/{stockTotal}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              (window.location.href = `/admin/product-management/${row.original.id}`)
            }
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              (window.location.href = `/admin/product-management/${row.original.id}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openDeleteModal([row.original.id])}
            aria-label="Delete product"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ], []);

  /* ---------- Table Instance ---------- */
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

  const selectedIds = table.getSelectedRowModel().flatRows.map(r => r.original.id);

  function handleBulkPublish() {
    setData(d =>
      d.map(p => (selectedIds.includes(p.id) ? { ...p, status: "Published" } : p))
    );
    table.resetRowSelection();
  }
  function handleBulkUnpublish() {
    setData(d =>
      d.map(p => (selectedIds.includes(p.id) ? { ...p, status: "Draft" } : p))
    );
    table.resetRowSelection();
  }

  return (
    <div>
      {/* Bulk toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-4">
          <div>
            <strong>{selectedIds.length}</strong> selected
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Bulk actions">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openDeleteModal(selectedIds)}>
                Delete Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkPublish}>
                Publish Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkUnpublish}>
                Unpublish Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full md:w-auto">
          {/* Category filter */}
          <Select
            value={categoryFilter}
            onValueChange={val => setCategoryFilter(val as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Corporate Wears">Corporate Wears</SelectItem>
              <SelectItem value="African Print">African Print</SelectItem>
              <SelectItem value="Casual Looks">Casual Looks</SelectItem>
              <SelectItem value="I Have an Event">I Have an Event</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={val => setStatusFilter(val as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Stock filter */}
          <Select
            value={stockFilter}
            onValueChange={val => setStockFilter(val as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stock</SelectItem>
              <SelectItem value="InStock">In Stock</SelectItem>
              <SelectItem value="OutOfStock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => {
                  if (header.isPlaceholder) return <TableHead key={header.id} />;
                  const canSort = header.column.getCanSort();
                  const content = flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  );
                  return (
                    <TableHead key={header.id} className="p-2">
                      {canSort ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ")
                              header.column.getToggleSortingHandler()?.(e as any);
                          }}
                          className="flex items-center space-x-1 cursor-pointer select-none"
                        >
                          {content}
                          {({
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />,
                          } as any)[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        content
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} className="even:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="space-x-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            ← Prev
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next →
          </button>
        </div>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 40, 50].map(s => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pendingDeleteIds.length > 1
                ? `Delete ${pendingDeleteIds.length} products?`
                : `Delete “${data.find(p => p.id === pendingDeleteIds[0])?.name ?? ""}”?`}
            </DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
