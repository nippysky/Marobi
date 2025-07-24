export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductTabsClient from "./ProductTabsClient";

/** ----- Server‑side fetch ----- */
async function getProductBasics(id: string) {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      images: true,
      category: true,
      averageRating: true,
      ratingCount: true,
      createdAt: true,
      priceNGN: true,
      priceUSD: true,
      priceEUR: true,
      priceGBP: true,
    },
  });
}

type Params = { id: string };

/** ----- Page (Server Component) ----- */
export default async function ProductViewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  // Next.js 15: params is a promise
  const { id } = await params;
  const product = await getProductBasics(id);
  if (!product) return notFound();

  return (
    <div className="p-6 space-y-6">
      <HeaderSection product={product} />
      {/* hydrate only the tabs on the client */}
      <ProductTabsClient product={product} />
    </div>
  );
}

/** ----------------- Shared Types ----------------- */
interface ProductBasics {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  category: string;
  averageRating: number;
  ratingCount: number;
  createdAt: Date;
  priceNGN: number | null;
  priceUSD: number | null;
  priceEUR: number | null;
  priceGBP: number | null;
}

/** ----------------- Header (Server) ----------------- */
function HeaderSection({ product }: { product: ProductBasics }) {
  const primary = product.images[0] ?? null;
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary}
            alt={product.name}
            className="h-20 w-20 rounded object-cover border"
          />
        ) : (
          <div className="h-20 w-20 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 border">
            NO IMG
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="mt-1 text-sm text-gray-600">
            Category: {product.category} • Created:{" "}
            {new Date(product.createdAt).toLocaleDateString()}
          </div>
          <div className="mt-2">
            <RatingBadge
              average={product.averageRating}
              count={product.ratingCount}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/admin/product-management/${product.id}/edit`}
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm font-medium"
        >
          Edit Product
        </Link>
        <Link
          href="/admin/product-management"
          className="px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium"
        >
          Back to List
        </Link>
      </div>
    </div>
  );
}

/** ----------------- Rating Badge (Server) ----------------- */
function RatingBadge({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  const display = count === 0 ? "—" : average.toFixed(2);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-sm font-medium">
      <span>{display}</span>
      <Stars value={average} count={count} />
      <span className="text-xs text-gray-700">({count})</span>
    </div>
  );
}
function Stars({ value, count }: { value: number; count: number }) {
  if (count === 0)
    return <span className="text-xs text-gray-500">No reviews</span>;

  const filled = Math.round(value);
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${
            i < filled ? "text-yellow-500" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 …" />
        </svg>
      ))}
    </span>
  );
}