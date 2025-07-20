"use client";

import { useRouter } from "next/navigation";
import ProductForm from "./ProductForm";
import { ProductPayload } from "@/types/product";
import toast from "react-hot-toast";

export default function AddProductSection() {
  const router = useRouter();

  async function handleSave(payload: ProductPayload) {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Create failed");
      }
      toast.success("Product created");
      router.push("/admin/product-management");
    } catch (e: any) {
      toast.error(e.message || "Error creating product");
    }
  }

  return <ProductForm onSave={handleSave} />;
}
