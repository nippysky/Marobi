// app/api/products/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma, { prismaReady } from "@/lib/db";
import { z } from "zod";

/* ────────────────────────────────────────────────────────────
   Validation schema for incoming product payloads
   ──────────────────────────────────────────────────────────── */
const ProductPayload = z.object({
  id: z.string().optional(), // accepted but unused in POST (create only)
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category (slug) is required"),
  description: z.string().optional().nullable(),
  price: z.object({
    NGN: z.number(),
    USD: z.number(),
    EUR: z.number(),
    GBP: z.number(),
  }),
  status: z.enum(["Draft", "Published", "Archived"]),
  sizeMods: z.boolean(),
  colors: z.array(z.string()),
  sizeStocks: z.record(z.string(), z.string()), // { "S": "10", "M": "5" }
  customSizes: z.array(z.string()), // accepted for future use (ignored on write)
  images: z.array(z.string()),
  videoUrl: z.string().url().optional().nullable(),
  weight: z.number().min(0.0001, "Weight must be > 0"),
});

/* ────────────────────────────────────────────────────────────
   Utility: generate a compact branded product id, and ensure uniqueness
   ──────────────────────────────────────────────────────────── */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateBrandedId(len = 10) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

async function generateUniqueProductId() {
  // Very low collision probability; still check DB to be safe.
  // Prefix optional; keeping plain alphanumeric to match your examples.
  // If you prefer, switch to `P-` + random for readability.
  while (true) {
    const id = generateBrandedId(10);
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return id;
  }
}

/* ────────────────────────────────────────────────────────────
   GET /api/products
   Returns all Published products in a shaped format.
   ──────────────────────────────────────────────────────────── */
export async function GET(_req: NextRequest) {
  try {
    await prismaReady;

    const products = await prisma.product.findMany({
      where: { status: "Published" },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        priceNGN: true,
        priceUSD: true,
        priceEUR: true,
        priceGBP: true,
        sizeMods: true,
        status: true,
        videoUrl: true,
        categorySlug: true,
        variants: {
          select: {
            color: true,
            size: true,
            stock: true,
            weight: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const shaped = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      images: p.images,
      prices: {
        NGN: p.priceNGN ?? 0,
        USD: p.priceUSD ?? 0,
        EUR: p.priceEUR ?? 0,
        GBP: p.priceGBP ?? 0,
      },
      sizeMods: p.sizeMods,
      status: p.status,
      videoUrl: p.videoUrl ?? null,
      category: p.categorySlug,
      variants: p.variants.map((v) => ({
        color: v.color,
        size: v.size,
        inStock: v.stock,
        weight: v.weight ?? null,
      })),
    }));

    return NextResponse.json(shaped, {
      status: 200,
      headers: {
        // Public cache (CDN) 60s, allow SWR for 120s
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /api/products
   Creates a product under an existing Category (by slug).
   Builds variants as the cartesian product of colors × sizes in `sizeStocks`.
   Each variant receives the same `weight` provided.
   ──────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    await prismaReady;

    const json = await request.json();
    const parsed = ProductPayload.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      category: slug,
      description,
      price,
      status,
      sizeMods,
      colors,
      sizeStocks,
      // customSizes, // (accepted; currently not persisted in schema)
      images,
      videoUrl,
      weight,
    } = parsed.data;

    // Require at least one color or one size
    const sizes = Object.keys(sizeStocks);
    if (colors.length === 0 && sizes.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one color or one size" },
        { status: 400 }
      );
    }

    // Ensure category exists and is active
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { slug: true, isActive: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: `Category '${slug}' not found. Create it first.` },
        { status: 404 }
      );
    }
    if (!category.isActive) {
      return NextResponse.json(
        { error: `Category '${slug}' is not active.` },
        { status: 400 }
      );
    }

    // Build variants (apply a single `weight` to all)
    // When both colors & sizes exist, produce full cartesian product.
    // If only colors exist, create one row per color with empty size.
    // If only sizes exist, create one row per size with empty color.
    const variants: Array<{ color: string; size: string; stock: number; weight: number }> = [];

    if (colors.length && sizes.length) {
      for (const color of colors) {
        for (const size of sizes) {
          variants.push({
            color,
            size,
            stock: Number(sizeStocks[size] ?? "0") || 0,
            weight,
          });
        }
      }
    } else if (colors.length) {
      for (const color of colors) {
        variants.push({ color, size: "", stock: 0, weight });
      }
    } else {
      for (const size of sizes) {
        variants.push({
          color: "",
          size,
          stock: Number(sizeStocks[size] ?? "0") || 0,
          weight,
        });
      }
    }

    // Generate a unique branded product id
    const brandedId = await generateUniqueProductId();

    const product = await prisma.product.create({
      data: {
        id: brandedId,
        name,
        description: description ?? null,
        images,
        priceNGN: price.NGN,
        priceUSD: price.USD,
        priceEUR: price.EUR,
        priceGBP: price.GBP,
        sizeMods,
        status, // "Draft" | "Published" | "Archived" (matches Prisma enum)
        videoUrl: videoUrl ?? null,
        category: { connect: { slug } },
        variants: variants.length
          ? {
              create: variants.map((v) => ({
                color: v.color,
                size: v.size,
                stock: v.stock,
                weight: v.weight,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        priceNGN: true,
        priceUSD: true,
        priceEUR: true,
        priceGBP: true,
        sizeMods: true,
        status: true,
        videoUrl: true,
        categorySlug: true,
        variants: {
          select: {
            color: true,
            size: true,
            stock: true,
            weight: true,
          },
        },
      },
    });

    const shaped = {
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      images: product.images,
      prices: {
        NGN: product.priceNGN ?? 0,
        USD: product.priceUSD ?? 0,
        EUR: product.priceEUR ?? 0,
        GBP: product.priceGBP ?? 0,
      },
      sizeMods: product.sizeMods,
      status: product.status,
      videoUrl: product.videoUrl ?? null,
      category: product.categorySlug,
      variants: product.variants.map((v) => ({
        color: v.color,
        size: v.size,
        inStock: v.stock,
        weight: v.weight ?? null,
      })),
    };

    return NextResponse.json(shaped, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
