"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AddNewProductButton() {
  return (
    <Link href="/product-management/add-new-product" className="flex items-center">
      <Button>
        <Plus className="h-4 w-4" />
        Add New Product
      </Button>
    </Link>
  );
}
