import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ProductPayload = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
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
  sizeStocks: z.record(z.string(), z.string()),
  customSizes: z.array(z.string()),
  images: z.array(z.string()),
  videoUrl: z.url().optional().nullable(),
  weight: z.number().min(0.0001), 
});

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateBrandedId(len = 10) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
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
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      customSizes,
      images,
      videoUrl,
      weight,
    } = parsed.data;

    // build variants (all get the same weight)
    const variants: { color: string; size: string; stock: number; weight: number }[] = [];
    const sizes = Object.keys(sizeStocks);
    if (colors.length) {
      for (const color of colors) {
        if (sizes.length) {
          for (const size of sizes) {
            variants.push({
              color,
              size,
              stock: Number(sizeStocks[size]) || 0,
              weight,
            });
          }
        } else {
          variants.push({ color, size: "", stock: 0, weight });
        }
      }
    } else {
      for (const size of sizes) {
        variants.push({
          color: "",
          size,
          stock: Number(sizeStocks[size]) || 0,
          weight,
        });
      }
    }

    const brandedId = generateBrandedId(10);

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
        status,
        videoUrl,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
