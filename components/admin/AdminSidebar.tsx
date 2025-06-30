"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Boxes,
  Users,
  BarChart2,
  Settings,
  LogOut,
  NotebookPen,
} from "lucide-react";
import { BsBag } from "react-icons/bs";
import { RiAdminLine } from "react-icons/ri";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { name: "Dashboard",           href: "/admin",                  icon: <LayoutDashboard size={20} /> },
  { name: "Log Offline Sale",    href: "/admin/log-sale",         icon: <NotebookPen size={20} /> },
  { name: "Products Management", href: "/admin/product-management", icon: <Boxes size={20} /> },
  { name: "Order Inventory",     href: "/admin/order-inventory",  icon: <BsBag size={20} /> },
  { name: "Customers",           href: "/admin/customers",        icon: <Users size={20} /> },
  { name: "Staff & Admin",       href: "/admin/staff-admins",     icon: <RiAdminLine size={20} /> },
  { name: "Reports & Analytics", href: "/admin/reports",          icon: <BarChart2 size={20} /> },
  { name: "Store Settings",      href: "/admin/settings",         icon: <Settings size={20} /> },
];

export default function AdminSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const linkClasses = (href: string) => {
    const active = pathname === href;
    return [
      "flex items-center space-x-3 px-4 py-2 rounded-md transition",
      active ? "bg-white text-brand" : "hover:bg-white hover:text-brand",
    ].join(" ");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/** Mobile header **/}
      <header className="md:hidden bg-brand text-white flex items-center justify-between px-4 py-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <span className="font-bold text-lg">Marobi Admin</span>
        <div style={{ width: 24 }} />
      </header>

      {/** Desktop sidebar **/}
      <aside className="hidden md:flex flex-col w-80 bg-brand text-white">
        <ScrollArea className="h-full flex flex-col">
          {/* Logo / title */}
          <div className="px-6 py-4 font-bold text-xl tracking-wide">
            Marobi Admin
          </div>
          {/* Nav items, scrollable */}
          <nav className="flex-1 overflow-y-auto px-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClasses(item.href)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          {/* Logout pinned */}
          <div className="px-6 py-4 border-t border-white/20">
            <button
              onClick={() => { router.push("/"); }}
              className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-white hover:text-brand w-full text-left"
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </ScrollArea>
      </aside>

      {/** Main content **/}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>

      {/** Mobile overlay **/}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-80 bg-brand text-white z-40 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="font-bold text-xl">Marobi Admin</span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={24} />
              </button>
            </div>
            <ScrollArea className="px-6 flex-1">
              <nav className="space-y-4 py-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClasses(item.href)}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </ScrollArea>
            <div className="px-6 py-4 border-t border-white/20">
              <button
                onClick={() => { router.push("/"); }}
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-white hover:text-brand w-full text-left"
              >
                <LogOut size={20} />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
