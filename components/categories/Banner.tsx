import Link from "next/link";
import React from "react";

interface BannerProps {
  name: string;
}

export default function Banner({ name }: BannerProps) {
  return (
    <div className="w-full h-48 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto h-full flex flex-col justify-center px-5">
        <h1 className="text-4xl font-semibold text-foreground mb-2">{name}</h1>
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <span className="px-2">/</span>
            </li>
            <li>
              <Link href="/categories" className="hover:underline">
                Categories
              </Link>
            </li>
            <li>
              <span className="px-2">/</span>
            </li>
            <li className="font-semibold text-foreground whitespace-nowrap">
              {name}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
}
