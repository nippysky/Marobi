// components/CustomerOrdersTable.tsx
'use client'

import React, { useState, useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AdminOrder } from '@/lib/orders'
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { ChevronUp, ChevronDown, Printer } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

type Props = { initialData: AdminOrder[] }

// status & currency dropdown options
const STATUS_OPTIONS: AdminOrder['status'][] = ['Processing','Shipped','Delivered']
const CURRENCY_OPTIONS: AdminOrder['currency'][] = ['NGN','USD','EUR','GBP']

export default function CustomerOrdersTable({ initialData }: Props) {
  // state
  const [data, setData] = useState<AdminOrder[]>(initialData)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | AdminOrder['status']>('All')
  const [currencyFilter, setCurrencyFilter] = useState<'All' | AdminOrder['currency']>('All')
  const [sorting, setSorting] = useState<any[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // dialogs
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [receiptOrder, setReceiptOrder] = useState<AdminOrder | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  function openReceipt(order: AdminOrder, autoPrint = false) {
    setReceiptOrder(order)
    setReceiptOpen(true)
    if (autoPrint) setTimeout(() => window.print(), 300)
  }

  // filtering logic
  const filteredData = useMemo(() => {
    return data.filter(o => {
      if (search &&
          !o.id.includes(search) &&
          !o.customer.name.toLowerCase().includes(search.toLowerCase())
      ) return false
      if (statusFilter !== 'All' && o.status !== statusFilter) return false
      if (currencyFilter !== 'All' && o.currency !== currencyFilter) return false
      return true
    })
  }, [data, search, statusFilter, currencyFilter])

  // column defs (no Customer-ID column here)
  const columns = useMemo<ColumnDef<AdminOrder>[]>(() => [
    // multi-select checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
        />
      ),
    },
    // order ID
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ getValue }) => (
        <code className="font-mono">{getValue<string>()}</code>
      ),
    },
    // stacked images + “View all”
    {
      id: 'order',
      header: 'Order',
      cell: ({ row }) => {
        const prods = row.original.products
        const display = prods.slice(0, 3)
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
              variant="default"
              size="sm"
              className="ml-2"
              onClick={() => openReceipt(row.original)}
            >
              View all
            </Button>
          </div>
        )
      },
    },
    // status pill
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        const color =
          s === 'Processing'
            ? 'bg-blue-100 text-blue-800'
            : s === 'Shipped'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        return <span className={`px-2 py-0.5 rounded-full ${color}`}>{s}</span>
      },
    },
    // ₦ amount
    {
      id: 'totalNGN',
      header: '₦ Amount',
      accessorFn: row => row.totalNGN,
      cell: ({ getValue }) => `₦${getValue<number>().toLocaleString()}`,
      enableSorting: true,
    },
    // currency code
    { accessorKey: 'currency', header: 'Order Currency' },
    // amount in order currency
    {
      id: 'amount',
      header: 'Order Amount',
      accessorFn: row => row.totalAmount,
      cell: ({ getValue, row }) => {
        const sym =
          row.original.currency === 'NGN'
            ? '₦'
            : row.original.currency === 'USD'
            ? '$'
            : row.original.currency === 'EUR'
            ? '€'
            : '£'
        return `${sym}${getValue<number>().toLocaleString()}`
      },
      enableSorting: true,
    },
    // actions: change status & print
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Select
            defaultValue={row.original.status}
            onValueChange={async val => {
              // optimistic UI
              setData(d =>
                d.map(o =>
                  o.id === row.original.id ? { ...o, status: val as any } : o
                )
              )
              // persist via API
              await fetch(`/api/orders/${row.original.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: val }),
              })
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(st => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => openReceipt(row.original, true)}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  // table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const selectedIds = table.getSelectedRowModel().flatRows.map(r => r.original.id)
  function applyBulkStatus(st: AdminOrder['status']) {
    setData(d =>
      d.map(o => (selectedIds.includes(o.id) ? { ...o, status: st } : o))
    )
    setBulkDialogOpen(false)
  }

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <Input
          placeholder="Search orders…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <div className="flex space-x-2">
          <Select
            value={statusFilter}
            onValueChange={v => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {STATUS_OPTIONS.map(st => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currencyFilter}
            onValueChange={v => setCurrencyFilter(v as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Currencies</SelectItem>
              {CURRENCY_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} className="p-2">
                    {!header.isPlaceholder && (
                      <div className="flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {(header.column.getIsSorted() === 'asc' && (
                              <ChevronUp className="h-4 w-4" />
                            )) ||
                              (header.column.getIsSorted() === 'desc' && (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
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
          Page {table.getState().pagination.pageIndex + 1} of{' '}
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

      {/* Bulk-status dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Apply to {selectedIds.length} selected orders.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-2">
            {STATUS_OPTIONS.map(st => (
              <Button key={st} className="w-full" onClick={() => applyBulkStatus(st)}>
                {st}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      {receiptOrder && (
        <Dialog
          open={receiptOpen}
          onOpenChange={() => setReceiptOpen(false)}
        >
          <DialogContent className="max-w-lg print:max-w-full print:p-8 print:shadow-none print:bg-transparent">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <img src="/marobi-logo.png" alt="Marobi" className="h-8" />
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleString()}
                </div>
              </div>
              <DialogTitle className="mt-2">
                Receipt — <span className="font-mono">{receiptOrder.id}</span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Payment Method: <strong>Credit Card</strong>
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable list on screen */}
            <ScrollArea className="mt-6 max-h-[30vh] px-1 print:hidden">
              <div className="flex flex-col space-y-4">
                {receiptOrder.products.map(p => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-600">
                          Color: {p.color} • Size: {p.size} • Qty: {p.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium">
                      {p.currency === 'NGN'
                        ? `₦${p.lineTotal.toLocaleString()}`
                        : p.currency === 'USD'
                        ? `$${p.lineTotal.toLocaleString()}`
                        : p.currency === 'EUR'
                        ? `€${p.lineTotal.toLocaleString()}`
                        : `£${p.lineTotal.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Print view (full list) */}
            <div className="mt-6 px-1 hidden print:block">
              <div className="flex flex-col space-y-4">
                {receiptOrder.products.map(p => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between"
                  >
                    {/* same as above */}
                    <div className="flex items-start space-x-4">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-600">
                          Color: {p.color} • Size: {p.size} • Qty: {p.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium">
                      {p.currency === 'NGN'
                        ? `₦${p.lineTotal.toLocaleString()}`
                        : p.currency === 'USD'
                        ? `$${p.lineTotal.toLocaleString()}`
                        : p.currency === 'EUR'
                        ? `€${p.lineTotal.toLocaleString()}`
                        : `£${p.lineTotal.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 flex justify-between text-lg font-semibold px-1">
              <span>Total</span>
              <span>₦{receiptOrder.totalNGN.toLocaleString()}</span>
            </div>

            {/* Customer & address */}
            <div className="mt-6 px-1 text-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h3 className="font-medium">Customer Details</h3>
                <div>Name: {receiptOrder.customer.name}</div>
                <div>Email: {receiptOrder.customer.email}</div>
                <div>Phone: {receiptOrder.customer.phone}</div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Shipping Address</h3>
                <p className="mt-1">{receiptOrder.customer.address}</p>
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end space-x-2 print:hidden px-1">
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => openReceipt(receiptOrder, true)}
              >
                <Printer className="mr-1 h-4 w-4" />
                Print
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
