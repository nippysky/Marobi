import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const {
    items,
    customer,
    paymentMethod,
    staffId,
    timestamp,
  }: {
    items: Array<{
      productId: string;
      color: string;
      size: string;
      quantity: number;
    }>;
    customer:
      | { id: string }
      | {
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
        };
    paymentMethod: string;
    staffId: string;
    timestamp: string;
  } = await request.json();

  // 1) Create the Order
  const newOrder = await prisma.order.create({
    data: {
      offline: true,
      staffId,
      paymentMethod,
      createdAt: new Date(timestamp),
      // customer fields
      customerId: "id" in customer ? customer.id : undefined,
      customerFirstName: "id" in customer ? undefined : customer.firstName,
      customerLastName:  "id" in customer ? undefined : customer.lastName,
      customerEmail:     "id" in customer ? undefined : customer.email,
      customerPhone:     "id" in customer ? undefined : customer.phone,
      // create items inline
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          color:      i.color,
          size:       i.size,
          quantity:   i.quantity,
        })),
      },
    },
    include: { items: true },
  });

  // 2) Decrement stock for each variant
  await Promise.all(
    items.map((i) =>
      prisma.productVariant.update({
        where: {
          productId_color_size: {
            productId: i.productId,
            color:      i.color,
            size:       i.size,
          },
        },
        data: {
          stock: { decrement: i.quantity },
        },
      })
    )
  );

  // 3) Record in OfflineSale table
  await prisma.offlineSale.create({
    data: { orderId: newOrder.id },
  });

  return NextResponse.json({ success: true, orderId: newOrder.id });
}
