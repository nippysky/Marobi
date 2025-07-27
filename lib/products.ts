import { prisma } from "./db";

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  prices: Record<"NGN" | "USD" | "EUR" | "GBP", number>;
  variants: Array<{
    color: string;
    size: string;
    inStock: number;
  }>;
  sizeMods: boolean;
  videoUrl: string | null;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  rating: number;
  createdAt: Date;
}

/** 1️⃣ Fetch one product by ID */
export async function getProductById(id: string): Promise<Product | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    images: p.images,
    category: p.categorySlug,
    prices: {
      NGN: p.priceNGN ?? 0,
      USD: p.priceUSD ?? 0,
      EUR: p.priceEUR ?? 0,
      GBP: p.priceGBP ?? 0,
    },
    variants: p.variants.map((v) => ({
      color: v.color,
      size: v.size,
      inStock: v.stock,
    })),
    sizeMods: p.sizeMods,
    videoUrl: p.videoUrl, // ← pulled from your new Prisma field
  };
}

/** 2️⃣ Fetch related products in same category */
export async function getProductsByCategory(
  categorySlug: string,
  limit = 8
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { categorySlug },
    take: limit,
    include: { variants: { take: 1 } },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    images: p.images,
    category: p.categorySlug,
    prices: {
      NGN: p.priceNGN ?? 0,
      USD: p.priceUSD ?? 0,
      EUR: p.priceEUR ?? 0,
      GBP: p.priceGBP ?? 0,
    },
    variants: p.variants.map((v) => ({
      color: v.color,
      size: v.size,
      inStock: v.stock,
    })),
    sizeMods: p.sizeMods,
    videoUrl: p.videoUrl, // ← also here
  }));
}

/** 3️⃣ Fetch reviews for a product */
export async function getReviewsByProduct(
  productId: string
): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { productId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    author: `${r.customer.firstName} ${r.customer.lastName}`,
    content: r.body,
    rating: r.rating,
    createdAt: r.createdAt,
  }));
}
