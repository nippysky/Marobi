import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendReceiptEmailWithRetry } from "@/lib/mail";

/** Exponential backoff in seconds (capped at 1h) */
function computeBackoffSeconds(attempts: number) {
  const base = 60;
  const max = 3600;
  const val = base * Math.pow(2, attempts - 1);
  return Math.min(val, max);
}

export async function POST(req: NextRequest) {
  try {
    const now = new Date();

    const pending = await prisma.receiptEmailStatus.findMany({
      where: {
        sent: false,
        OR: [{ nextRetryAt: { lte: now } }, { nextRetryAt: null }],
      },
      include: {
        order: {
          include: {
            items: true,
            customer: true,
          },
        },
      },
    });

    let processed = 0;

    for (const status of pending) {
      const order = status.order;
      if (!order) continue;

      // Build recipient object (prefer fresh info from guestInfo or customer)
      let recipient: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        deliveryAddress?: string;
        billingAddress?: string;
      } | null = null;

      if (order.customer) {
        recipient = {
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          email: order.customer.email,
          deliveryAddress: (order.customer as any).deliveryAddress ?? undefined,
          billingAddress: (order.customer as any).billingAddress ?? undefined,
          phone: (order.customer as any).phone ?? undefined,
        };
      } else if (order.guestInfo) {
        const guest = order.guestInfo as any;
        recipient = {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          deliveryAddress: guest.deliveryAddress,
          billingAddress: guest.billingAddress,
        };
      }

      if (!recipient) continue;

      const currency = order.currency;
      const deliveryFee = status.deliveryFee ?? 0; // use persisted real fee

      try {
        await sendReceiptEmailWithRetry({
          order,
          recipient,
          currency,
          deliveryFee,
        });

        // mark success (the helper already upserts, but ensure state here as well)
        await prisma.receiptEmailStatus.update({
          where: { orderId: order.id },
          data: {
            sent: true,
            lastError: null,
            nextRetryAt: null,
          },
        });
      } catch (err: any) {
        const errMsg = (err?.message || String(err)).slice(0, 1000);
        const newAttempts = status.attempts + 1;
        const backoffSec = computeBackoffSeconds(newAttempts);
        const nextRetry = new Date(Date.now() + backoffSec * 1000);

        await prisma.receiptEmailStatus.update({
          where: { orderId: order.id },
          data: {
            attempts: newAttempts,
            lastError: errMsg,
            nextRetryAt: nextRetry,
          },
        });

        console.warn(
          `Retry email failed for order ${order.id}, scheduling next at ${nextRetry.toISOString()}`,
          err
        );
      }

      processed += 1;
    }

    return NextResponse.json({ processed }, { status: 200 });
  } catch (err) {
    console.error("Retry email endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to process retries" },
      { status: 500 }
    );
  }
}
