import { NextRequest, NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mailer";
import type { AdminOrder } from "@/lib/orders";

// dummy in-memory store; replace with real DB lookup
let _orders: Record<string, AdminOrder> = {};

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { status }: { status: string } =
    await req.json();

  // update in-memory record
  if (_orders[id]) {
    _orders[id].status = status as any;
    // fire off email
    await sendStatusEmail(
      _orders[id].customer.email,
      id,
      status
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Order not found" },
    { status: 404 }
  );
}

// Bootstrap our dummy store when the module first loads
import { generateDummyOrders } from "@/lib/orders";
(() => {
  const arr = generateDummyOrders(50);
  for (const o of arr) _orders[o.id] = o;
})();
