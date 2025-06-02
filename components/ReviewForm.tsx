"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  productId: string;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide both a rating and a comment.");
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with real API call to submit the review
      // await fetch(`/api/products/${productId}/reviews`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ rating, comment }),
      // });

      console.log("Submitting review:", { productId, rating, comment });
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6 px-4 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Leave a Review
      </h3>

      <div className="space-y-2">
        <Label htmlFor="rating">Rating</Label>
        <Select
          onValueChange={(value) => setRating(Number(value))}
          value={rating > 0 ? String(rating) : ""}
          disabled={submitting}
        >
          <SelectTrigger id="rating" className="w-full">
            <SelectValue placeholder="Select rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 – Poor</SelectItem>
            <SelectItem value="2">2 – Fair</SelectItem>
            <SelectItem value="3">3 – Good</SelectItem>
            <SelectItem value="4">4 – Very Good</SelectItem>
            <SelectItem value="5">5 – Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your thoughts about this product…"
          disabled={submitting}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
