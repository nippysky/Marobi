import Link from "next/link";
import React from "react";
import { CATEGORIES } from "@/lib/constants/categories";
import Header from "@/components/shared/header";

export default function CategoriesIndex() {
  return (
    <section className="flex flex-col lg:px-20 md:px-10 px-5">
      <Header />

      <main className="mt-10">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Categories
        </h1>
        <ul className="space-y-4">
          {CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/categories/${cat.slug}`}
                className="text-lg text-blue-600 hover:underline dark:text-blue-300"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </section>
  );
}
