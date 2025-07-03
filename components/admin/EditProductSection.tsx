"use client";
import { useRouter } from "next/navigation";
import ProductForm from "./ProductForm";
import { ProductPayload } from "@/lib/products";

interface EditSectionProps {
  initialProduct: ProductPayload;
}

export default function EditProductSection({ initialProduct }: EditSectionProps) {
  const router = useRouter();
  async function handleSave(payload: ProductPayload, status: "Draft" | "Published") {
    await fetch(`/api/products/${initialProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.push("/admin/product-management");
  }
  return <ProductForm initialProduct={initialProduct} onSave={handleSave} />;
}
