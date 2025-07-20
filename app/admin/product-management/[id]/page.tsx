import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

/* ---------------- Server Data Fetch ---------------- */
async function getProductBasics(id: string) {
  // TODO: Add admin auth guard with NextAuth later
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      images: true,        // array of URLs
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

/* ---------------- Page (Server Component) ---------------- */
export default async function ProductViewPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductBasics(params.id);
  if (!product) return notFound();

  return (
    <div className="p-6 space-y-6">
      <HeaderSection product={product} />
      <ProductTabsServerBridge product={product} />
    </div>
  );
}

/* ---------------- Shared Types ---------------- */
interface ProductBasics {
  id: string;
  name: string;
  description: string | null;
  images: string[];          // gallery
  category: string;
  averageRating: number;
  ratingCount: number;
  createdAt: Date;
  priceNGN: number | null;
  priceUSD: number | null;
  priceEUR: number | null;
  priceGBP: number | null;
}

/* ---------------- Header Section (Server Rendered) ---------------- */
function HeaderSection({ product }: { product: ProductBasics }) {
  const primary = product.images[0] || null;
  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
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
          <div className="text-sm text-gray-600 mt-1">
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

/* ---------------- Rating Badge ---------------- */
function RatingBadge({ average, count }: { average: number; count: number }) {
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
  if (count === 0) return <span className="text-xs text-gray-500">No reviews</span>;
  const filled = Math.round(value);
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < filled ? "text-yellow-500" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.457a1 1 0 00-.364 1.118l1.287 3.974c.3.922-.755 1.688-1.54 1.118l-3.382-2.457a1 1 0 00-1.175 0l-3.382 2.457c-.784.57-1.838-.196-1.539-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.997 9.401c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
        </svg>
      ))}
    </span>
  );
}

/* ---------------- Client Boundary Bridge ---------------- */
function ProductTabsServerBridge({ product }: { product: ProductBasics }) {
  // Keep page itself a server component
  return <ProductTabsClient product={product} />;
}

/* =========================================================
   ===============  CLIENT COMPONENTS  =====================
   ========================================================= */
"use client";

import { useState } from "react";
import ProductReviewsPanel from "./ProductReviewsPanel";

function ProductTabsClient({ product }: { product: ProductBasics }) {
  const [tab, setTab] = useState<"overview" | "reviews">("overview");

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <TabButton
          label="Overview"
          active={tab === "overview"}
          onClick={() => setTab("overview")}
        />
        <TabButton
          label="Reviews"
          active={tab === "reviews"}
          onClick={() => setTab("reviews")}
        />
      </div>

      {tab === "overview" && <OverviewSection product={product} />}
      {tab === "reviews" && (
        <div>
          <ProductReviewsPanel productId={product.id} />
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      type="button"
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-gray-900 text-gray-900"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {label}
    </button>
  );
}

/* ---------------- Overview Section ---------------- */
function OverviewSection({ product }: { product: ProductBasics }) {
  const primary = product.images[0] || null;
  const gallery = product.images;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* LEFT (Info + Description + Images) */}
      <div className="md:col-span-2 space-y-6">
        {/* Basic Info */}
        <div className="p-4 border rounded bg-white">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide">
            Basic Info
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd>{product.name}</dd>

            <dt className="text-gray-500">Category</dt>
            <dd>{product.category}</dd>

            <dt className="text-gray-500">Prices</dt>
            <dd>
              ₦{product.priceNGN ?? "-"} / ${product.priceUSD ?? "-"} / €
              {product.priceEUR ?? "-"} / £{product.priceGBP ?? "-"}
            </dd>

            <dt className="text-gray-500">Rating</dt>
            <dd>
              {product.ratingCount
                ? `${product.averageRating.toFixed(2)} (${product.ratingCount})`
                : "No reviews yet"}
            </dd>
          </dl>
        </div>

        {/* Description */}
        <div className="p-4 border rounded bg-white">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide">
            Description
          </h2>
          {product.description ? (
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {product.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No description added yet.
            </p>
          )}
        </div>

        {/* Images Gallery */}
        <div className="p-4 border rounded bg-white">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide">
            Images
          </h2>
          {gallery.length === 0 ? (
            <div className="text-sm text-gray-400 italic">
              No images uploaded.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((src, i) => (
                <div
                  key={i}
                  className={`relative aspect-[4/3] rounded overflow-hidden border bg-gray-50 ${
                    i === 0 ? "ring-2 ring-offset-1 ring-indigo-500" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.name} ${i + 1}`}
                    className="object-cover w-full h-full"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-1 py-0.5 rounded">
                      PRIMARY
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-6">
        <div className="p-4 border rounded bg-white">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide">
            Next Steps
          </h2>
          <ul className="list-disc pl-4 text-sm space-y-1 text-gray-600">
            <li>Switch to the Reviews tab to manage customer feedback.</li>
            <li>Edit product details via the “Edit Product” button above.</li>
            <li>Add more images or a description to improve conversion.</li>
          </ul>
        </div>

        <div className="p-4 border rounded bg-white">
          <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide">
            Tips
          </h2>
          <ul className="list-disc pl-4 text-sm space-y-1 text-gray-600">
            <li>High‑quality images build trust.</li>
            <li>Use consistent image aspect ratios.</li>
            <li>Encourage customers to leave reviews post‑purchase.</li>
          </ul>
        </div>

        {primary && (
          <div className="text-xs text-gray-500">
            Primary image highlighted in gallery (first in `images[]`).
          </div>
        )}
      </div>
    </div>
  );
}
