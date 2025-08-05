"use client";

import { SessionProvider } from "next-auth/react";
import React, { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";

interface Props {
  children: ReactNode;
}

/**
 * Automatically picks the correct NextAuth basePath:
 * - Admin area uses /admin-auth
 * - Everything else (customer) uses the default /api/auth
 */
export default function NextAuthSessionProvider({ children }: Props) {
  const pathname = usePathname() || "";
  const basePath = useMemo(() => {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/admin-login") ||
      pathname.startsWith("/admin-auth")
    ) {
      return "/admin-auth";
    }
    return "/api/auth";
  }, [pathname]);

  return (
    <SessionProvider
      basePath={basePath}
      // you can customize other shared props here if needed
    >
      {children}
    </SessionProvider>
  );
}
