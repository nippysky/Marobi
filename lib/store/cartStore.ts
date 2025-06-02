// store/cartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/products";

/**
 * A single item in the cart: wraps a Product plus the desired quantity,
 * as well as the specific color and size the user chose.
 */
export interface CartItem {
  product: Product;
  quantity: number;
  color: string;
  size: string;
}

interface CartStoreState {
  items: CartItem[];

  /**
   * Add a Product to the cart (or increment quantity if already present).
   * Now also takes color and size as parameters.
   */
  addToCart: (product: Product, color: string, size: string) => void;

  // Remove a Product (with a specific color & size) from the cart
  removeFromCart: (productId: string, color: string, size: string) => void;

  // Directly set a new quantity for a given product ID + color + size (removes if ≤ 0)
  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    newQty: number
  ) => void;

  // Empty the entire cart
  clearCart: () => void;

  // Computed total number of items (sum of all quantities)
  totalItems: () => number;

  // Computed total price (sum of product.price × quantity)
  totalAmount: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist<CartStoreState>(
    (set, get) => ({
      items: [],

      addToCart: (product: Product, color: string, size: string) => {
        const items = get().items;
        // We’ll identify an item uniquely by product.id + color + size
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === product.id &&
            ci.color === color &&
            ci.size === size
        );

        if (idx !== -1) {
          // Already in cart with the same color & size → increment quantity (capped at inStock)
          const existing = items[idx];
          const newQty = Math.min(existing.quantity + 1, product.inStock);
          const updatedItems = [
            ...items.slice(0, idx),
            { product, quantity: newQty, color, size },
            ...items.slice(idx + 1),
          ];
          set({ items: updatedItems });
        } else {
          // Not yet in cart (for this product/color/size) → add with quantity = 1
          set({
            items: [...items, { product, quantity: 1, color, size }],
          });
        }
      },

      removeFromCart: (productId: string, color: string, size: string) => {
        const items = get().items;
        set({
          items: items.filter(
            (ci) =>
              !(
                ci.product.id === productId &&
                ci.color === color &&
                ci.size === size
              )
          ),
        });
      },

      updateQuantity: (
        productId: string,
        color: string,
        size: string,
        newQty: number
      ) => {
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === productId &&
            ci.color === color &&
            ci.size === size
        );
        if (idx === -1) return;

        if (newQty <= 0) {
          // Remove if newQty ≤ 0
          set({
            items: items.filter(
              (ci) =>
                !(
                  ci.product.id === productId &&
                  ci.color === color &&
                  ci.size === size
                )
            ),
          });
        } else {
          // Cap at inStock
          const productInCart = items[idx].product;
          const cappedQty = Math.min(newQty, productInCart.inStock);
          const updatedItems = [
            ...items.slice(0, idx),
            { product: productInCart, quantity: cappedQty, color, size },
            ...items.slice(idx + 1),
          ];
          set({ items: updatedItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      totalItems: () => {
        return get().items.reduce(
          (sum, ci) => sum + ci.quantity,
          0
        );
      },

      totalAmount: () => {
        return get().items.reduce(
          (sum, ci) => sum + ci.product.price * ci.quantity,
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
