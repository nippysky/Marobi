// /components/ReviewSection.tsx
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
import PaginatedReviews from "./PaginatedReview";
import type { Review } from "@/lib/products";

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
                <p className="text-gray-500">
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
            <ReviewForm productId={productId} />
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
