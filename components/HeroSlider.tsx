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

  const goTo = (n: number) => setCurrent(((n % slides.length) + slides.length) % slides.length);
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
        className="relative w-full h-[24rem] sm:h-[30rem] md:h-[36rem] lg:h-[46rem] xl:h-[52rem] overflow-hidden"
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
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg max-w-2xl">
                  {s.heading}
                </h1>
                {s.subtext && (
                  <p className="mt-4 text-lg md:text-xl text-white/95 drop-shadow-md max-w-xl">
                    {s.subtext}
                  </p>
                )}
                {s.buttonText && s.buttonHref && (
                  <Link
                    href={s.buttonHref}
                    className="mt-6 inline-block bg-brand hover:bg-brand/90 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 text-base"
                  >
                    {s.buttonText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Control rail — bottom-left */}
        <div className="absolute left-6 sm:left-10 bottom-6 z-20 flex items-center gap-3">
          <button
            aria-label="Previous"
            onClick={() => {
              if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
              prev();
            }}
            className="h-8 w-8 rounded-full bg-white/70 hover:bg-white transition flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4 text-gray-900" />
          </button>

          <div className="flex items-center gap-2">
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
                    "h-1.5 rounded-full transition-all duration-400",
                    active ? "w-8 bg-white" : "w-3 bg-white/50 hover:bg-white/70",
                  ].join(" ")}
                />
              );
            })}
          </div>

          <button
            aria-label="Next"
            onClick={() => {
              if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
              next();
            }}
            className="h-8 w-8 rounded-full bg-white/70 hover:bg-white transition flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4 text-gray-900" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
