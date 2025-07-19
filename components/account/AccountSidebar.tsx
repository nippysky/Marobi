"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

const menuItems = [
  { label: "Profile Details", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/account/wishlist" },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <nav className="space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-full text-sm transition ${
              pathname === item.href
                ? "bg-gray-200 font-semibold"
                : "hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center space-x-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
