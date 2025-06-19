
import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, Boxes, Tag, Users, ShoppingCart, BarChart2, Settings, ShieldCheck } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },

  { name: "Products", href: "/admin/products", icon: <Boxes size={20} /> },
  { name: "Categories", href: "/admin/categories", icon: <Tag size={20} /> },

  { name: "Orders", href: "/admin/orders", icon: <ShoppingCart size={20} /> },

  { name: "Customers", href: "/admin/customers", icon: <Users size={20} /> },

{ name: "Admin Users", href: "/admin/admin-users", icon: <ShieldCheck size={20} /> },


  { name: "Analytics", href: "/admin/analytics", icon: <BarChart2 size={20} /> },

  { name: "Store Settings", href: "/admin/settings", icon: <Settings size={20} /> },
]


export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted text-sm">
      {/* Sidebar */}
      <aside className="w-64 bg-brand text-white flex flex-col justify-between fixed h-screen z-40">
        <div>
          <div className="px-6 py-4 font-bold text-xl tracking-wide">Marobi Admin</div>
          <nav className="mt-4 flex flex-col space-y-7 px-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-white hover:text-brand transition"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-4 py-4 border-t border-white/20">
          <Link
            href="/logout"
            className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-white hover:text-brand transition"
          >
            <LogOut size={20} />
            <span>Log out</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 bg-white p-6 overflow-x-hidden">{children}</main>
    </div>
  );
}
