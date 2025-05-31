"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Slide = {
  backgroundUrl: string;
  heading: string;
  subtext?: string;
  buttonText: string;
  buttonHref: string;
};

const slides: Slide[] = [
  {
    backgroundUrl:
      "https://static.vecteezy.com/system/resources/thumbnails/060/183/196/small_2x/elegant-emerald-green-and-gold-banner-background-vector.jpg",
    heading: "Let Marob! Make You Look Good!",
    subtext: "Discover curated women’s fashion, just for you.",
    buttonText: "Shop with us",
    buttonHref: "/all-products",
  },
  {
    backgroundUrl:
      "https://png.pngtree.com/thumb_back/fw800/background/20240914/pngtree-background-of-large-faceted-green-emeralds-gems-for-jewelry-store-banner-image_16210112.jpg",
    heading: "Style Meets Comfort.",
    subtext: "Feel fabulous in every outfit you wear.",
    buttonText: "Browse Collections",
    buttonHref: "/corporate-wears",
  },
  {
    backgroundUrl:
      "https://img.freepik.com/free-vector/gradient-emerald-background_23-2150328767.jpg?semt=ais_hybrid&w=740",
    heading: "Elevate Your Wardrobe.",
    subtext: "New arrivals every week—stay ahead of trends.",
    buttonText: "View New Arrivals",
    buttonHref: "/african-print",
  },
];

export const HeroSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(goToNext, 10000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex]);

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* The outer wrapper: constrained to max‐width, centered. */}
      <div className="relative w-full lg:h-[45rem] h-[25rem] overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`
              absolute top-0 left-0 w-full h-full
              bg-cover bg-center bg-no-repeat
              transition-opacity duration-1000 ease-in-out
              ${idx === currentIndex ? "opacity-100" : "opacity-0"}
            `}
            style={{ backgroundImage: `url(${slide.backgroundUrl})` }}
          >
            {/* Dark overlay for contrast */}
            <div className="absolute top-0 left-0 w-full h-full bg-black/40" />

            {/* Slide content */}
            <div className="relative z-10 flex flex-col items-start justify-center h-full px-5 md:px-10 lg:px-20">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg max-w-2xl">
                {slide.heading}
              </h1>
              {slide.subtext && (
                <p className="mt-3 text-base md:text-lg text-white drop-shadow-md max-w-xl">
                  {slide.subtext}
                </p>
              )}
              <Link
                passHref
                href={slide.buttonHref}
                className="
                  inline-block
                  mt-5
                  bg-green-500 hover:bg-green-600
                  text-white font-medium
                  px-5 py-2.5 rounded-full
                  transition-colors duration-200
                  text-sm md:text-base
                "
              >
                {slide.buttonText}
              </Link>
            </div>
          </div>
        ))}

        {/* Left arrow */}
        <button
          onClick={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            goToPrev();
          }}
          className="
            absolute top-1/2 left-4 transform -translate-y-1/2
            bg-white/30 hover:bg-white/60
            p-2 rounded-full
            drop-shadow-md
            transition-colors duration-200
            z-20
          "
        >
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            goToNext();
          }}
          className="
            absolute top-1/2 right-4 transform -translate-y-1/2
            bg-white/30 hover:bg-white/60
            p-2 rounded-full
            drop-shadow-md
            transition-colors duration-200
            z-20
          "
        >
          <ChevronRight className="w-6 h-6 text-black" />
        </button>
      </div>
    </div>
  );
};

export default HeroSlider;
