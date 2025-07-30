"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewForm from "./ReviewForm";
import type { Review } from "@/lib/products";
import { TfiCommentsSmiley } from "react-icons/tfi";

interface ReviewSectionProps {
  productId: string;
  user: any;
  reviews: Review[];
}

export default function ReviewSection({
  productId,
  user,
  reviews,
}: ReviewSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* — Reviews List (2/3 width) — */}
      <div className="lg:col-span-2 space-y-6">

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <TfiCommentsSmiley className="w-10 h-10" />
            <p className="text-lg">No reviews yet.</p>
            <p>Be the first to share your thoughts!</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                {/* Author */}
                <span className="font-medium text-gray-800">{r.author}</span>
                {/* Date */}
                <time className="text-xs text-gray-400">
                  {r.createdAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>

              <div className="flex items-center mb-4">
                {/* Star rating */}
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - r.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-300" />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed">{r.content}</p>
            </div>
          ))
        )}
      </div>

      {/* — Review Form / Login Prompt (1/3 width) — */}
      <div className="lg:col-span-1 sticky top-24 self-start">
        {user ? (
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">
              Leave a Review
            </h3>
            <ReviewForm productId={productId} />
          </div>
        ) : (
          <div className="flex justify-center">
            <Link href="/auth/login">
              <Button>Login to Leave a Review</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
