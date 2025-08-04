// file: app/api/orders/[id]/route.ts
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";

// Sync with Prisma schema: all valid order statuses
const ALLOWED_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"] as const;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Get the order ID from the URL params
  const { id: orderId } = await context.params;
  // Parse the incoming request JSON for the new status
  const { status } = await req.json();

  // Validate that the status is one of the allowed statuses
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Update the order status and fetch customer info for notification
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Extract recipient details, works for both customer and guestInfo
    let to: string | undefined;
    let name: string | undefined;

    if (updated.customer) {
      to = updated.customer.email;
      name = `${updated.customer.firstName} ${updated.customer.lastName}`.trim();
    } else if (
      updated.guestInfo &&
      typeof updated.guestInfo === "object"
    ) {
      // For guest orders
      const gi = updated.guestInfo as {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
      to = gi.email;
      name = `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim();
    }

    // Attempt to send status update email if possible (best effort)
    if (to && name) {
      try {
        await sendStatusEmail({
          to,
          name,
          orderId,
          status,
        });
      } catch (emailErr) {
        console.warn(
          `⚠️ Failed to send status email for order ${orderId}:`,
          emailErr
        );
        // Do not fail the whole request if email sending fails
      }
    }

    // Respond with the updated order object
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return NextResponse.json(
      { error: "Could not update status" },
      { status: 500 }
    );
  }
}
