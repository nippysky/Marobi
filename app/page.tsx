import HeroSlider from "@/components/HeroSlider";
import ProductShowcase from "@/components/ProductShowcase";
import { Header } from "@/components/shared/header";
import { CATEGORY_SHOWCASE } from "@/lib/constants/app-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <section className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)] lg:px-20 md:px-10 px-5">
      <Header />
      <main className="w-full flex-1">
        <HeroSlider />
        <ProductShowcase categories={CATEGORY_SHOWCASE} />
      </main>
      {/* Footer */}
    </section>
  );
}
