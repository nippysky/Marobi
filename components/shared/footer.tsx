"use client";

import Link from "next/link";
import React from "react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-20 lg:px-20 md:px-10 px-5 bg-brand text-white relative mt-10">
      <section className="w-full flex flex-col lg:flex-row gap-20 justify-between items-start lg:items-center">
        {/* About Marob! + Social Icons */}
        <div className="w-full lg:w-[28%] flex flex-col gap-6">
          <h1 className="text-2xl font-bold mb-2">About Marob!</h1>
          <p className="text-sm">
            Marob! is a growing fashion styling platform dedicated to showcasing
            luxury fashion through the lens of modesty.
          </p>

          {/* Social icons under About */}
          <div className="flex items-center gap-6 text-gray-300 transition duration-300 ease-in-out">
            <Link href="/" aria-label="Instagram" className="hover:text-white">
              <FaInstagram size={20} />
            </Link>
            <Link href="/" aria-label="WhatsApp" className="hover:text-white">
              <FaWhatsapp size={20} />
            </Link>
            <Link href="/" aria-label="TikTok" className="hover:text-white">
              <FaTiktok size={20} />
            </Link>
          </div>
        </div>

        {/* Links & Copyright */}
        <div className="flex flex-col flex-1 gap-5 items-start lg:items-end">
          {/* Foot links */}
          <div className="flex flex-wrap gap-6">
            <Link
              href="/"
              className="hover:underline tracking-widest text-[0.85rem] uppercase transition-all duration-500 ease-linear"
            >
              Home
            </Link>
            <Link
              href="/privacy-policy"
              className="hover:underline tracking-widest text-[0.85rem] uppercase transition-all duration-500 ease-linear"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            &copy; {currentYear} Marob! All rights reserved.
          </p>
        </div>
      </section>
    </footer>
  );
}
