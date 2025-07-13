// app/admin/order-inventory/page.tsx
import OrderInventoryClient from "@/components/admin/OrderInventoryClient"
import { generateDummyOrders, type AdminOrder } from "@/lib/orders"

export default function OrderInventoryPage() {
  // runs on the server
  const initialData: AdminOrder[] = generateDummyOrders(50)

  return <OrderInventoryClient initialData={initialData} />
}
