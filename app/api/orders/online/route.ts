// app/api/orders/online/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  Currency as CurrencyEnum,
  OrderChannel,
  OrderStatus,
} from "@/lib/generated/prisma-client";
import { sendReceiptEmailWithRetry } from "@/lib/mail";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { verifyTransaction, PaystackError } from "@/lib/paystack";

const ALLOWED_CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;
type AllowedCurrency = (typeof ALLOWED_CURRENCIES)[number];

function toLowest(amount: number): number {
  return Math.round(amount * 100);
}

/** Payload types for clarity */
interface OrderItemPayload {
  productId: string;
  color?: string;
  size?: string;
  quantity: number;
  hasSizeMod?: boolean;
  sizeModFee?: number;
  unitWeight?: number;
}

interface CustomerInput {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  billingAddress: string;
  country?: string;
  state?: string;
}

interface OnlineOrderPayload {
  items: OrderItemPayload[];
  customer: CustomerInput;
  paymentMethod: string;
  currency: string;
  timestamp?: string;
  deliveryFee?: number;
  deliveryOptionId?: string | null;
  paymentReference: string;
}

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 7 }, () =>
    chars.charAt(Math.floor(Math.random() * Math.random() * chars.length))
  ).join("");
  return `M-ORD-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const payload: OnlineOrderPayload = await req.json();

    const {
      items,
      customer,
      paymentMethod,
      currency,
      timestamp,
      deliveryFee = 0,
      deliveryOptionId,
      paymentReference,
    } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    if (!customer || !customer.email) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }
    if (!paymentReference || typeof paymentReference !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid paymentReference" },
        { status: 400 }
      );
    }

    // Normalize and validate currency
    const normalizedCurrency = (currency || "").toString().toUpperCase();
    if (!ALLOWED_CURRENCIES.includes(normalizedCurrency as AllowedCurrency)) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currency}` },
        { status: 400 }
      );
    }

    // === Verify payment with Paystack ===
    let paystackTx;
    try {
      paystackTx = await verifyTransaction(paymentReference);
    } catch (err: any) {
      console.error("Payment verification failed:", err);
      const msg =
        err instanceof PaystackError
          ? `Payment verification failed: ${err.message}`
          : "Payment verification failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Currency consistency (case-insensitive)
    if (paystackTx.currency.toUpperCase() !== normalizedCurrency) {
      return NextResponse.json(
        {
          error: `Currency mismatch: expected ${normalizedCurrency}, got ${paystackTx.currency}`,
        },
        { status: 400 }
      );
    }

    // Validate delivery option if given
    if (deliveryOptionId) {
      const deliveryOpt = await prisma.deliveryOption.findUnique({
        where: { id: deliveryOptionId },
      });
      if (!deliveryOpt) {
        return NextResponse.json(
          { error: "Invalid deliveryOptionId provided" },
          { status: 400 }
        );
      }
      if (!deliveryOpt.active) {
        return NextResponse.json(
          { error: "Delivery option is not active" },
          { status: 400 }
        );
      }
    }

    // === Idempotency: existing order ===
    const existingOrder = await prisma.order.findUnique({
      where: { paymentReference },
      include: { customer: true },
    });

    if (existingOrder) {
      const updates: any = {};
      if (!existingOrder.paymentVerified) updates.paymentVerified = true;
      if (existingOrder.paymentReference !== paymentReference)
        updates.paymentReference = paymentReference;
      if (existingOrder.paymentProviderId !== String(paystackTx.id))
        updates.paymentProviderId = String(paystackTx.id);

      if (Object.keys(updates).length > 0) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: updates,
        });
      }

      const expectedLowestFromOrder = toLowest(existingOrder.totalAmount);
      if (paystackTx.amount !== expectedLowestFromOrder) {
        console.warn("Existing order amount mismatch vs captured payment", {
          orderTotalLowest: expectedLowestFromOrder,
          captured: paystackTx.amount,
          paymentReference,
        });
      }

      return NextResponse.json(
        {
          success: true,
          orderId: existingOrder.id,
          email: existingOrder.customer
            ? existingOrder.customer.email
            : customer.email,
        },
        { status: 200 }
      );
    }

    // === New order path: compute expected totals (server authoritative) ===
    let totalAmount = 0; // major units
    let totalNGN = 0;
    let aggregatedWeight = 0;
    const itemsCreateData: any[] = [];

    for (const i of items) {
      const where: any = { productId: i.productId };
      if (i.color && i.color !== "N/A") where.color = i.color;
      if (i.size && i.size !== "N/A") where.size = i.size;

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

      let unitPrice = 0;
      switch (normalizedCurrency) {
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

      const unitWeight = typeof i.unitWeight === "number" ? i.unitWeight : 0;
      aggregatedWeight += unitWeight * i.quantity;

      itemsCreateData.push({
        variantId: variant.id,
        name: variant.product.name,
        image: variant.product.images[0] ?? null,
        category: variant.product.categorySlug,
        quantity: i.quantity,
        currency: normalizedCurrency as CurrencyEnum,
        lineTotal,
        color: variant.color,
        size: variant.size,
        hasSizeMod: !!i.hasSizeMod,
        sizeModFee: i.sizeModFee ?? 0,
        customSize: {
          unitWeight,
          totalWeight: parseFloat((unitWeight * i.quantity).toFixed(3)),
        },
      });
    }

    totalAmount += deliveryFee;

    // Compare expected amount with Paystack's captured amount (lowest denom)
    const expectedLowest = toLowest(totalAmount);
    if (paystackTx.amount !== expectedLowest) {
      console.warn("Payment amount mismatch", {
        expected: expectedLowest,
        actual: paystackTx.amount,
        paymentReference,
      });

      try {
        await prisma.orphanPayment.upsert({
          where: { reference: paymentReference },
          create: {
            reference: paymentReference,
            amount: paystackTx.amount,
            currency: paystackTx.currency,
            payload: paystackTx as any,
            reconciled: false,
            resolutionNote:
              "Amount mismatch between expected order total and captured payment",
          },
          update: {
            payload: paystackTx as any,
            amount: paystackTx.amount,
            currency: paystackTx.currency,
            resolutionNote:
              "Updated: amount mismatch between expected and captured payment",
          },
        });
      } catch (e) {
        console.warn("Failed to upsert orphan payment for mismatch:", e);
      }

      return NextResponse.json(
        {
          error: `Payment amount mismatch: expected ${expectedLowest}, got ${paystackTx.amount}`,
        },
        { status: 400 }
      );
    }

    // === Resolve session/customer vs guest ===
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

    // === Transactional creation: decrement stock & create order ===
    const { order } = await prisma.$transaction(async (tx) => {
      for (const i of items) {
        const where: any = { productId: i.productId };
        if (i.color && i.color !== "N/A") where.color = i.color;
        if (i.size && i.size !== "N/A") where.size = i.size;

        const variant = await tx.variant.findFirst({
          where,
          include: { product: true },
        });
        if (!variant) {
          throw new Error(
            `Variant not found during transaction: ${i.productId} ${i.color}/${i.size}`
          );
        }

        if (variant.stock < i.quantity) {
          throw new Error(
            `Insufficient stock during transaction for ${variant.product.name}`
          );
        }

        await tx.variant.update({
          where: { id: variant.id },
          data: { stock: { decrement: i.quantity } },
        });
      }

      const newOrderId = generateOrderId();

      const orderData: any = {
        id: newOrderId,
        status: OrderStatus.Processing,
        currency: normalizedCurrency as CurrencyEnum,
        totalAmount,
        totalNGN: Math.round(totalNGN),
        paymentMethod,
        paymentReference,
        paymentProviderId: String(paystackTx.id),
        paymentVerified: true,
        createdAt: timestamp ? new Date(timestamp) : new Date(),
        customerId,
        items: { create: itemsCreateData },
        ...(guestInfo && { guestInfo }),
        channel: OrderChannel.ONLINE,
        deliveryFee,
        deliveryDetails: {
          aggregatedWeight: parseFloat(aggregatedWeight.toFixed(3)),
          deliveryOptionId: deliveryOptionId ?? null,
        },
      };

      if (deliveryOptionId) {
        orderData.deliveryOption = {
          connect: { id: deliveryOptionId },
        };
      }

      const createdOrder = await tx.order.create({
        data: orderData,
        include: {
          items: true,
          customer: true,
        },
      });

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

      return { order: createdOrder };
    });

    // Prepare receipt recipient
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

    try {
      await sendReceiptEmailWithRetry({
        order,
        recipient,
        currency: normalizedCurrency,
        deliveryFee,
      });
    } catch (emailErr) {
      console.warn("Failed to send receipt email:", emailErr);
    }

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

    // Unique constraint race on paymentReference
    if (
      err?.code === "P2002" &&
      Array.isArray(err?.meta?.target) &&
      (err.meta.target as string[]).includes("paymentReference")
    ) {
      try {
        const fallbackOrder = await prisma.order.findUnique({
          where: {
            paymentReference:
              (err as any)?.meta?.targetValue ||
              (err as any)?.params?.paymentReference ||
              "",
          },
          include: { customer: true },
        });
        if (fallbackOrder) {
          return NextResponse.json(
            {
              success: true,
              orderId: fallbackOrder.id,
              email: fallbackOrder.customer
                ? fallbackOrder.customer.email
                : undefined,
            },
            { status: 200 }
          );
        }
      } catch {
        // swallow fallback errors
      }
    }

    const msg = err?.message?.includes("Insufficient stock")
      ? err.message
      : "Internal Server Error";
    const status = msg === "Internal Server Error" ? 500 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
