import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { country } = await request.json()
    if (!country) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 })
    }

    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    })
    if (!res.ok) {
      console.error("Upstream states API error:", res.status)
      return NextResponse.json({ error: "Failed to fetch states" }, { status: 502 })
    }

    const json = await res.json()  // { data: { name: string; states: { name: string }[] } }
    const states = json.data?.states?.map((s: any) => s.name) ?? []
    return NextResponse.json({ states })
  } catch (err) {
    console.error("States proxy error:", err)
    return NextResponse.json({ error: "Server error fetching states" }, { status: 500 })
  }
}
