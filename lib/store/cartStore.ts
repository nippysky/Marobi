import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/products";

/**
 * A single item in the cart: wraps a Product plus the desired quantity,
 * as well as the specific color and size the user chose.
 * Optionally, customMods for size modifications.
 */
export interface CartItem {
  product: Product;
  quantity: number;
  color: string;
  size: string;
  customMods?: Record<string, string | number>;
}

interface CartStoreState {
  items: CartItem[];

  addToCart: (
    product: Product,
    color: string,
    size: string,
    quantity?: number,
    customMods?: Record<string, string | number>
  ) => void;
  removeFromCart: (
    productId: string,
    color: string,
    size: string,
    customMods?: Record<string, string | number>
  ) => void;
  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    newQty: number,
    customMods?: Record<string, string | number>
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

// --- Utility for deep equals on customMods ---
function areCustomModsEqual(
  a?: Record<string, string | number>,
  b?: Record<string, string | number>
) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
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

      addToCart: (product, color, size, quantity = 1, customMods) => {
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === product.id &&
            ci.color === color &&
            ci.size === size &&
            areCustomModsEqual(ci.customMods, customMods)
        );

        const maxStock = getVariantStock(product, color, size);

        if (idx !== -1) {
          // increment but cap at that size's inStock
          const existing = items[idx];
          const newQty = Math.min(existing.quantity + quantity, maxStock);
          const updated = [
            ...items.slice(0, idx),
            { ...existing, quantity: newQty },
            ...items.slice(idx + 1),
          ];
          set({ items: updated });
        } else {
          // new item → quantity = min(quantity, stock)
          set({
            items: [
              ...items,
              { product, quantity: Math.min(quantity, maxStock), color, size, customMods },
            ],
          });
        }
      },

      removeFromCart: (productId, color, size, customMods) => {
        const items = get().items;
        set({
          items: items.filter(
            (ci) =>
              !(
                ci.product.id === productId &&
                ci.color === color &&
                ci.size === size &&
                areCustomModsEqual(ci.customMods, customMods)
              )
          ),
        });
      },

      updateQuantity: (productId, color, size, newQty, customMods) => {
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === productId &&
            ci.color === color &&
            ci.size === size &&
            areCustomModsEqual(ci.customMods, customMods)
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
                  ci.size === size &&
                  areCustomModsEqual(ci.customMods, customMods)
                )
            ),
          });
        } else {
          const updated = [
            ...items.slice(0, idx),
            { ...items[idx], quantity: cappedQty },
            ...items.slice(idx + 1),
          ];
          set({ items: updated });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

  totalItems: () => {
        return get().items.length;
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
