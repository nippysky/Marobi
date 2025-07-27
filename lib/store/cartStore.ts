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

  addToCart: (product: Product, color: string, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, newQty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

// Util: get inStock for a product/color/size
function getVariantStock(product: Product, color: string, size: string) {
  const variant = product.variants.find(
    (v) => v.color === color && v.size === size
  );
  return variant?.inStock ?? 0;
}

export const useCartStore = create<CartStoreState>()(
  persist<CartStoreState>(
    (set, get) => ({
      items: [],

      addToCart: (product, color, size, quantity = 1) => {
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === product.id &&
            ci.color === color &&
            ci.size === size
        );

        const maxStock = getVariantStock(product, color, size);

        if (idx !== -1) {
          // increment but cap at that size's inStock
          const existing = items[idx];
          const newQty = Math.min(existing.quantity + quantity, maxStock);
          const updated = [
            ...items.slice(0, idx),
            { product, quantity: newQty, color, size },
            ...items.slice(idx + 1),
          ];
          set({ items: updated });
        } else {
          // new item → quantity = min(quantity, stock)
          set({
            items: [
              ...items,
              { product, quantity: Math.min(quantity, maxStock), color, size },
            ],
          });
        }
      },

      removeFromCart: (productId, color, size) => {
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

      updateQuantity: (productId, color, size, newQty) => {
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === productId &&
            ci.color === color &&
            ci.size === size
        );
        if (idx === -1) return;

        const productInCart = items[idx].product;
        const maxStock = getVariantStock(productInCart, color, size);
        const cappedQty = Math.min(Math.max(newQty, 0), maxStock);

        if (cappedQty <= 0) {
          // remove if zero
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
          const updated = [
            ...items.slice(0, idx),
            { product: productInCart, quantity: cappedQty, color, size },
            ...items.slice(idx + 1),
          ];
          set({ items: updated });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      totalItems: () => {
        return get().items.reduce((sum, ci) => sum + ci.quantity, 0);
      },

      // returns total in NGN (base currency)
      totalAmount: () => {
        return get().items.reduce((sum, { product, quantity }) => {
          // Use NGN, then USD, then any other price
          const unitPrice =
            product.prices.NGN ??
            product.prices.USD ??
            product.prices.EUR ??
            product.prices.GBP ??
            Object.values(product.prices)[0] ??
            0;
          return sum + unitPrice * quantity;
        }, 0);
      },
    }),
    {
      name: "cart", // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
