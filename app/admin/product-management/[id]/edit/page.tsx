import BackButton from "@/components/BackButton";
import EditProductSection from "./EditProductSection";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductPayload } from "@/types/product";

const CONVENTIONAL_SIZES = ["S","M","L","XL","XXL","XXXL"];

async function loadProductPayload(id: string): Promise<ProductPayload | null> {
  const product = await prisma.product.findUnique({
    where: { id },
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
  if (!product) return null;

  // Derive colors
  const distinctColors = Array.from(
    new Set(
      product.variants
        .map(v => v.color.trim())
        .filter(c => c.length > 0)
    )
  );

  // Derive sizeStocks (take first variant of each size)
  const sizeStocks: Record<string, string> = {};
  for (const v of product.variants) {
    if (!(v.size in sizeStocks)) {
      sizeStocks[v.size] = v.stock.toString();
    }
  }

  // Derive customSizes (those not in conventional)
  const customSizes = Object.keys(sizeStocks).filter(
    sz => !CONVENTIONAL_SIZES.includes(sz)
  );

  const payload: ProductPayload = {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description ?? "",
    images: product.images ?? [],
    price: {
      NGN: product.priceNGN ?? "",
      USD: product.priceUSD ?? "",
      EUR: product.priceEUR ?? "",
      GBP: product.priceGBP ?? "",
    },
    status: product.status,
    sizeMods: product.sizeMods,
    colors: distinctColors,        // [] means no color dimension
    sizeStocks,
    customSizes,
  };

  return payload;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await loadProductPayload(id);
  if (!product) return notFound();

  return (
    <div className="p-6">
      <BackButton />
      <h1 className="text-2xl font-bold my-10">Edit Product</h1>
      <EditProductSection initialProduct={product} />
    </div>
  );
}
