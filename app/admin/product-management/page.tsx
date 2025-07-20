export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import AddNewProductButton from "@/components/admin/AddNewProductButton";
import EmptyState from "@/components/admin/EmptyState";
import ProductsTable, { AdminProduct } from "./ProductsTable";



async function getProductsForTable(): Promise<AdminProduct[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      images: true,
      category: true,
      priceNGN: true,
      priceUSD: true,
      priceEUR: true,
      priceGBP: true,
      status: true,
      variants: { select: { stock: true } },
      averageRating: true,
      ratingCount: true,
      createdAt: true,
    },
  });

  return products.map(p => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
    return {
      id: p.id,
      name: p.name,
      image: p.images[0] || "",
      category: p.category as any,
      price: {
        NGN: p.priceNGN ?? 0,
        USD: p.priceUSD ?? 0,
        EUR: p.priceEUR ?? 0,
        GBP: p.priceGBP ?? 0,
      },
      stockCount: totalStock,
      stockTotal: totalStock,
      status: p.status,          // enum value Draft | Published | Archived
      averageRating: p.averageRating,
      ratingCount: p.ratingCount,
      createdAt: p.createdAt,
    };
  });
}

export default async function ProductsManagementPage() {
  const products = await getProductsForTable();

  return (
    <div className="py-6 px-3 space-y-8">
      <div className="flex justify-end">
        <AddNewProductButton />
      </div>

      {products.length === 0 ? (
        <EmptyState
          iconName="Package"
          title="No products yet"
          message="Add your first product to start managing pricing and collecting reviews."
          action={<AddNewProductButton />}
        />
      ) : (
        <ProductsTable initialData={products} />
      )}
    </div>
  );
}
