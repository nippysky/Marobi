import AddNewProductButton from "@/components/admin/AddNewProductButton";
import ProductTable from "@/components/admin/ProductTable";
import { generateDummyProducts } from "@/lib/products";


export default function ProductsManagement() {
    const initialData = generateDummyProducts(50);  // runs on server
  return (
    <div className="py-6 px-3">
      <div className="flex justify-end mb-10">
        <AddNewProductButton />
      </div>
      <ProductTable initialData={initialData} />
    </div>
  );
}
