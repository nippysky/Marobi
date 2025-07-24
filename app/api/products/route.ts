export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";


// ─── 1) Zod schema for validation ────────────────────────
const ProductPayload = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable().optional(),
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
});

// ─── 2) Branded ID generator ─────────────────────────────
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
function generateBrandedId(length = 10): string {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return res;
}

export async function POST(request: NextRequest) {
  try {
  const json = await request.json();
  const parsed = ProductPayload.safeParse(json);
  if (!parsed.success) {
    const errs = z.treeifyError(parsed.error);
    return NextResponse.json({ error: errs }, { status: 400 });
  }
    const {
      name,
      category,
      description,
      price,
      status,
      sizeMods,
      colors,
      sizeStocks,
      customSizes,
      images,
    } = parsed.data;

    // build variants list
    const variants: {
      color: string;
      size: string;
      stock: number;
    }[] = [];
    const sizes = Object.keys(sizeStocks);

    if (colors.length > 0) {
      for (const color of colors) {
        if (sizes.length) {
          for (const size of sizes) {
            const qty = Number(sizeStocks[size]) || 0;
            variants.push({ color, size, stock: qty });
          }
        } else {
          variants.push({ color, size: "", stock: 0 });
        }
      }
    } else {
      for (const size of sizes) {
        const qty = Number(sizeStocks[size]) || 0;
        variants.push({ color: "", size, stock: qty });
      }
    }

    // generate our branded product ID
    const brandedId = generateBrandedId(10);

    // create the product + nested variants
    const product = await prisma.product.create({
      data: {
        id: brandedId,
        name,
        description: description ?? null,
        images,
        category,
        priceNGN: price.NGN,
        priceUSD: price.USD,
        priceEUR: price.EUR,
        priceGBP: price.GBP,
        sizeMods,
        status,
        variants: variants.length
          ? {
              create: variants.map((v) => ({
                color: v.color,
                size: v.size,
                stock: v.stock,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
