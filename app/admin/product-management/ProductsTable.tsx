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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronUp, ChevronDown, MoreVertical, Eye } from "lucide-react";

export type AdminProduct = {
  id: string;
  name: string;
  image: string;
  category: string;
  price: { NGN: number; USD: number; EUR: number; GBP: number };
  stockCount: number;
  stockTotal: number;
  status: "Draft" | "Published" | "Archived";
  createdAt: Date;
};

interface Props {
  initialData: AdminProduct[];
}

export default function ProductsTable({ initialData }: Props) {
  const [data, setData] = useState<AdminProduct[]>(initialData);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | string>("All");
  const [status, setStatus] = useState<"All" | AdminProduct["status"]>("All");
  const [stock, setStock] = useState<"All" | "InStock" | "OutOfStock">("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  // Bulk‐delete dialog
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Columns definition
  const columns = useMemo<ColumnDef<AdminProduct>[]>(() => [
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
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {row.original.image ? (
            <img
              src={row.original.image}
              alt={row.original.name}
              className="h-10 w-10 rounded-md object-cover border"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">
              No Img
            </div>
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const badge =
          s === "Published"
            ? "bg-green-100 text-green-800"
            : s === "Draft"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-200 text-gray-700";
        return <span className={`px-2 py-0.5 rounded-full text-xs ${badge}`}>{s}</span>;
      },
    },
    {
      id: "price",
      header: "₦ Price",
      accessorFn: (r) => r.price.NGN,
      cell: ({ getValue }) => (
        <code className="font-mono">₦{getValue<number>().toLocaleString()}</code>
      ),
      enableSorting: true,
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const { stockCount, stockTotal } = row.original;
        const inStock = stockCount > 0;
        return (
          <div className="flex items-center space-x-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                inStock ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Actions">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/product-management/${row.original.id}`}>  <Eye className="mr-2 h-4 w-4" />View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/product-management/${row.original.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openDelete([row.original.id])}>
              <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  // Filter data
  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "All" && p.category !== category) return false;
      if (status !== "All" && p.status !== status) return false;
      if (stock === "InStock" && p.stockCount === 0) return false;
      if (stock === "OutOfStock" && p.stockCount > 0) return false;
      return true;
    });
  }, [data, search, category, status, stock]);

  // ─── Now that `columns`, `filtered`, `sorting`, and `pagination` are ready ───
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

  // ─── Only *after* `table` is defined do we read from it ───
  const selectedIds = useMemo(
    () => table.getSelectedRowModel().flatRows.map(r => r.original.id),
    [table.getSelectedRowModel().flatRows]
  );

  function openDelete(ids: string[]) {
    setPendingDelete(ids);
    setDeleteOpen(true);
  }
  function confirmDelete() {
    setData((d) => d.filter((p) => !pendingDelete.includes(p.id)));
    table.resetRowSelection();
    setPendingDelete([]);
    setDeleteOpen(false);
  }

  const anySelected = selectedIds.length > 0;

  return (
    <>
      {/* Bulk toolbar */}
      {anySelected && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-4">
          <span>
            <strong>{selectedIds.length}</strong> selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openDelete(selectedIds)}>
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <div className="flex space-x-2">
          <Select value={category} onValueChange={(v) => setCategory(v)}>
            <SelectTrigger className="w-[152px]">
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

          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-[152px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stock} onValueChange={(v) => setStock(v as any)}>
            <SelectTrigger className="w-[152px]">
              <SelectValue placeholder="Stock Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stock</SelectItem>
              <SelectItem value="InStock">In Stock</SelectItem>
              <SelectItem value="OutOfStock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-gray-50">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`px-4 py-2 text-left ${
                      header.column.getCanSort() ? "cursor-pointer select-none" : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {!header.isPlaceholder && (
                      <div className="flex items-center space-x-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="h-4 w-4" />,
                          desc: <ChevronDown className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
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
                  No products found.
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

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingDelete.length > 1
                ? `Delete ${pendingDelete.length} products?`
                : `Delete product?`}
            </DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
