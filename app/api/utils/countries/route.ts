import { NextResponse } from "next/server"

export async function GET() {
  try {
    // fetch both sources in parallel
    const [cnRes, rcRes] = await Promise.all([
      fetch("https://countriesnow.space/api/v0.1/countries"),
      fetch("https://restcountries.com/v2/all?fields=name,alpha2Code,callingCodes"),
    ])

    if (!cnRes.ok || !rcRes.ok) {
      console.error("Upstream country API error:", cnRes.status, rcRes.status)
      return NextResponse.json({ error: "Failed to fetch country data" }, { status: 502 })
    }

    const cnJson = await cnRes.json()  // { data: [ { country: string, ... } ] }
    const rcJson = await rcRes.json()  // [ { name, alpha2Code, callingCodes }, … ]

    // merge them into your CountryData shape
    const merged = (cnJson.data as any[]).map((c) => {
      const rc = (rcJson as any[]).find((r) => r.name === c.country)
      return {
        name: c.country,
        iso2: rc?.alpha2Code ?? "",
        callingCodes: rc?.callingCodes ?? [],
      }
    })

    return NextResponse.json(merged)
  } catch (err) {
    console.error("Country proxy error:", err)
    return NextResponse.json({ error: "Server error fetching countries" }, { status: 500 })
  }
}
