"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import ProductCard from "@/components/shared/product-card";
import type { Product } from "@/lib/products";

function useDebounce<T>(value: T, delay = 300): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setD(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return d;
}

type Pos = { top: number; left: number; width: number };
type AnchorRefLike = { current: HTMLElement | null };

export default function SearchDesktopPopover({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: AnchorRefLike;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query.trim(), 300);
  const [pos, setPos] = useState<Pos | null>(null);

  // Measure & position
  const updatePos = () => {
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const margin = 12;
    const vw = window.innerWidth;
    const maxW = Math.min(680, vw - margin * 2);
    const minW = Math.min(480, maxW);
    const width = Math.max(minW, Math.min(maxW, r.width * 2.2));
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, vw - width - margin));
    const top = r.bottom + 8;
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClickAway = (e: MouseEvent | TouchEvent) => {
      const p = popRef.current;
      const a = anchorRef.current;
      const t = e.target as Node | null;
      if (!p || !a || !t) return;
      if (!p.contains(t) && !a.contains(t)) onClose();
    };
    const onReflow = () => updatePos();

    window.addEventListener("keydown", onEsc);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("touchstart", onClickAway, { passive: true });

    return () => {
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("touchstart", onClickAway);
    };
  }, [open, onClose, anchorRef]);

  // Fetch like the modal
  const { data: products = [], isFetching, isError } = useQuery<Product[], Error>({
    queryKey: ["desktop-popover-search", debounced.toLowerCase()],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/search?query=${encodeURIComponent(debounced)}`, { signal });
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as Product[];
    },
    enabled: open && debounced.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  if (!open || typeof document === "undefined" || !pos) return null;

  return createPortal(
    <Card
      ref={popRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
      }}
      className="z-[95] p-3 sm:p-4 bg-white shadow-2xl rounded-2xl"
    >
      <div className="relative mb-3">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search for items, categories..."
          className="w-full rounded-full py-3 pl-4 pr-10 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        )}
      </div>

      <div className="max-h-[70vh] overflow-auto pr-1">
        {debounced === "" ? (
          <div className="py-8 text-center text-gray-500">
            Start typing to discover products…
          </div>
        ) : isFetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-[160px] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-red-600">
            Something went wrong. Please try again.
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} onClick={onClose} className="block">
                <ProductCard product={p} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>,
    document.body
  );
}
