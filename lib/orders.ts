import { generateDummyProducts } from "./products"

// ——— 1) Define Customer ———
export interface Customer {
  name: string
  phone: string
  email: string
  address: string
}

// ——— 2) OrderItem & AdminOrder as before ———
export interface OrderItem {
  id: string
  name: string
  image: string
  quantity: number
  currency: "NGN" | "USD" | "EUR" | "GBP"
  lineTotal: number
}

export interface AdminOrder {
  id: string
  status: "Processing" | "Delivering" | "Delivered"
  totalNGN: number
  currency: "NGN" | "USD" | "EUR" | "GBP"
  totalAmount: number
  customer: Customer
  products: OrderItem[]
}

// ——— Dummy data sources ———
const STATUSES: AdminOrder["status"][] = [
  "Processing",
  "Delivering",
  "Delivered",
]
const CURRENCIES: AdminOrder["currency"][] = [
  "NGN",
  "USD",
  "EUR",
  "GBP",
]
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    name: "Alice Johnson",
    phone: "+2348130000000",
    email: "alice@example.com",
    address: "12 Marina Road, Lagos",
  },
  {
    name: "Bob Smith",
    phone: "+2348020000000",
    email: "bob@example.com",
    address: "34 Victoria Island, Lagos",
  },
  {
    name: "Carol Lee",
    phone: "+2347010000000",
    email: "carol@example.com",
    address: "56 Ikoyi, Lagos",
  },
]

// ——— 3) generateDummyOrders — now emits full OrderItem objects ———
export function generateDummyOrders(count: number): AdminOrder[] {
  // First get a bunch of fake products
  const prods = generateDummyProducts(count * 3)

  return Array.from({ length: count }).map((_, i) => {
    const currency = CURRENCIES[i % CURRENCIES.length]
    const totalAmount = parseFloat((10 + Math.random() * 490).toFixed(2))
    // pretend a conversion rate
    const rate =
      currency === "NGN"
        ? 750 + Math.random() * 250
        : currency === "USD"
        ? 1
        : currency === "EUR"
        ? 0.9
        : 0.8

    // pick between 1–3 items for this order
    const sliceStart = i * 3
    const sliceEnd = sliceStart + Math.ceil(Math.random() * 3)
    const picked = prods.slice(sliceStart, sliceEnd)

    // Build OrderItem[] from those AdminProducts
    const items: OrderItem[] = picked.map((p) => {
      const qty = Math.floor(Math.random() * 5) + 1
      // dynamic access of p.price based on currency
      const unitPrice = (p.price as any)[currency] as number
      const lineTotal = parseFloat((unitPrice * qty).toFixed(2))

      return {
        id: p.id,
        name: p.name,
        image: p.image,
        quantity: qty,
        currency,
        lineTotal,
      }
    })

    return {
      id: String(i + 1),
      status: STATUSES[i % STATUSES.length],
      totalNGN: Math.round(totalAmount * rate),
      currency,
      totalAmount,
      customer: SAMPLE_CUSTOMERS[i % SAMPLE_CUSTOMERS.length],
      products: items,
    }
  })
}
