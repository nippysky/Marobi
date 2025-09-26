"use client";

import Link from "next/link";
import React from "react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-brand text-white mt-10">
      <div className="mx-auto max-w-[1920px] px-5 md:px-10 lg:px-40 py-8">
        {/* ── Top: About (left) • Socials (right) ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* About */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">About Marob!</h2>
            <p className="text-sm/6 text-white/80 max-w-prose">
              Marob! is a growing fashion styling platform dedicated to
              showcasing luxury fashion through the lens of modesty.
            </p>
          </div>

          {/* Socials on the other side */}
          <div className="md:justify-end flex items-start md:items-center gap-3">
            <Link
              href="/"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-white/15 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition"
            >
              <FaInstagram size={18} />
            </Link>
            <Link
              href="/"
              aria-label="WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-white/15 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition"
            >
              <FaWhatsapp size={18} />
            </Link>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="mt-6 border-t border-white/10" />

        {/* ── Bottom: Copyright (left) • Links (right, same line) ─────────── */}
        <div className="pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-white/70">
            &copy; {currentYear} Marob! All rights reserved.
          </p>

          <nav>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end">
              <li>
                <Link
                  href="/"
                  className="uppercase tracking-widest text-[0.78rem] text-white/85 hover:text-white hover:underline underline-offset-4 transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="uppercase tracking-widest text-[0.78rem] text-white/85 hover:text-white hover:underline underline-offset-4 transition"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
