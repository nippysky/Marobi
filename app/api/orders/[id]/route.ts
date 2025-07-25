import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendGenericEmail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params;
  const { status } = await req.json();

  // 1) Validate status
  if (!["Processing", "Shipped", "Delivered"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // 2) Update the order and include the customer relation
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // 3) Figure out who to notify
    let to: string | undefined;
    let name: string | undefined;

    if (updated.customer) {
      // Registered customer
      to = updated.customer.email;
      name = `${updated.customer.firstName} ${updated.customer.lastName}`.trim();
    } else if (
      updated.guestInfo &&
      typeof updated.guestInfo === "object"
    ) {
      // One‑off guest
      const gi = updated.guestInfo as {
        firstName: string;
        lastName: string;
        email: string;
      };
      to = gi.email;
      name = `${gi.firstName} ${gi.lastName}`.trim();
    }

    // 4) Send notification if email is present
    if (to) {
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      try {
        await sendGenericEmail({
          to,
          subject: `Your order ${orderId} is now ${status}`,
          title: `Order ${orderId} — ${status}`,
          intro: `Hi ${name},`,
          bodyHtml: `<p>Your order <strong>${orderId}</strong> status has been updated to <strong>${status}</strong>.</p>`,
          // <-- point users to their account page instead of a direct order link
          button: {
            label: "View Your Orders",
            url: `${baseUrl}/account`,
          },
          preheader: `Your order is now ${status}`,
          footerNote: "Questions? Just reply to this email and we’ll help.",
        });
      } catch (emailErr) {
        console.error("⚠️ Failed to send status email:", emailErr);
      }
    }

    // 5) Return the updated order
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return NextResponse.json(
      { error: "Could not update status" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // 1) Remove dependent OrderItems
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    // 2) Remove any OfflineSale record
    await prisma.offlineSale.deleteMany({ where: { orderId: id } });
    // 3) Delete the Order itself
    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting order:", err);
    // If foreign‑key violation or not found
    return NextResponse.json(
      { error: err.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}