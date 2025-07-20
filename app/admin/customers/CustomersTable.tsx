"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { AdminCustomerRow } from "@/types/admin";

type Props = { initialData: AdminCustomerRow[] };

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function CustomersTable({ initialData }: Props) {
  const [data, setData] = useState<AdminCustomerRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // Delete dialogs
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(
      c =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = useMemo<ColumnDef<AdminCustomerRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all customers"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          aria-label={`Select customer ${row.original.id}`}
        />
      ),
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <code className="font-mono text-xs">{getValue<string>()}</code>
      ),
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone Number" },
    {
      accessorKey: "totalOrders",
      header: "Total # Orders",
      enableSorting: true,
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ getValue }) => formatDateTime(getValue<string | null>()),
      enableSorting: true,
    },
    {
      accessorKey: "registeredAt",
      header: "Registration Date",
      cell: ({ getValue }) => formatDateTime(getValue<string>()),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setToDeleteId(row.original.id);
              setSingleDialogOpen(true);
            }}
            aria-label="Delete customer"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </Button>
          <Button asChild variant="outline" size="sm" aria-label="View customer">
            <Link href={`/admin/customers/${row.original.id}`}>
              View <Eye className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      ),
    },
  ], []);

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

  const selectedIds = table
    .getSelectedRowModel()
    .flatRows.map(r => r.original.id);

  function confirmBulkDelete() {
    setData(d => d.filter(c => !selectedIds.includes(c.id)));
    table.resetRowSelection();
    setBulkDialogOpen(false);
  }
  function confirmSingleDelete() {
    if (toDeleteId) {
      setData(d => d.filter(c => c.id !== toDeleteId));
      table.resetRowSelection();
    }
    setSingleDialogOpen(false);
    setToDeleteId(null);
  }

  return (
    <>
      {/* Search + bulk toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <Input
          placeholder="Search by ID, name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded w-full md:w-auto">
            <span>
              <strong>{selectedIds.length}</strong> selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Bulk actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setBulkDialogOpen(true)}>
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={`p-2 ${
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
            {table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className="even:bg-gray-50 hover:bg-gray-100"
              >
                {row.getVisibleCells().map(cell => (
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
        {filteredData.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No matching customers.
          </div>
        )}
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
        <select
          className="ml-2 border rounded p-1"
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 50].map(s => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.length} customer
              {selectedIds.length > 1 && "s"}?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Dialog */}
      <Dialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer {toDeleteId}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
            <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSingleDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmSingleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
