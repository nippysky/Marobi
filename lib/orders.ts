
import { generateDummyProducts } from "./products"

// 1) Define Customer
export interface Customer {
  name: string
  phone: string
  email: string
  address: string
}

// 2) OrderItem & AdminOrder as before
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

// helper to make an 8-char random ID
function makeRandomId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let s = ""
  for (let i = 0; i < length; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return s
}

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

// 3) Now use makeRandomId() for each order
export function generateDummyOrders(count: number): AdminOrder[] {
  const prods = generateDummyProducts(count * 3)

  return Array.from({ length: count }).map((_, i) => {
    const currency = CURRENCIES[i % CURRENCIES.length]
    const totalAmount = parseFloat((10 + Math.random() * 490).toFixed(2))
    const rate =
      currency === "NGN"
        ? 750 + Math.random() * 250
        : currency === "USD"
        ? 1
        : currency === "EUR"
        ? 0.9
        : 0.8

    const sliceStart = i * 3
    const sliceEnd = sliceStart + Math.ceil(Math.random() * 3)
    const picked = prods.slice(sliceStart, sliceEnd)

    const items: OrderItem[] = picked.map((p) => {
      const qty = Math.floor(Math.random() * 5) + 1
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
      id: makeRandomId(8),
      status: STATUSES[i % STATUSES.length],
      totalNGN: Math.round(totalAmount * rate),
      currency,
      totalAmount,
      customer: SAMPLE_CUSTOMERS[i % SAMPLE_CUSTOMERS.length],
      products: items,
    }
  })
}
