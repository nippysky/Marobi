import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersSection() {
  // TODO: Fetch your real orders
  const orders: Array<{
    id: string;
    date: string;
    items: { name: string }[];
    status: string;
  }> = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left py-2">Order #</th>
                <th className="text-left py-2">Date Bought</th>
                <th className="text-left py-2">Items</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-2">{order.id}</td>
                  <td className="py-2">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {order.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="py-2">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You haven’t placed any orders yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
