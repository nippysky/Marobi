"use client";

import { useRouter } from "next/navigation";
import ProductForm from "./ProductForm";
import { ProductPayload } from "@/types/product";
import toast from "react-hot-toast";

export default function AddProductSection() {
  const router = useRouter();

  async function handleSave(payload: ProductPayload) {
    // This onSave is now only called when the form is valid.
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Create failed");
    }
    // otherwise success
    return;
  }

  return (
    <ProductForm
      onSave={async (payload) => {
        const toastId = toast.loading("Saving product…");
        try {
          await handleSave(payload);
          toast.success("Product created", { id: toastId });
          router.push("/admin/product-management");
        } catch (e: any) {
          toast.error(e.message || "Error creating product", { id: toastId });
        }
      }}
    />
  );
}
