import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ProductPayload = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),     // this is the slug now
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
});

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateBrandedId(len = 10) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
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
    } = parsed.data;

    // build variants
    const variants: { color: string; size: string; stock: number }[] = [];
    const sizes = Object.keys(sizeStocks);
    if (colors.length) {
      for (const color of colors) {
        if (sizes.length) {
          for (const size of sizes) {
            variants.push({
              color,
              size,
              stock: Number(sizeStocks[size]) || 0,
            });
          }
        } else {
          variants.push({ color, size: "", stock: 0 });
        }
      }
    } else {
      for (const size of sizes) {
        variants.push({
          color: "",
          size,
          stock: Number(sizeStocks[size]) || 0,
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
        // ◀── 👉 here’s the fix:
        category: { connect: { slug } },
        variants: variants.length
          ? { create: variants.map((v) => ({
              color: v.color,
              size: v.size,
              stock: v.stock,
            })) }
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
