import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/db";   // your lib/db.ts must `export default new PrismaClient()`

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

  // 1) Enrich each line item
  const detailedItems = await Promise.all(
    items.map(async (i) => {
      const variant = await prisma.variant.findUniqueOrThrow({
        where: {
          product_color_size: {
            productId: i.productId,
            color: i.color,
            size: i.size,
          },
        },
        include: { product: true },
      });
      const unitPrice = variant.product.priceNGN ?? 0;
      const lineTotal = unitPrice * i.quantity;
      return {
        productId: variant.productId,
        name:      variant.product.name,
        image:     variant.product.image,
        category:  variant.product.category,
        currency:  "NGN" as const,
        lineTotal,
        color:     variant.color,
        size:      variant.size,
        quantity:  i.quantity,
      };
    })
  );

  // 2) Compute order totals
  const totalNGN    = detailedItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const totalAmount = totalNGN;
  const currency    = "NGN";

  // 3) Resolve a customerId (either existing or newly created)
  let customerIdToUse: string;
  if ("id" in customer) {
    customerIdToUse = customer.id;
  } else {
    const newCust = await prisma.customer.create({
      data: {
        firstName: customer.firstName,
        lastName:  customer.lastName,
        email:     customer.email,
        phone:     customer.phone,
        address:   "",           // guest address blank
      }
    });
    customerIdToUse = newCust.id;
  }

  // 4) Create the order (unchecked)
  const newOrder = await prisma.order.create({
    data: {
      staffId,
      paymentMethod,
      currency,
      totalAmount,
      totalNGN,
      createdAt:  new Date(timestamp),
      customerId: customerIdToUse,
      items: {
        create: detailedItems
      }
    },
    include: { items: true },
  });

  // 5) Decrement stock
  await Promise.all(
    detailedItems.map((li) =>
      prisma.variant.update({
        where: {
          product_color_size: {
            productId: li.productId,
            color:     li.color,
            size:      li.size,
          }
        },
        data: { stock: { decrement: li.quantity } }
      })
    )
  );

  // 6) Log the offline‐sale record
  await prisma.offlineSale.create({
    data: {
      orderId: newOrder.id,
      staffId,
    }
  });

  return NextResponse.json({ success: true, orderId: newOrder.id });
}
