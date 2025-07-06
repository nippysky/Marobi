import AddProductSection from "@/components/admin/AddProductSection";
import BackButton from "@/components/BackButton";

export default function AddProductPage() {
  return (
    <div className="p-6 ">
      <BackButton/>
      <h1 className="text-2xl font-bold my-10">Add New Product</h1>
      <AddProductSection />
    </div>
  );
}
