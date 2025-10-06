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
  intervalMs?: number;
}

const HeroSlider: React.FC<HeroSliderProps> = ({ slides, intervalMs = 7000 }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const goTo = (n: number) =>
    setCurrent(((n % slides.length) + slides.length) % slides.length);
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(next, intervalMs);
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [current, paused, slides.length, intervalMs]);

  if (!slides.length) return null;

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      <div
        className={
          // Shorter fixed heights across breakpoints
          "relative w-full h-[18rem] sm:h-[22rem] md:h-[26rem] lg:h-[30rem] xl:h-[32rem] overflow-hidden"
        }
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((s, idx) => {
          const active = idx === current;
          return (
            <div
              key={s.id}
              className={[
                "absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out",
                active ? "opacity-100" : "opacity-0",
              ].join(" ")}
              style={{ backgroundImage: `url(${s.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 md:px-12 lg:px-24 text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg max-w-2xl">
                  {s.heading}
                </h1>
                {s.subtext && (
                  <p className="mt-3 text-base md:text-lg text-white/95 drop-shadow-md max-w-xl">
                    {s.subtext}
                  </p>
                )}
                {s.buttonText && s.buttonHref && (
                  <Link
                    href={s.buttonHref}
                    className="mt-5 inline-block bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 text-sm md:text-base"
                  >
                    {s.buttonText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Prev arrow — middle left */}
        <button
          aria-label="Previous"
          onClick={() => {
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
            prev();
          }}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/75 hover:bg-white shadow-md flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <ChevronLeft className="h-5 w-5 text-gray-900" />
        </button>

        {/* Next arrow — middle right */}
        <button
          aria-label="Next"
          onClick={() => {
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
            next();
          }}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/75 hover:bg-white shadow-md flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <ChevronRight className="h-5 w-5 text-gray-900" />
        </button>

        {/* Indicators — bottom center */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-4 z-20 flex items-center justify-center gap-2">
          {slides.map((_, i) => {
            const active = i === current;
            return (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
                  goTo(i);
                }}
                className={[
                  "h-1.5 rounded-full transition-all duration-300",
                  active ? "w-8 bg-white" : "w-3 bg-white/60 hover:bg-white/80",
                ].join(" ")}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
