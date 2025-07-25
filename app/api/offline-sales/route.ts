import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Currency } from "@/lib/generated/prisma-client";

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "M-ORD" + Array.from({ length: 7 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer, paymentMethod, currency, staffId, timestamp } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // 1) Ensure staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 400 });
    }

    // 2) Decide: existing customer vs guest
    let customerId: string | null = null;
    let guestInfo: Record<string, string> | undefined;

    if (customer.id) {
      // link to a real registered customer
      const existing = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      customerId = existing.id;
    } else {
      // one‐off guest – do NOT persist in Customer table
      guestInfo = {
        firstName: customer.firstName,
        lastName:  customer.lastName,
        email:     customer.email,
        phone:     customer.phone,
        address:   customer.address,
        country:   customer.country,
        state:     customer.state,
      };
    }

    // 3) Validate stock & build line items
    let totalAmount = 0;
    let totalNGN    = 0;
    const orderItemsData: {
      name: string;
      image: string | null;
      category: string;
      quantity: number;
      currency: Currency;
      lineTotal: number;
      color: string;
      size: string;
    }[] = [];

    for (const i of items) {
      const where: any = { productId: i.productId };
      if (i.color !== "N/A") where.color = i.color;
      if (i.size  !== "N/A") where.size  = i.size;

      const variant = await prisma.variant.findFirst({
        where,
        include: { product: true },
      });
      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found: ${i.productId} ${i.color}/${i.size}` },
          { status: 400 }
        );
      }
      if (variant.stock < i.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${variant.product.name}` },
          { status: 400 }
        );
      }

      // Deduct stock
      await prisma.variant.update({
        where: { id: variant.id },
        data: { stock: { decrement: i.quantity } },
      });

      // Pick correct price field
      let unitPrice = 0;
      switch (currency as Currency) {
        case Currency.USD:
          unitPrice = variant.product.priceUSD ?? 0;
          break;
        case Currency.EUR:
          unitPrice = variant.product.priceEUR ?? 0;
          break;
        case Currency.GBP:
          unitPrice = variant.product.priceGBP ?? 0;
          break;
        case Currency.NGN:
        default:
          unitPrice = variant.product.priceNGN ?? 0;
          break;
      }

      const lineTotal = unitPrice * i.quantity;
      totalAmount += lineTotal;
      if (currency === Currency.NGN) {
        totalNGN += Math.round(lineTotal);
      }

      orderItemsData.push({
        name:      variant.product.name,
        image:     variant.product.images[0] || null,
        category:  variant.product.category,
        quantity:  i.quantity,
        currency:  currency as Currency,
        lineTotal,
        color:     variant.color,
        size:      variant.size,
      });
    }

    // 4) Create the Order, embedding guestInfo if needed
    const newOrderId = generateOrderId();
    const order = await prisma.order.create({
      data: {
        id:           newOrderId,
        status:       "Processing",
        currency:     currency as Currency,
        totalAmount,
        totalNGN,
        paymentMethod,
        createdAt:    timestamp ? new Date(timestamp) : new Date(),
        customerId,           // null for guests
        staffId,
        items:        { create: orderItemsData },
        ...guestInfo && { guestInfo }, // only include for guests
      },
    });

    // 5) Record the OfflineSale
    await prisma.offlineSale.create({
      data: {
        orderId:   order.id,
        staffId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error: any) {
    console.error("Error logging offline sale:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
