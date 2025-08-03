export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const activeParam = url.searchParams.get("active");
    const typeParam = url.searchParams.get("type"); // optional: COURIER / PICKUP
    const providerParam = url.searchParams.get("provider"); // optional provider filter

    const whereClause: any = {};

    if (activeParam !== null) {
      // Interpret truthy values: "true", "1"
      const active = ["true", "1"].includes(activeParam.toLowerCase());
      whereClause.active = active;
    }

    if (typeParam) {
      // Validate enum-ish
      if (typeParam !== "COURIER" && typeParam !== "PICKUP") {
        return NextResponse.json(
          { error: "Invalid type filter; must be COURIER or PICKUP" },
          { status: 400 }
        );
      }
      whereClause.type = typeParam;
    }

    if (providerParam) {
      whereClause.provider = providerParam;
    }

    const options = await prisma.deliveryOption.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deliveryOptions: options }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/delivery-options error:", err);
    return NextResponse.json(
      { error: "Failed to fetch delivery options" },
      { status: 500 }
    );
  }
}
