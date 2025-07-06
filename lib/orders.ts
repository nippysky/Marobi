// lib/orders.ts
import { generateDummyProducts } from "./products";

// 1) Define Customer
export interface Customer {
  id?: string;          // optional customer ID
  name: string;
  phone: string;
  email: string;
  address: string;
}

// 2) OrderItem & AdminOrder
export interface OrderItem {
  id: string;
  name: string;
  image: string;
  category: string;            // ← NEW
  quantity: number;
  currency: "NGN" | "USD" | "EUR" | "GBP";
  lineTotal: number;
  color: string;               // product color
  size: string;                // product size
}

export interface AdminOrder {
  id: string;                  // 10-char uppercase ID
  status: "Processing" | "Shipped" | "Delivered";
  totalNGN: number;
  currency: "NGN" | "USD" | "EUR" | "GBP";
  totalAmount: number;         // in order currency
  customer: Customer;
  products: OrderItem[];
}

// helper to make a 10-char random ID (uppercase)
function makeRandomId(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s.toUpperCase();
}

const STATUSES: AdminOrder["status"][] = ["Processing", "Shipped", "Delivered"];
const CURRENCIES: AdminOrder["currency"][] = ["NGN", "USD", "EUR", "GBP"];
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "M!001",
    name: "Alice Johnson",
    phone: "+2348130000000",
    email: "alice@example.com",
    address:
      "12 Marina Road, 56 Nonsense testing, BCG Quarters, Lagos State, Nigeria",
  },
  {
    id: "M!002",
    name: "Bob Smith",
    phone: "+2348020000000",
    email: "bob@example.com",
    address:
      "12 Marina Road, 56 Nonsense testing, BCG Quarters, Lagos State, Nigeria",
  },
  {
    // guest checkout (no `id`)
    name: "Guest User",
    phone: "+2347010000000",
    email: "guest@example.com",
    address:
      "12 Marina Road, 56 Nonsense testing, BCG Quarters, Lagos State, Nigeria",
  },
];
const COLORS = ["Red", "Blue", "Green", "Black", "White"];
const SIZES = ["S", "M", "L", "XL", "XXL"];

export function generateDummyOrders(count: number): AdminOrder[] {
  const products = generateDummyProducts(count * 8);

  return Array.from({ length: count }).map((_, i) => {
    const currency = CURRENCIES[i % CURRENCIES.length];
    const totalAmount = parseFloat((10 + Math.random() * 490).toFixed(2));
    const rate = currency === "NGN"
      ? 750 + Math.random() * 250
      : currency === "USD"
      ? 1
      : currency === "EUR"
      ? 0.9
      : 0.8;

    const numItems = Math.ceil(Math.random() * 8);
    const sliceStart = i * 8;
    const sliceEnd = sliceStart + numItems;
    const picked = products.slice(sliceStart, sliceEnd);

    // build each OrderItem — now with p.category
    const items: OrderItem[] = picked.map((p) => {
      const qty = Math.floor(Math.random() * 5) + 1;
      const unitPrice = (p.price as any)[currency] as number;
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,                // ← PASS IT THROUGH
        quantity: qty,
        currency,
        lineTotal: parseFloat((unitPrice * qty).toFixed(2)),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: SIZES[Math.floor(Math.random() * SIZES.length)],
      };
    });

    return {
      id: makeRandomId(10),
      status: STATUSES[i % STATUSES.length],
      totalNGN: Math.round(totalAmount * rate),
      currency,
      totalAmount,
      customer: SAMPLE_CUSTOMERS[i % SAMPLE_CUSTOMERS.length],
      products: items,
    };
  });
}
