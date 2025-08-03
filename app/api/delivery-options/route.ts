export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/delivery-options
 * Query params:
 *  - active: "true"|"1" or "false"|"0"
 *  - type: "COURIER" | "PICKUP"
 *  - provider: string
 *  - country: string (will filter by metadata.countries if present)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const activeParam = url.searchParams.get("active");
    const typeParam = url.searchParams.get("type"); // optional: COURIER / PICKUP
    const providerParam = url.searchParams.get("provider"); // optional provider filter
    const countryParam = url.searchParams.get("country");

    const whereClause: any = {};

    if (activeParam !== null) {
      const raw = activeParam.toLowerCase();
      if (["true", "1", "false", "0"].includes(raw)) {
        whereClause.active = ["true", "1"].includes(raw);
      } else {
        return NextResponse.json(
          { error: "Invalid active filter; must be true/false or 1/0" },
          { status: 400 }
        );
      }
    }

    if (typeParam) {
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

    let options = await prisma.deliveryOption.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Filter by country if provided and metadata.countries exists
    if (countryParam) {
      options = options.filter((opt) => {
        if (opt.metadata && typeof opt.metadata === "object") {
          const meta: any = opt.metadata;
          if (Array.isArray(meta.countries)) {
            return meta.countries.includes(countryParam);
          }
        }
        // If metadata has no country restriction, include it
        return true;
      });
    }

    const transformed = options.map((o) => ({
      id: o.id,
      name: o.name,
      provider: o.provider,
      type: o.type,
      baseFee: o.baseFee,
      active: o.active,
      metadata: o.metadata,
    }));

    return NextResponse.json(transformed, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/delivery-options error:", err);
    return NextResponse.json(
      { error: "Failed to fetch delivery options" },
      { status: 500 }
    );
  }
}
