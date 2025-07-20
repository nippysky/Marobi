export type OrderRow = {
  id: string;
  status: "Processing" | "Shipped" | "Delivered";
  currency: "NGN" | "USD" | "EUR" | "GBP";
  totalAmount: number;      // in original currency (sum of lineTotal by currency)
  totalNGN: number;         // persisted field from Order model
  createdAt: string;        // ISO string for easier client serialization
  customer: {
    id: string;
    name: string;   // firstName + lastName
    email: string;
    phone: string;
    address: string;
  };
  products: Array<{
    id: string;       // orderItem.id
    name: string;
    image: string | null;
    color: string;
    size: string;
    quantity: number;
    lineTotal: number;
  }>;
  paymentMethod: string;
};
