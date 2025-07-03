"use client";
import { useRouter } from "next/navigation";
import ProductForm from "./ProductForm";
import { ProductPayload } from "@/lib/products";

export default function AddProductSection() {
  const router = useRouter();
  async function handleSave(payload: ProductPayload, status: "Draft" | "Published") {
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.push("/admin/product-management");
  }
  return <ProductForm onSave={handleSave} />;
}
