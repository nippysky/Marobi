import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ------------------------------------------------------------------
   ENUM (local fallback). Replace when @prisma/client enum import OK:
   import { ProductStatus } from "@prisma/client";
------------------------------------------------------------------- */
const PRODUCT_STATUSES = ["Draft", "Published", "Archived"] as const;
type ProductStatus = typeof PRODUCT_STATUSES[number];
const isProductStatus = (v: unknown): v is ProductStatus =>
  typeof v === "string" && (PRODUCT_STATUSES as readonly string[]).includes(v);

/* ------------------------------------------------------------------
   UTILITIES
------------------------------------------------------------------- */
const comboKey = (c: string, s: string) => `${c}|||${s}`;

function numOrNull(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanStringArray(
  raw: unknown,
  {
    dedupe = true,
    max = 50,
    maxLen = 180,
  }: { dedupe?: boolean; max?: number; maxLen?: number } = {}
): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (!t) continue;
    const clipped = t.slice(0, maxLen);
    if (dedupe) {
      if (seen.has(clipped)) continue;
      seen.add(clipped);
    }
    out.push(clipped);
    if (out.length >= max) break;
  }
  return out;
}

function cleanSizeStocks(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== "string" || typeof v !== "string") continue;
    const label = k.trim();
    const stockStr = v.trim();
    if (!label || !stockStr) continue;
    out[label] = stockStr;
  }
  return out;
}

function safePositiveInt(str: string, {
  min = 0,
  max = 1_000_000,
}: { min?: number; max?: number } = {}): number | null {
  const n = parseInt(str, 10);
  if (!Number.isFinite(n)) return null;
  if (n < min) return null;
  if (n > max) return max;
  return n;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/* ------------------------------------------------------------------
   PUT /api/products/[id]
------------------------------------------------------------------- */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const productId = id;

  // (Auth placeholder) — add NextAuth or custom guard here.
  // const session = await getServerSession(authOptions); etc.

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  /* ---------- Basic Field Validation ---------- */
  if (!body?.name || typeof body.name !== "string")
    return jsonError("Product name is required.");
  if (!body?.category || typeof body.category !== "string")
    return jsonError("Category is required.");
  if (!isProductStatus(body.status))
    return jsonError("Invalid status.");

  const name = body.name.trim().slice(0, 200);
  const category = body.category.trim().slice(0, 120);
  const description =
    typeof body.description === "string"
      ? body.description.trim().slice(0, 10_000) || null
      : null;

  /* ---------- Images & Dimensions ---------- */
  const images = cleanStringArray(body.images, {
    max: 20,
    maxLen: 500,
  });

  // Colors optional; after cleaning
  const colors = cleanStringArray(body.colors, {
    max: 50,
    maxLen: 120,
  });

  const sizeMods = !!body.sizeMods;

  /* ---------- Prices (nullable) ---------- */
  const priceNGN = numOrNull(body.price?.NGN);
  const priceUSD = numOrNull(body.price?.USD);
  const priceEUR = numOrNull(body.price?.EUR);
  const priceGBP = numOrNull(body.price?.GBP);

  /* ---------- Size Stocks ---------- */
  const rawSizeStocks = cleanSizeStocks(body.sizeStocks);
  const sizeLabels = Object.keys(rawSizeStocks);

  // If publishing, enforce at least one size/variant (basic rule—adjust as needed)
  if (body.status === "Published" && sizeLabels.length === 0) {
    return jsonError("At least one size/stock entry is required to publish.");
  }

  /* ---------- Build Desired Variants ---------- */
  // If no colors present, use a single sentinel "" color dimension.
  const effectiveColors = colors.length ? colors : [""];

  const desiredMap = new Map<
    string,
    { color: string; size: string; stock: number }
  >();

  for (const size of sizeLabels) {
    const stockStr = rawSizeStocks[size];
    const stockNum = safePositiveInt(stockStr);
    if (stockNum === null) continue;
    for (const color of effectiveColors) {
      const record = {
        color,
        size: size.trim(),
        stock: stockNum,
      };
      const key = comboKey(record.color, record.size);
      // Overwrite duplicates deterministically (last wins)
      desiredMap.set(key, record);
    }
  }

  // If publishing and no valid variant rows survive sanitization:
  if (body.status === "Published" && desiredMap.size === 0) {
    return jsonError("No valid variants (size/color + stock) supplied for publish.");
  }

  /* ---------- Perform Transaction ---------- */
  try {
    const updated = await prisma.$transaction(async tx => {
      // Ensure product exists
      const existingProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!existingProduct) {
        throw new Error("NOT_FOUND");
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          name,
          category,
          description,
          images,
          priceNGN,
          priceUSD,
          priceEUR,
          priceGBP,
          sizeMods,
          status: body.status as ProductStatus,
        },
      });

      const existingVariants = await tx.variant.findMany({
        where: { productId },
        select: { id: true, color: true, size: true },
      });

      const existingMap = new Map(
        existingVariants.map(v => [comboKey(v.color, v.size), v])
      );

      // Upsert or update
      for (const desired of desiredMap.values()) {
        const key = comboKey(desired.color, desired.size);
        if (existingMap.has(key)) {
            const ev = existingMap.get(key)!;
            await tx.variant.update({
              where: { id: ev.id },
              data: { stock: desired.stock },
            });
            existingMap.delete(key);
        } else {
          await tx.variant.create({
            data: {
              productId,
              color: desired.color,
              size: desired.size,
              stock: desired.stock,
            },
          });
        }
      }

      // Remove stale variants
      for (const leftover of existingMap.values()) {
        await tx.variant.delete({ where: { id: leftover.id } });
      }

      // Return a lean payload (could expand if UI needs more)
      return tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          images: true,
          priceNGN: true,
          priceUSD: true,
          priceEUR: true,
          priceGBP: true,
          status: true,
          sizeMods: true,
          variants: {
            select: { id: true, color: true, size: true, stock: true },
            orderBy: [{ color: "asc" }, { size: "asc" }],
          },
        },
      });
    });

    if (!updated) {
      return jsonError("Product not found.", 404);
    }

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") {
      return jsonError("Product not found.", 404);
    }
    console.error("Product update error:", {
      message: err?.message,
      stack: err?.stack,
    });
    return jsonError("Update failed", 500);
  }
}
