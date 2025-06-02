
import { NextResponse } from "next/server";

interface CurrencyLayerResponse {
  success: boolean;
  timestamp: number;
  quotes: Record<string, number>;
}

interface CachedRates {
  timestamp: number;
  quotes: Record<string, number>;
}

let cached: CachedRates | null = null;
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Your access key:
const ACCESS_KEY = "9de8824b77490d2f253f2b795cd7d952";

async function fetchFromExchangeHost(): Promise<Record<string, number>> {
  const symbols = ["NGN", "USD", "EUR", "GBP"].join(",");
  const url = `https://api.exchangerate.host/live?access_key=${ACCESS_KEY}&currencies=${symbols}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ExchangeHost status ${res.status}`);
  }
  const data = (await res.json()) as CurrencyLayerResponse;
  if (!data.success) {
    throw new Error("ExchangeHost returned success: false");
  }
  return data.quotes;
}

export async function GET() {
  try {
    const now = Date.now();

    if (!cached || now - cached.timestamp > TTL_MS) {
      const freshQuotes = await fetchFromExchangeHost();
      cached = { timestamp: now, quotes: freshQuotes };
    }

    return NextResponse.json({
      quotes: cached.quotes,
      fetchedAt: cached.timestamp,
    });
  } catch (err) {
    console.error("Error in /api/exchange-rates:", err);
    return NextResponse.json(
      { quotes: {}, fetchedAt: Date.now() },
      { status: 500 }
    );
  }
}
