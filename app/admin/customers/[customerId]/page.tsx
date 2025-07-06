import React from 'react'
import { generateDummyOrders, AdminOrder, OrderItem } from '@/lib/orders'
import CustomerSummary from '@/components/admin/CustomerSummary'
import CustomerOrdersTable from '@/components/admin/CustomerOrdersTable'
import BackButton from '@/components/BackButton'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params

  // 1) Generate 10 dummy orders and force each order.customer to our single Test Customer
  const orders: AdminOrder[] = generateDummyOrders(10).map(order => ({
    ...order,
    customer: {
      id:      customerId,
      name:    'Test Customer',            // still required by AdminOrder type, unused in our summary
      email:   'test@example.com',
      phone:   '+2348000000000',
      address: order.customer.address,
    }
  }))

  // 2) Build per‐category breakdown
  const breakdown: Record<string, number> = {}
  orders.forEach(o =>
    o.products.forEach((p: OrderItem) => {
      breakdown[p.category] = (breakdown[p.category] || 0) + 1
    })
  )

  // 3) Compute totals
  const totalOrders = orders.length
  const totalSpent  = orders.reduce((sum, o) => sum + o.totalNGN, 0)

  // 4) Pick billing & shipping (using first order’s address as dummy)
  const billingAddress  = orders[0]?.customer.address ?? 'N/A'
  const shippingAddress = orders[0]?.customer.address ?? 'N/A'

  // 5) Build a “real” customer object for our summary
  const dummyCustomer = {
    id:           customerId,
    firstName:    'Test',
    lastName:     'Customer',
    email:        'test@example.com',
    phone:        '+2348000000000',
    totalOrders,
    totalSpent,
    registeredAt: new Date().toISOString(),
    lastLogin:    new Date().toISOString(),
  }

  return (
    <div className="space-y-6 p-6">
      {/* ← Back button at top */}
      <BackButton />

      {/* Summary: now uses firstName / lastName + totalSpent */}
      <CustomerSummary
        customer={dummyCustomer}
        breakdown={breakdown}
        billingAddress={billingAddress}
        shippingAddress={shippingAddress}
      />

      {/* Orders table (client) */}
      <CustomerOrdersTable initialData={orders} />
    </div>
  )
}
