import EditProductSection from "@/components/admin/EditProductSection";
import BackButton from "@/components/BackButton";
import { getProductByItsId, ProductPayload } from "@/lib/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product: ProductPayload = await getProductByItsId(id);

  return (
    <div className="p-6">
      <BackButton/>
      <h1 className="text-2xl font-bold my-10">Edit Product</h1>
      <EditProductSection initialProduct={product} />
    </div>
  );
}
