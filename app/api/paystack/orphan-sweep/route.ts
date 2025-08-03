import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTransaction, refundTransaction } from "@/lib/paystack";

export const runtime = "nodejs"; // fixed: Next.js 15 expects "nodejs" not "node"

// Configuration
const RECONCILE_SECRET = process.env.RECONCILE_SECRET || "";
const AUTO_REFUND_ORPHANS = process.env.AUTO_REFUND_ORPHANS === "true";

/**
 * Guard: requires shared secret header. If secret is not configured, endpoint is disabled.
 */
function requireAuth(req: NextRequest) {
  const header = req.headers.get("x-reconcile-secret") || "";
  return RECONCILE_SECRET && header === RECONCILE_SECRET;
}

export async function POST(req: NextRequest) {
  if (!RECONCILE_SECRET) {
    console.error("Orphan sweep: reconcile secret not configured.");
    return NextResponse.json(
      { error: "Reconcile secret not configured" },
      { status: 500 }
    );
  }

  if (!requireAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Sweep orphans older than 10 minutes to avoid racing with in-flight order creation
  const minAgeMinutes = 10;
  const cutoff = new Date(now.getTime() - minAgeMinutes * 60 * 1000);

  const orphans = await prisma.orphanPayment.findMany({
    where: {
      reconciled: false,
      firstSeenAt: { lt: cutoff },
    },
  });

  const summary: {
    checked: number;
    alreadyResolved: number;
    autoRefunded: number;
    flagged: number;
    skippedAlreadyAutoRefunded: number;
    amountMismatches: number;
    errors: string[];
  } = {
    checked: orphans.length,
    alreadyResolved: 0,
    autoRefunded: 0,
    flagged: 0,
    skippedAlreadyAutoRefunded: 0,
    amountMismatches: 0,
    errors: [],
  };

  for (const orphan of orphans) {
    try {
      // Skip if already auto-refunded earlier
      if (orphan.resolutionNote?.includes("Auto-refunded")) {
        summary.skippedAlreadyAutoRefunded += 1;
        continue;
      }

      // Verify transaction with Paystack
      let tx;
      try {
        tx = await verifyTransaction(orphan.reference);
      } catch (verificationErr: any) {
        summary.errors.push(
          `Verification failed for ${orphan.reference}: ${verificationErr.message}`
        );
        continue;
      }

      // If order appeared in the meantime, reconcile
      const existingOrder = await prisma.order.findUnique({
        where: { paymentReference: orphan.reference },
      });

      if (existingOrder) {
        await prisma.orphanPayment.update({
          where: { reference: orphan.reference },
          data: {
            reconciled: true,
            reconciledAt: new Date(),
            resolutionNote: "Order appeared during sweep; reconciled",
            payload: tx as any,
          },
        });
        summary.alreadyResolved += 1;
        continue;
      }

      // Sanity: amount mismatch between stored orphan and actual transaction
      if (orphan.amount !== tx.amount) {
        summary.amountMismatches += 1;
        await prisma.orphanPayment.update({
          where: { reference: orphan.reference },
          data: {
            resolutionNote: `Amount mismatch: orphan recorded ${orphan.amount}, actual ${tx.amount}; flagged for review`,
            payload: tx as any,
          },
        });
        continue;
      }

      // No order exists: decide action based on config
      if (AUTO_REFUND_ORPHANS) {
        try {
          const refund = await refundTransaction({
            transaction: tx.id,
            reason: "Auto-refund orphan payment during sweep (no matching order)",
          });

          const resolutionNote = `Auto-refunded orphan payment during sweep; refund id=${refund.id}`;

          await prisma.orphanPayment.update({
            where: { reference: orphan.reference },
            data: {
              reconciled: true,
              reconciledAt: new Date(),
              resolutionNote,
              payload: tx as any,
            },
          });
          summary.autoRefunded += 1;
        } catch (refundErr: any) {
          summary.errors.push(
            `Refund failed for ${orphan.reference}: ${refundErr.message}`
          );
        }
      } else {
        await prisma.orphanPayment.update({
          where: { reference: orphan.reference },
          data: {
            resolutionNote:
              "Verified payment, no order exists; flagged for manual reconciliation",
            payload: tx as any,
          },
        });
        summary.flagged += 1;
      }
    } catch (e: any) {
      summary.errors.push(
        `Unhandled error for ${orphan.reference}: ${e?.message || String(e)}`
      );
    }
  }

  return NextResponse.json({ summary }, { status: 200 });
}
