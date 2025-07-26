import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/categories";

export async function GET() {
  const cats = await getAllCategories();
  return NextResponse.json(cats);
}
