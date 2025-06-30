import AdminSidebar from "@/components/admin/AdminSidebar";
import { ReactNode } from "react";


export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminSidebar>{children}</AdminSidebar>;
}
