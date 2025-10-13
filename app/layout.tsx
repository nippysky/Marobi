// app/layout.tsx (or app/layout.jsx)
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster as HotToaster } from "react-hot-toast";
import React from "react";
import { CurrencyProvider } from "@/lib/context/currencyContext";
import { SizeChartProvider } from "@/lib/context/sizeChartcontext";
import NextAuthSessionProvider from "@/components/shared/SessionProvider";
import { UserProvider } from "@/lib/context/UserContext";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import ScrollToTop from "@/components/ScroolToTop";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marobionline.com"),
  title: {
    default: "Marobi – Curated Women's Fashion",
    template: "%s | Female-Only Fashion Store",
  },
  robots: { index: true, follow: true },
  // You already add a <link rel="manifest"> below, so you can remove this if you like:
  // manifest: "https://marobionline.com/site.webmanifest",
  description:
    "Marobi is a female-only fashion e-commerce boutique offering the latest curated styles, accessories, and must-have pieces for women everywhere. Discover your next favorite look.",
  keywords: [
    "Marobi",
    "Women's Fashion",
    "Female-Only Boutique",
    "E-commerce",
    "Style",
    "Accessories",
  ],
  twitter: {
    card: "summary_large_image",
    title: "Marobi",
    creator: "@MarobiOfficial",
    description:
      "Discover Marobi: a female-only fashion boutique with curated styles and accessories just for women.",
    images: ["/opengraph-image.png"],
  },
  openGraph: {
    title: "Marobi",
    description:
      "Marobi is a female-only fashion boutique offering the latest curated styles and accessories for women.",
    url: "https://marobionline.com",
    siteName: "Marobi",
    images: ["/opengraph-image.png"],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${montserrat.className} antialiased w-full max-w-[1920px] mx-auto`}>
        <NextAuthSessionProvider>
          <ReactQueryProvider>
            <UserProvider>
              <CurrencyProvider>
                  <SizeChartProvider>
                    {children}
                  </SizeChartProvider>
              </CurrencyProvider>
            </UserProvider>
          </ReactQueryProvider>
        </NextAuthSessionProvider>

        <HotToaster position="top-right" />
        <ScrollToTop />
      </body>
    </html>
  );
}
