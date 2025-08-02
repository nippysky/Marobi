import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Currency, OrderChannel } from "@/lib/generated/prisma-client";
import { sendReceiptEmailWithRetry } from "@/lib/mail";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/** Generates a branded order ID like "M-ORD-ABCDEFG" */
function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 7 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
  return `M-ORD-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const {
      items,
      customer, // { id?; firstName; lastName; email; phone; deliveryAddress; billingAddress; country; state }
      paymentMethod,
      currency,
      timestamp,
      deliveryFee = 0,
    } = payload;

    // Basic validation
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    if (!customer || !customer.email) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    // Session-aware resolution
    const session = await getServerSession(authOptions);
    let customerId: string | null = null;
    let existingCustomer:
      | { firstName: string; lastName: string; email: string }
      | undefined;
    let guestInfo: Record<string, any> | undefined;

    if (session?.user?.id) {
      const found = await prisma.customer.findUnique({
        where: { id: session.user.id as string },
      });
      if (found) {
        customerId = found.id;
        existingCustomer = {
          firstName: found.firstName,
          lastName: found.lastName,
          email: found.email,
        };
      } else {
        guestInfo = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          deliveryAddress: customer.deliveryAddress,
          billingAddress: customer.billingAddress,
          country: customer.country,
          state: customer.state,
        };
      }
    } else if (customer.id) {
      const found = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      if (found) {
        customerId = found.id;
        existingCustomer = {
          firstName: found.firstName,
          lastName: found.lastName,
          email: found.email,
        };
      } else {
        guestInfo = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          deliveryAddress: customer.deliveryAddress,
          billingAddress: customer.billingAddress,
          country: customer.country,
          state: customer.state,
        };
      }
    } else {
      guestInfo = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        deliveryAddress: customer.deliveryAddress,
        billingAddress: customer.billingAddress,
        country: customer.country,
        state: customer.state,
      };
    }

    // Transactional creation
    const { order, lineItems } = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalNGN = 0;
      const itemsCreateData: any[] = [];

      for (const i of items) {
        const where: any = { productId: i.productId };
        if (i.color && i.color !== "N/A") where.color = i.color;
        if (i.size && i.size !== "N/A") where.size = i.size;

        const variant = await tx.variant.findFirst({
          where,
          include: { product: true },
        });
        if (!variant)
          throw new Error(
            `Variant not found: ${i.productId} ${i.color}/${i.size}`
          );

        if (variant.stock < i.quantity) {
          throw new Error(`Insufficient stock for ${variant.product.name}`);
        }

        await tx.variant.update({
          where: { id: variant.id },
          data: { stock: { decrement: i.quantity } },
        });

        let unitPrice = 0;
        switch ((currency as string).toUpperCase()) {
          case "USD":
            unitPrice = variant.product.priceUSD ?? 0;
            break;
          case "EUR":
            unitPrice = variant.product.priceEUR ?? 0;
            break;
          case "GBP":
            unitPrice = variant.product.priceGBP ?? 0;
            break;
          case "NGN":
          default:
            unitPrice = variant.product.priceNGN ?? 0;
            break;
        }

        let lineTotal = unitPrice * i.quantity;
        if (i.hasSizeMod && i.sizeModFee) {
          lineTotal += i.sizeModFee * i.quantity;
        }
        totalAmount += lineTotal;

        const ngnUnitPrice = variant.product.priceNGN ?? 0;
        totalNGN += ngnUnitPrice * i.quantity;

        itemsCreateData.push({
          variantId: variant.id,
          name: variant.product.name,
          image: variant.product.images[0] ?? null,
          category: variant.product.categorySlug,
          quantity: i.quantity,
          currency: currency as Currency,
          lineTotal,
          color: variant.color,
          size: variant.size,
          hasSizeMod: !!i.hasSizeMod,
          sizeModFee: i.sizeModFee ?? 0,
        });
      }

      // Include delivery fee
      totalAmount += deliveryFee;

      const newOrderId = generateOrderId();
      const order = await tx.order.create({
        data: {
          id: newOrderId,
          status: "Processing",
          currency,
          totalAmount,
          totalNGN: Math.round(totalNGN),
          paymentMethod,
          createdAt: timestamp ? new Date(timestamp) : new Date(),
          customerId,
          items: { create: itemsCreateData },
          ...(guestInfo && { guestInfo }),
          channel: OrderChannel.ONLINE,
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // If authenticated customer provided fresh address info, update their profile
      if (customerId && !guestInfo) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            deliveryAddress: customer.deliveryAddress,
            billingAddress: customer.billingAddress,
            country: customer.country,
            state: customer.state,
          },
        });
      }

      return { order, lineItems: itemsCreateData };
    });

    // Build unified recipient info for email (prefer the latest address / phone from payload)
    const recipient = existingCustomer
      ? {
          firstName: existingCustomer.firstName,
          lastName: existingCustomer.lastName,
          email: existingCustomer.email,
          phone: customer.phone,
          deliveryAddress: customer.deliveryAddress,
          billingAddress: customer.billingAddress,
        }
      : guestInfo
      ? {
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          email: guestInfo.email,
          phone: guestInfo.phone,
          deliveryAddress: guestInfo.deliveryAddress,
          billingAddress: guestInfo.billingAddress,
        }
      : {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          deliveryAddress: customer.deliveryAddress,
          billingAddress: customer.billingAddress,
        };

    // Attempt sending receipt (with retry tracking)
    await sendReceiptEmailWithRetry({
      order,
      recipient,
      currency,
      deliveryFee,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        email: existingCustomer ? existingCustomer.email : guestInfo?.email,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Online order POST error:", err);
    const msg = err.message?.includes("Insufficient stock")
      ? err.message
      : "Internal Server Error";
    const status = msg === "Internal Server Error" ? 500 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
