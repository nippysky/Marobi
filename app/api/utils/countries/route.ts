// app/api/countries/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

type CountriesNowItem = { country: string };
type RestCountry = { name: string; alpha2Code?: string; callingCodes?: string[] };

function normName(n: string): string {
  return n
    .toLowerCase()
    .replace(/\(.*?\)/g, "")            // drop parenthetical notes
    .replace(/,.*$/, "")                // drop trailing qualifiers after comma
    .replace(/\b(the|and|of|republic|federal|state|states|democratic|people's)\b/g, "")
    .replace(/[^a-z]/g, "")
    .trim();
}

export async function GET() {
  try {
    // Add a defensive timeout so the route never hangs
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);

    // fetch both sources in parallel (cache for a day on the edge)
    const [cnRes, rcRes] = await Promise.all([
      fetch("https://countriesnow.space/api/v0.1/countries", {
        next: { revalidate: 60 * 60 * 24 },
        signal: controller.signal,
      }),
      fetch("https://restcountries.com/v2/all?fields=name,alpha2Code,callingCodes", {
        next: { revalidate: 60 * 60 * 24 },
        signal: controller.signal,
      }),
    ]).finally(() => clearTimeout(t));

    if (!cnRes.ok || !rcRes.ok) {
      console.error("Upstream country API error:", cnRes.status, rcRes.status);
      return NextResponse.json(
        { error: "Failed to fetch country data" },
        { status: 502 }
      );
    }

    const cnJson = (await cnRes.json()) as { data?: CountriesNowItem[] };
    const rcJson = (await rcRes.json()) as RestCountry[];

    const list1 = Array.isArray(cnJson?.data) ? cnJson.data : [];
    const list2 = Array.isArray(rcJson) ? rcJson : [];

    // Build lookups for exact and fuzzy name matches
    const byName = new Map<string, RestCountry>();
    const byNorm = new Map<string, RestCountry>();
    for (const r of list2) {
      if (!r?.name) continue;
      byName.set(r.name, r);
      byNorm.set(normName(r.name), r);
    }

    // Merge into the desired shape
    const merged = list1.map((c) => {
      const name = c?.country ?? "";
      const direct = byName.get(name);
      const fuzzy = byNorm.get(normName(name));
      const picked = direct ?? fuzzy;

      return {
        name,
        iso2: picked?.alpha2Code ?? "",
        callingCodes: picked?.callingCodes ?? [],
      };
    });

    return NextResponse.json(merged, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (err: any) {
    console.error("Country proxy error:", err);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json(
      { error: "Server error fetching countries" },
      { status }
    );
  }
}
