import { NextRequest, NextResponse } from "next/server";
import { getAllCategories } from "@/lib/categories";

export async function GET(req: NextRequest) {
  try {
    const cats = await getAllCategories();
    return NextResponse.json(cats, {
      status: 200,
      // optional: add caching hints if you want edge/browser caching
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
