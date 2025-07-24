"use client";

import { useState } from "react";
import ProductReviewsPanel from "./ProductReviewsPanel";

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

export default function ProductTabsClient({
  product,
}: {
  product: ProductBasics;
}) {
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

function OverviewSection({ product }: { product: ProductBasics }) {
  const gallery = product.images;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* left side */}
      <div className="md:col-span-2 space-y-6">
        {/* basic info */}
        <div className="p-4 border rounded bg-white">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Basic Info
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd>{product.name}</dd>

            <dt className="text-gray-500">Category</dt>
            <dd>{product.category}</dd>

            <dt className="text-gray-500">Prices</dt>
            <dd>
              ₦{product.priceNGN ?? "-"} /
              ${product.priceUSD ?? "-"} /
              €{product.priceEUR ?? "-"} /
              £{product.priceGBP ?? "-"}
            </dd>

            <dt className="text-gray-500">Rating</dt>
            <dd>
              {product.ratingCount
                ? `${product.averageRating.toFixed(2)} (${product.ratingCount})`
                : "No reviews yet"}
            </dd>
          </dl>
        </div>

        {/* description */}
        <div className="p-4 border rounded bg-white">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Description
          </h2>
          {product.description ? (
            <p className="whitespace-pre-line leading-relaxed text-sm text-gray-700">
              {product.description}
            </p>
          ) : (
            <p className="italic text-sm text-gray-400">
              No description added yet.
            </p>
          )}
        </div>

        {/* gallery */}
        <div className="p-4 border rounded bg-white">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Images
          </h2>
          {gallery.length === 0 ? (
            <p className="italic text-sm text-gray-400">
              No images uploaded.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {gallery.map((src, i) => (
                <div
                  key={i}
                  className={`relative aspect-[4/3] overflow-hidden rounded border bg-gray-50 ${
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
                    <span className="absolute top-1 left-1 rounded bg-indigo-600 px-1 py-0.5 text-[10px] text-white">
                      PRIMARY
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* right sidebar */}
      <div className="space-y-6">
        <div className="p-4 border rounded bg-white">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Next Steps
          </h2>
          <ul className="space-y-1 list-disc pl-4 text-sm text-gray-600">
            <li>Switch to Reviews to manage feedback.</li>
            <li>Edit product via “Edit Product” above.</li>
            <li>Add more images or description to increase sales.</li>
          </ul>
        </div>
        <div className="p-4 border rounded bg-white">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Tips
          </h2>
          <ul className="space-y-1 list-disc pl-4 text-sm text-gray-600">
            <li>Use consistent aspect‐ratios for images.</li>
            <li>High‑res photos build trust.</li>
            <li>Prompt customers to leave reviews.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
