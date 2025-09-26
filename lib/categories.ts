// lib/categories.ts
import { prisma } from "@/lib/db";

export interface Category {
  slug: string;
  name: string;
  description?: string;
  bannerImage?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Fetch all *active* categories for navigation/home.
 * Categories are dynamic; new rows appear automatically after creation.
 */
export async function getAllCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      name: true,
      description: true,
      bannerImage: true,
      isActive: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description ?? undefined,
    bannerImage: r.bannerImage ?? undefined,
    isActive: r.isActive,
    sortOrder: r.sortOrder ?? 0,
  }));
}

/**
 * Fetch a single category by slug (active or inactive).
 */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const r = await prisma.category.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      bannerImage: true,
      isActive: true,
      sortOrder: true,
    },
  });
  if (!r) return undefined;
  return {
    slug: r.slug,
    name: r.name,
    description: r.description ?? undefined,
    bannerImage: r.bannerImage ?? undefined,
    isActive: r.isActive,
    sortOrder: r.sortOrder ?? 0,
  };
}
