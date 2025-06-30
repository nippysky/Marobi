import LogOfflineSaleButton from "@/components/admin/LogOfflineSaleButton";
import OrderTable from "@/components/admin/OrderTable";
import { generateDummyOrders } from "@/lib/orders";

export default function OrderInventoryPage() {
  const initialData = generateDummyOrders(50); // runs on server
  return (
    <div className="py-6 px-3">
      <div className="flex justify-end mb-10">
        <LogOfflineSaleButton />
      </div>
      <OrderTable initialData={initialData} />
    </div>
  );
}
