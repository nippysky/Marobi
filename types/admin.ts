export interface AdminCustomerRow {
  id: string;
  name: string;              // combined first + last
  email: string;
  phone: string;
  totalOrders: number;
  lastLogin: string | null;  // ISO
  registeredAt: string;      // ISO
}

export interface AdminCustomerOrderProduct {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
  size: string;
  quantity: number;
  lineTotal: number;
}

export interface AdminCustomerOrder {
  id: string;
  status: "Processing" | "Shipped" | "Delivered";
  currency: "NGN" | "USD" | "EUR" | "GBP";
  totalAmount: number;
  totalNGN: number;
  createdAt: string;
  products: AdminCustomerOrderProduct[];
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string; // from deliveryAddress OR billingAddress fallback
  };
}
