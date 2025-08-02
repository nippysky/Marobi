"use client";

import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/categories";

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }
  return res.json();
}

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}
