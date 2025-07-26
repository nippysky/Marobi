// components/HeroSlider.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface Slide {
  id: string;
  imageUrl: string;
  heading: string;
  subtext?: string;
  buttonText?: string;
  buttonHref?: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const goToNext = () =>
    setCurrentIndex((idx) => (idx + 1) % slides.length);
  const goToPrev = () =>
    setCurrentIndex((idx) => (idx === 0 ? slides.length - 1 : idx - 1));

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(goToNext, 8000);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, slides.length]);

  if (!slides.length) return null;

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      <div className="relative w-full lg:h-[47rem] h-[25rem] overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`
              absolute inset-0 bg-cover bg-center
              transition-opacity duration-1000 ease-in-out
              ${idx === currentIndex ? "opacity-100" : "opacity-0"}
            `}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          >
            {/* dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* content: items-start added here */}
            <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 md:px-12 lg:px-24 text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg max-w-2xl">
                {slide.heading}
              </h1>
              {slide.subtext && (
                <p className="mt-4 text-lg md:text-xl text-white drop-shadow-md max-w-xl">
                  {slide.subtext}
                </p>
              )}

              {slide.buttonText && slide.buttonHref && (
                <Link
                  href={slide.buttonHref}
                  className="
                    mt-6
                    inline-block
                    bg-brand hover:bg-brand/90
                    text-white font-semibold
                    px-8 py-3
                    rounded-full
                    transition-colors duration-200
                    text-base
                  "
                >
                  {slide.buttonText}
                </Link>
              )}
            </div>
          </div>
        ))}

        {/* Prev */}
        <button
          aria-label="Previous slide"
          onClick={() => {
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
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

        {/* Next */}
        <button
          aria-label="Next slide"
          onClick={() => {
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
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
