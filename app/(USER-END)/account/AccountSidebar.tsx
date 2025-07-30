"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Heart, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const menu = [
  { label: "Profile", href: "/account", icon: User },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
];

export default function AccountSidebar() {
  const path = usePathname();

  return (
    <nav className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-md space-y-4">
      {menu.map(({ label, href, icon: Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
              ${active
                ? "bg-gradient-to-r from-brand to-green-700 text-white"
                : "text-gray-700 hover:bg-gray-100"}
            `}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
      <Button
        variant="destructive"
        className="mt-6 w-full flex items-center justify-center gap-2"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="w-5 h-5" />
        Logout
      </Button>
    </nav>
  );
}
