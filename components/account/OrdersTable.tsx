// components/account/OrdersTable.tsx
"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface OrderRow {
  id: string;
  createdAt: string;
  status: string;
  currency: string;
  totalAmount: number;
}

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Order ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell>
              {new Date(o.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>{o.id}</TableCell>
            <TableCell>{o.status}</TableCell>
            <TableCell>
              {o.currency} {o.totalAmount.toFixed(2)}
            </TableCell>
            <TableCell>
              <Link href={`/account/orders/${o.id}`}>
                <Button size="sm">View Details</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
