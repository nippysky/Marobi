import React from "react";
import CustomersTable from "@/components/admin/CustomersTable";
import { generateDummyCustomers } from "@/lib/customers";

export default function Customers() {
  const initialData = React.useMemo(() => generateDummyCustomers(50), []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <CustomersTable initialData={initialData} />
    </div>
  );
}
