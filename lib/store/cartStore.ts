import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/products";

/**
 * A single item in the cart: wraps a Product plus the desired quantity,
 * as well as the specific color and size the user chose.
 * Optionally, customMods for size modifications, plus hasSizeMod and the fee.
 */
export interface CartItem {
  product: Product;
  quantity: number;
  color: string;
  size: string;
  price: number;
  hasSizeMod: boolean; 
  sizeModFee: number;
  customMods?: Record<string, string | number>;
}

interface CartStoreState {
  items: CartItem[];

  addToCart: (item: CartItem) => void;
  removeFromCart: (
    productId: string,
    color: string,
    size: string,
    customMods?: Record<string, string | number>,
    hasSizeMod?: boolean
  ) => void;
  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    newQty: number,
    customMods?: Record<string, string | number>,
    hasSizeMod?: boolean
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

// deep equality for customMods
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

// stock helper
function getVariantStock(product: Product, color: string, size: string) {
  const variant = product.variants.find(
    (v) => v.color === color && v.size === size
  );
  return variant?.inStock ?? 0;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],

      // Add or update an item based on product/color/size/customMods/hasSizeMod
      addToCart: (item) => {
        const { product, color, size, quantity, price, hasSizeMod, customMods } = item;
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === product.id &&
            ci.color === color &&
            ci.size === size &&
            ci.hasSizeMod === hasSizeMod &&
            areCustomModsEqual(ci.customMods, customMods)
        );
        const maxStock = getVariantStock(product, color, size);

        if (idx !== -1) {
          const existing = items[idx];
          const newQty = Math.min(existing.quantity + quantity, maxStock);
          const updated = [
            ...items.slice(0, idx),
            { ...existing, quantity: newQty },
            ...items.slice(idx + 1),
          ];
          set({ items: updated });
        } else {
          set({
            items: [
              ...items,
              { product, quantity: Math.min(quantity, maxStock), color, size, price, hasSizeMod, sizeModFee: item.sizeModFee, customMods },
            ],
          });
        }
      },

      removeFromCart: (productId, color, size, customMods, hasSizeMod) => {
        const items = get().items;
        set({
          items: items.filter(
            (ci) => !(
              ci.product.id === productId &&
              ci.color === color &&
              ci.size === size &&
              ci.hasSizeMod === Boolean(hasSizeMod) &&
              areCustomModsEqual(ci.customMods, customMods)
            )
          ),
        });
      },

      updateQuantity: (productId, color, size, newQty, customMods, hasSizeMod) => {
        const items = get().items;
        const idx = items.findIndex(
          (ci) =>
            ci.product.id === productId &&
            ci.color === color &&
            ci.size === size &&
            ci.hasSizeMod === Boolean(hasSizeMod) &&
            areCustomModsEqual(ci.customMods, customMods)
        );
        if (idx === -1) return;

        const productInCart = items[idx].product;
        const maxStock = getVariantStock(productInCart, color, size);
        const cappedQty = Math.min(Math.max(newQty, 0), maxStock);

        if (cappedQty <= 0) {
          set({
            items: items.filter(
              (ci) => !(
                ci.product.id === productId &&
                ci.color === color &&
                ci.size === size &&
                ci.hasSizeMod === Boolean(hasSizeMod) &&
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

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.length,

      totalAmount: () =>
        get().items.reduce(
          (sum, { price, quantity }) => sum + price * quantity,
          0
        ),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
