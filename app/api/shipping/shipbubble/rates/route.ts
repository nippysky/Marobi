// app/api/shipping/shipbubble/rates/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  AddressValidateBody,
  validateAddressExact,
  fetchRatesExact,
  fetchBoxes,
  pickBoxForWeight,
  type PackageItem,
} from "@/lib/shipping/shipbubble";

// Helpers
function isoDatePlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const ORIGIN_CODE = Number(process.env.SHIPBUBBLE_ORIGIN_ADDRESS_CODE || "0"); // strongly recommended
const CATEGORY_ID = Number(process.env.SHIPBUBBLE_CATEGORY_ID || "90097994");
const DEFAULT_INSTRUCTIONS = "Handle with care";

const mask = (s?: string | null) =>
  s ? `${String(s).slice(0, 12)}…` : "(none)";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // EXPECTED from frontend (minimal & stable):
    // {
    //   destination: { name, email, phone, address },  // single-line address
    //   total_weight_kg: number,
    //   total_value: number,
    //   items?: [{ name, description?, unitWeightKG, unitAmount, quantity }],
    //   pickup_days_from_now?: number
    // }

    const dest = body?.destination as AddressValidateBody;
    const totalWeight = Number(body?.total_weight_kg || 0);
    const totalValue = Number(body?.total_value || 0);
    const pickupDays = Math.min(
      Math.max(Number(body?.pickup_days_from_now ?? 1), 0),
      7
    );

    if (!dest?.address || !dest?.name || !dest?.email || !dest?.phone) {
      return NextResponse.json(
        { error: "destination { name, email, phone, address } are required" },
        { status: 400 }
      );
    }

    if (!totalWeight || totalWeight <= 0) {
      return NextResponse.json(
        { error: "total_weight_kg must be > 0" },
        { status: 400 }
      );
    }

    // Validate receiver to get address_code
    const validated = await validateAddressExact(dest);
    const receiverCode = validated.address_code;

    // Origin (we expect a static address_code via env). If missing, you can derive it with a once-off validation flow.
    if (!ORIGIN_CODE) {
      return NextResponse.json(
        { error: "SHIPBUBBLE_ORIGIN_ADDRESS_CODE env required" },
        { status: 500 }
      );
    }

    // Pull Shipbubble's official box catalog and pick the smallest that fits the weight.
    // If none fits, we omit package_dimension (couriers will quote from weight alone).
    const boxes = await fetchBoxes().catch(() => [] as any[]);
    const chosen = pickBoxForWeight(totalWeight, boxes || []);

    // Build package_items EXACTLY as Shipbubble expects.
    const itemsFromClient = Array.isArray(body?.items) ? body.items : [];
    let package_items: PackageItem[];

    if (itemsFromClient.length) {
      package_items = itemsFromClient.map((it: any) => ({
        name: String(it?.name ?? "Item"),
        description: String(it?.description ?? "Cart item"),
        unit_weight:
          Number(it?.unitWeightKG ?? it?.unit_weight ?? 0.5) || 0.5, // KG
        unit_amount: Number(it?.unitAmount ?? it?.unit_amount ?? 0), // numeric
        quantity: Number(it?.quantity ?? 1) || 1,
      }));
    } else {
      // Conservative fallback: a single consolidated item.
      package_items = [
        {
          name: "Cart items",
          description: "Consolidated package",
          unit_weight: Math.max(totalWeight, 0.1),
          unit_amount: Math.max(totalValue, 0),
          quantity: 1,
        },
      ];
    }

    const fetchBody = {
      sender_address_code: ORIGIN_CODE,
      reciever_address_code: receiverCode, // spelling per API
      pickup_date: isoDatePlus(pickupDays),
      category_id: CATEGORY_ID,
      package_items,
      ...(chosen
        ? {
            package_dimension: {
              length: Number(chosen.length),
              width: Number(chosen.width),
              height: Number(chosen.height),
            },
          }
        : {}),
      delivery_instructions: DEFAULT_INSTRUCTIONS,
    };

    const raw = await fetchRatesExact(fetchBody);
    const token = raw?.request_token || null;

    console.log("[Shipbubble][Rates] token:", mask(token), "couriers:", (raw?.couriers || []).length);

    // Normalize for frontend consumption (keep Shipbubble token).
    const rates =
      (raw?.couriers || []).map((c) => ({
        courierName: c.courier_name,
        courierCode: c.courier_id,
        courierId: c.courier_id,
        serviceCode: c.service_code,
        fee: Number(c.total || 0),
        currency: c.currency || "NGN",
        eta: c.delivery_eta || c.pickup_eta || "",
        raw: c,
        // stamp the token on each rate too so the UI can grab it safely
        request_token: token,
        requestToken: token,
      })) ?? [];

    return NextResponse.json(
      {
        rates,
        // expose both snake_case and camelCase so hooks stay happy
        request_token: token,
        requestToken: token,
        box_used: chosen
          ? {
              name: chosen.name,
              length: chosen.length,
              width: chosen.width,
              height: chosen.height,
              max_weight: chosen.max_weight,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Shipbubble rates error:", err);
    return NextResponse.json(
      { error: err?.message || "Shipbubble rates failed" },
      { status: 502 }
    );
  }
}
