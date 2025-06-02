"use client";

import React from "react";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import Link from "next/link";
import { Button } from "./ui/button";

interface Review {
  author: string;
  content: string;
  // you can extend with rating, date, etc.
}
// ───────────────────────────────────────────────────────────────────
// NEW: Dummy data for “existing” reviews (in a real app, you'd fetch from a DB or API)
// You can replace this with a fetch to your backend when ready.
const reviews: Review[] = [
  {
    author: "Collins Jr",
    content: "I so much love the fact that the gown is well fitted.",
  },
  {
    author: "Adaobi K",
    content: "This dress made me feel elegant all night!",
  },
  {
    author: "Sandra O",
    content: "Quality and fit are top-notch.",
  },
  {
    author: "Kim A",
    content: "Absolutely beautiful craftsmanship!",
  },
];
// ───────────────────────────────────────────────────────────────────

export default function ReviewSection({ id, user }: { id: string; user: any }) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Reviews
      </h2>

      {/* ─── If there are no reviews, show a fallback message ─── */}
      {reviews.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No reviews yet. Be the first to leave one!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {reviews.map((rev, idx) => (
            <ReviewCard key={idx} author={rev.author} content={rev.content} />
          ))}
        </div>
      )}

      {/* ─── Review Form or “Login to Review” Prompt ─── */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        {user ? (
          // If user is logged in, show the client-side ReviewForm:
          <ReviewForm productId={id} />
        ) : (
          // Otherwise, prompt to log in:
          <p className="text-gray-700 dark:text-gray-300">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              <Button>Login to drop your review</Button>
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
