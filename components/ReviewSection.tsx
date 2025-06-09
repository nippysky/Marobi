"use client";

import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ReviewForm from "./ReviewForm";
import { Button } from "@/components/ui/button";
import PaginatedReviews, { Review } from "./PaginatedReview";

interface ReviewSectionProps {
  id: string;
  user: any;
}

// replace this dummy array or fetch from API
const reviews: Review[] = [
  {
    author: "Collins Jr",
    content: "I love the fact that the gown is well fitted.",
  },
  { author: "Adaobi K", content: "This dress made me feel elegant all night!" },
  { author: "Sandra O", content: "Quality and fit are top-notch." },
  { author: "Kim A", content: "Absolutely beautiful craftsmanship!" },
  {
    author: "Collins Jr",
    content: "I love the fact that the gown is well fitted.",
  },
  { author: "Adaobi K", content: "This dress made me feel elegant all night!" },
  { author: "Sandra O", content: "Quality and fit are top-notch." },
  { author: "Kim A", content: "Absolutely beautiful craftsmanship!" },
  {
    author: "Collins Jr",
    content: "I love the fact that the gown is well fitted.",
  },
  { author: "Adaobi K", content: "This dress made me feel elegant all night!" },
  { author: "Sandra O", content: "Quality and fit are top-notch." },
  { author: "Kim A", content: "Absolutely beautiful craftsmanship!" },
  // ... potentially many more
];

export default function ReviewSection({ id, user }: ReviewSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
      {/* Reviews Accordion */}
      <div>
        <Accordion type="single" collapsible defaultValue="reviews">
          <AccordionItem value="reviews">
            <AccordionTrigger className="text-xl font-semibold">
              Reviews ({reviews.length})
            </AccordionTrigger>
            <AccordionContent className="mt-4">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to leave one!
                </p>
              ) : (
                <PaginatedReviews reviews={reviews} pageSize={4} />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Review Form / Login Prompt */}
      <div className="sticky top-24 space-y-4">
        {user ? (
          <>
            <h3 className="text-lg font-semibold">Leave a Review</h3>
            <ReviewForm productId={id} />
          </>
        ) : (
          <Link href="/auth/login">
            <Button>Login to drop your review</Button>
          </Link>
        )}
      </div>
    </section>
  );
}
