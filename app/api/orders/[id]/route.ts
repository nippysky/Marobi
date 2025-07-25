import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const { status } = await req.json();

    // Validate
    if (!["Processing", "Shipped", "Delivered"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return NextResponse.json({ error: "Could not update status" }, { status: 500 });
  }
}
