import { prisma } from "@/lib/db";

export interface Category {
  slug: string;
  name: string;
  description?: string;
}

/**
 * Fetch all categories (for nav, sidebar, etc).
 */
export async function getAllCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    select: { slug: true, name: true, description: true },
    orderBy: { name: "asc" },
  });
  return rows.map(({ slug, name, description }) => ({
    slug,
    name,
    description: description ?? undefined,
  }));
}

/**
 * Fetch a single category by slug, or undefined if not found.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const row = await prisma.category.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true },
  });
  if (!row) return undefined;
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
  };
}
