import StaffsTable from "@/components/admin/StaffsTable";
import { generateDummyStaffs } from "@/lib/staff";


export default function StaffAdminsPage() {
  const dummy = generateDummyStaffs(8);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Staff & Admins</h1>
      <StaffsTable initialData={dummy} />
    </div>
  );
}
