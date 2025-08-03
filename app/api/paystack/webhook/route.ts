// app/api/paystack/webhook/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Next.js 15+ expects "nodejs"

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  validateWebhookSignature,
  verifyTransaction,
} from "@/lib/paystack";

// Safe JSON parse
function safeParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature") || "";
  const rawBody = await req.text();

  // 1. Validate webhook signature
  if (!validateWebhookSignature(rawBody, signature)) {
    console.warn("Invalid Paystack webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Parse JSON safely
  const body = safeParse(rawBody);
  if (!body) {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const event = body.event;
  const data = body.data;
  if (!data || !data.reference) {
    return NextResponse.json({ error: "Missing reference in webhook payload" }, { status: 400 });
  }

  const eventId = body?.id || `${event}:${data.reference}`;

  // 3. Dedupe: Persist webhook event
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "paystack",
        eventId,
        payload: body,
      },
    });
  } catch (err: any) {
    if (
      err?.code === "P2002" &&
      Array.isArray(err?.meta?.target) &&
      (err.meta.target as string[]).includes("eventId")
    ) {
      return NextResponse.json({ ok: true, message: "Duplicate event ignored" }, { status: 200 });
    }
    console.error("Failed to persist webhook event:", err);
    // continue processing
  }

  // 4. Handle only 'charge.success'
  if (event === "charge.success") {
    try {
      const tx = await verifyTransaction(data.reference); // Throws if invalid

      const existingOrder = await prisma.order.findUnique({
        where: { paymentReference: data.reference },
        include: { customer: true },
      });

      if (!existingOrder) {
        // Orphan payment: no order found
        await prisma.orphanPayment.upsert({
          where: { reference: data.reference },
          create: {
            reference: data.reference,
            amount: tx.amount,
            currency: tx.currency,
            payload: tx as any,
            reconciled: false,
            resolutionNote: "Orphan payment recorded; awaiting manual resolution",
          },
          update: {
            payload: tx as any,
            amount: tx.amount,
            currency: tx.currency,
          },
        });

        return NextResponse.json(
          { ok: true, message: "Orphan payment recorded" },
          { status: 200 }
        );
      }

      // Patch order if needed
      const updates: Record<string, any> = {};
      if (existingOrder.paymentReference !== data.reference) {
        updates.paymentReference = data.reference;
      }
      if (existingOrder.paymentProviderId !== String(tx.id)) {
        updates.paymentProviderId = String(tx.id);
      }
      if (!existingOrder.paymentVerified) {
        updates.paymentVerified = true;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: updates,
        });
      }

      // Mark any orphans as reconciled
      await prisma.orphanPayment.updateMany({
        where: { reference: data.reference },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          resolutionNote: "Payment matched to existing order",
        },
      });

      return NextResponse.json({ ok: true, message: "Processed charge.success" }, { status: 200 });
    } catch (err: any) {
      console.error("Error handling charge.success webhook:", err);
      return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
  }

  // 5. Ignore other events, but acknowledge
  return NextResponse.json({ ok: true, message: "Event ignored" }, { status: 200 });
}
