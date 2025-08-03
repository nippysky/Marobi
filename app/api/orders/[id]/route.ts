import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params;
  const { status } = await req.json();

  if (!["Processing", "Shipped", "Delivered"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Update order and include customer info
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Determine recipient
    let to: string | undefined;
    let name: string | undefined;

    if (updated.customer) {
      to = updated.customer.email;
      name = `${updated.customer.firstName} ${updated.customer.lastName}`.trim();
    } else if (
      updated.guestInfo &&
      typeof updated.guestInfo === "object"
    ) {
      const gi = updated.guestInfo as {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
      to = gi.email;
      name = `${gi.firstName ?? ""} ${gi.lastName ?? ""}`.trim();
    }

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
        // don't fail the whole request
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return NextResponse.json(
      { error: "Could not update status" },
      { status: 500 }
    );
  }
}
