// store/cartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/products";

/**
 * A single item in the cart: wraps a Product plus the desired quantity.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * The shape of our Zustand cart store.
 */
interface CartStoreState {
  items: CartItem[];

  // Add a Product to the cart (or increment quantity if already present)
  addToCart: (product: Product) => void;

  // Remove a Product from the cart by ID
  removeFromCart: (productId: string) => void;

  // Directly set a new quantity for a given product ID (removes if ≤ 0)
  updateQuantity: (productId: string, newQty: number) => void;

  // Empty the entire cart
  clearCart: () => void;

  // Computed: total number of items (sum of all quantities)
  totalItems: () => number;

  // Computed: total price (sum of product.price × quantity)
  totalAmount: () => number;
}

/**
 * Create the cart store, persisted to localStorage under key "cart".
 */
export const useCartStore = create<CartStoreState>()(
  persist<CartStoreState>(
    (set, get) => ({
      items: [],

      addToCart: (product: Product) => {
        const items = get().items;
        const idx = items.findIndex((ci) => ci.product.id === product.id);

        if (idx !== -1) {
          // Already in cart → increment quantity (capped at inStock)
          const existing = items[idx];
          const newQty = Math.min(existing.quantity + 1, product.inStock);
          const updatedItems = [
            ...items.slice(0, idx),
            { product, quantity: newQty },
            ...items.slice(idx + 1),
          ];
          set({ items: updatedItems });
        } else {
          // Not yet in cart → add with quantity = 1
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },

      removeFromCart: (productId: string) => {
        const items = get().items;
        set({ items: items.filter((ci) => ci.product.id !== productId) });
      },

      updateQuantity: (productId: string, newQty: number) => {
        const items = get().items;
        const idx = items.findIndex((ci) => ci.product.id === productId);
        if (idx === -1) return;

        if (newQty <= 0) {
          // Remove if quantity ≤ 0
          set({ items: items.filter((ci) => ci.product.id !== productId) });
        } else {
          // Cap at inStock
          const product = items[idx].product;
          const cappedQty = Math.min(newQty, product.inStock);
          const updatedItems = [
            ...items.slice(0, idx),
            { product, quantity: cappedQty },
            ...items.slice(idx + 1),
          ];
          set({ items: updatedItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      totalItems: () => {
        const items = get().items;
        return items.reduce((sum: number, ci: CartItem) => sum + ci.quantity, 0);
      },

      totalAmount: () => {
        const items = get().items;
        return items.reduce(
          (sum: number, ci: CartItem) => sum + ci.product.price * ci.quantity,
          0
        );
      },
    }),
    {
      name: "cart", // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
