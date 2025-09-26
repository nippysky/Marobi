// app/api/offline-sales/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma, { prismaReady } from "@/lib/db";
import {
  Prisma,
  Currency as PrismaCurrency,
  OrderChannel as PrismaOrderChannel,
  OrderStatus as PrismaOrderStatus,
} from "@/lib/generated/prisma-client";
import { sendGenericEmail } from "@/lib/mail";

/** Request payload shapes */
type IncomingItem = {
  productId: string;
  color: string;   // "N/A" allowed
  size: string;    // "N/A" allowed
  quantity: number;
  hasSizeMod?: boolean;
  customSize?: {
    chest?: string;
    hips?: string;
    length?: string;
    waist?: string;
  };
};

type IncomingCustomer = {
  id?: string;          // existing customer id (optional)
  firstName?: string;   // required for guests
  lastName?: string;    // required for guests
  email?: string;       // required for guests
  phone?: string;       // required for guests
  address?: string;
  country?: string;
  state?: string;
};

/** Branded order id like M-ORDXXXXXXX */
function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return (
    "M-ORD" +
    Array.from({ length: 7 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("")
  );
}

/** Allowed currency codes for validation */
const CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;
type CurrencyCode = (typeof CURRENCIES)[number];

/** Safely coerce unknown to Prisma JSON input */
function toPrismaJson(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull; // set DB NULL (not JSON null)
  // assume it’s JSON-serializable; if not, stringify as a last resort
  try {
    JSON.stringify(value);
    return value as Prisma.InputJsonValue;
  } catch {
    return JSON.parse(
      JSON.stringify({ invalid: true, original: String(value) })
    ) as Prisma.InputJsonValue;
  }
}

export async function POST(req: NextRequest) {
  try {
    await prismaReady;

    const {
      items,
      customer,
      paymentMethod,
      currency,
      staffId,
      timestamp,
      deliveryOptionId,
      deliveryFee: incomingDeliveryFee,
      deliveryDetails,
    }: {
      items: IncomingItem[];
      customer?: IncomingCustomer;
      paymentMethod: string;
      currency: string;
      staffId: string;
      timestamp?: string | number | Date;
      deliveryOptionId?: string;
      deliveryFee?: number;
      deliveryDetails?: unknown;
    } = await req.json();

    // --- Basic validations
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    if (!paymentMethod || typeof paymentMethod !== "string") {
      return NextResponse.json({ error: "paymentMethod is required" }, { status: 400 });
    }
    if (!staffId || typeof staffId !== "string") {
      return NextResponse.json({ error: "staffId is required" }, { status: 400 });
    }
    if (!CURRENCIES.includes(currency as CurrencyCode)) {
      return NextResponse.json({ error: "Invalid or missing currency" }, { status: 400 });
    }
    const currencyEnum = currency as PrismaCurrency;

    // --- Validate staff
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 400 });
    }

    // --- Resolve customer (existing or guest)
    let customerId: string | null = null;
    let existingCustomer:
      | { firstName: string; lastName: string; email: string }
      | undefined;
    let guestInfo: Record<string, string> | undefined;

    if (customer?.id) {
      const found = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      if (!found) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      customerId = found.id;
      existingCustomer = {
        firstName: found.firstName,
        lastName: found.lastName,
        email: found.email,
      };
    } else {
      // Guest must include complete basics
      if (
        !customer?.firstName ||
        !customer?.lastName ||
        !customer?.email ||
        !customer?.phone
      ) {
        return NextResponse.json({ error: "Guest customer info incomplete" }, { status: 400 });
      }
      guestInfo = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || "",
        country: customer.country || "",
        state: customer.state || "",
      };
    }

    // --- Optional delivery option
    let deliveryOptionRecord: { id: string; baseFee: number | null } | null = null;
    if (deliveryOptionId) {
      const opt = await prisma.deliveryOption.findUnique({
        where: { id: deliveryOptionId },
      });
      if (!opt || !opt.active) {
        return NextResponse.json({ error: "Invalid or inactive delivery option" }, { status: 400 });
      }
      deliveryOptionRecord = { id: opt.id, baseFee: opt.baseFee ?? null };
    }

    // Pre-normalize JSON input for Prisma
    const deliveryDetailsInput = toPrismaJson(deliveryDetails);

    // --- Transaction: stock checks, item creation, order creation, offline sale
    const { order, lineItems } = await prisma.$transaction(
      async (tx) => {
        let totalAmount = 0; // in selected currency (items only)
        let totalNGN = 0;    // in NGN, items only

        // Validate items input format
        for (const it of items) {
          if (
            !it.productId ||
            typeof it.quantity !== "number" ||
            it.quantity <= 0 ||
            typeof it.color !== "string" ||
            typeof it.size !== "string"
          ) {
            throw new Error("Invalid item format");
          }
        }

        // Build OR filters to load all variants at once
        const variantFilters: any[] = items.map((it) => {
          const where: any = { productId: it.productId };
          if (it.color !== "N/A") where.color = it.color;
          if (it.size !== "N/A") where.size = it.size;
          return where;
        });

        const variants = await tx.variant.findMany({
          where: { OR: variantFilters },
          include: { product: true },
        });

        // Index variants by normalized key: productId|color|size
        const variantMap = new Map<string, (typeof variants)[number]>();
        for (const v of variants) {
          const colorKey = v.color?.trim() || "N/A";
          const sizeKey = v.size?.trim() || "N/A";
          variantMap.set(`${v.productId}|${colorKey}|${sizeKey}`, v);
        }

        const itemsCreateData: any[] = [];

        for (const raw of items) {
          const key = `${raw.productId}|${raw.color || "N/A"}|${raw.size || "N/A"}`;
          const variant = variantMap.get(key);
          if (!variant) {
            throw new Error(`Variant not found: ${raw.productId} ${raw.color}/${raw.size}`);
          }
          if (variant.stock < raw.quantity) {
            throw new Error(`Insufficient stock for ${variant.product.name}`);
          }

          // Decrement stock
          await tx.variant.update({
            where: { id: variant.id },
            data: { stock: { decrement: raw.quantity } },
          });

          // Determine unit price in selected currency
          let unitPrice = 0;
          switch (currencyEnum) {
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

          // Line total + optional size mod (5%)
          let lineTotal = unitPrice * raw.quantity;
          const wantsSizeMod = !!raw.hasSizeMod;
          const applicableSizeMod = wantsSizeMod && !!variant.product.sizeMods;
          const sizeModFee = applicableSizeMod
            ? +(unitPrice * raw.quantity * 0.05).toFixed(2)
            : 0;
          if (applicableSizeMod) lineTotal += sizeModFee;

          totalAmount += lineTotal;
          const ngnUnit = variant.product.priceNGN ?? 0;
          totalNGN += ngnUnit * raw.quantity;

          const orderItemData: any = {
            variantId: variant.id,
            name: variant.product.name,
            image: Array.isArray(variant.product.images) ? variant.product.images[0] ?? null : null,
            category: variant.product.categorySlug,
            quantity: raw.quantity,
            currency: currencyEnum,
            lineTotal,
            color: variant.color,
            size: variant.size,
            hasSizeMod: applicableSizeMod,
            sizeModFee,
          };
          if (applicableSizeMod && raw.customSize) {
            orderItemData.customSize = raw.customSize;
          }
          itemsCreateData.push(orderItemData);
        }

        // Resolve delivery fee: request override > option.baseFee > 0
        const resolvedDeliveryFee =
          typeof incomingDeliveryFee === "number"
            ? incomingDeliveryFee
            : deliveryOptionRecord?.baseFee ?? 0;

        const orderId = generateOrderId();
        const order = await tx.order.create({
          data: {
            id: orderId,
            status: PrismaOrderStatus.Processing,
            currency: currencyEnum,
            totalAmount,                   // items only
            totalNGN: Math.round(totalNGN),
            paymentMethod,
            createdAt: timestamp ? new Date(timestamp) : new Date(),
            ...(customerId ? { customerId } : {}),
            staffId,
            channel: PrismaOrderChannel.OFFLINE,
            items: { create: itemsCreateData },
            ...(guestInfo ? { guestInfo } : {}),
            receiptEmailStatus: {
              create: {
                attempts: 0,
                sent: false,
                deliveryFee: resolvedDeliveryFee,
              },
            },
            ...(deliveryOptionRecord ? { deliveryOptionId: deliveryOptionRecord.id } : {}),
            deliveryFee: resolvedDeliveryFee,
            ...(deliveryDetailsInput !== undefined
              ? { deliveryDetails: deliveryDetailsInput }
              : {}),
          },
        });

        await tx.offlineSale.create({
          data: {
            orderId: order.id,
            staffId,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
          },
        });

        return { order, lineItems: itemsCreateData };
      },
      { timeout: 15_000 }
    );

    // --- Best-effort receipt email (updates ReceiptEmailStatus if present)
    let to: string | undefined, name: string | undefined;
    if (existingCustomer) {
      to = existingCustomer.email;
      name = `${existingCustomer.firstName} ${existingCustomer.lastName}`;
    } else if (guestInfo) {
      to = guestInfo.email;
      name = `${guestInfo.firstName} ${guestInfo.lastName}`;
    }

    if (to && name) {
      const receiptStatus = await prisma.receiptEmailStatus.findUnique({
        where: { orderId: order.id },
      });

      try {
        const vatRate = 0.075;
        const subtotal = +order.totalAmount.toFixed(2);
        const vat = +(subtotal * vatRate).toFixed(2);
        const deliveryCharge = order.deliveryFee ?? 0;
        const grandTotal = +(subtotal + vat + deliveryCharge).toFixed(2);
        const sym =
          order.currency === "NGN" ? "₦" :
          order.currency === "USD" ? "$"  :
          order.currency === "EUR" ? "€"  : "£";

        const bodyHtml = `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#333">
            <h2 style="margin-bottom:12px">Your Receipt — ${order.id}</h2>
            <p>Hi ${name},<br/>Thank you for your purchase!</p>

            <p>Here’s what you bought in order <strong>${order.id}</strong>:</p>
            <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse">
              ${lineItems
                .map(
                  (p: any) => `
                <tr style="border-bottom:1px solid #e1e1e1">
                  <td style="vertical-align:middle">
                    ${
                      p.image
                        ? `<img src="${p.image}" width="40" alt="" style="vertical-align:middle;border-radius:4px;margin-right:8px" />`
                        : ""
                    }
                    ${p.name} × ${p.quantity}<br/>
                    <small>
                      Color: ${p.color} &bull; Size: ${p.size}
                      ${p.hasSizeMod ? `&bull; Custom Size (5%): ${sym}${p.sizeModFee.toFixed(2)}` : ""}
                      ${
                        p.customSize
                          ? `&bull; Measurements: ${Object.entries(p.customSize)
                              .map(([k, v]) => `${k}:${v}`)
                              .join(", ")}`
                          : ""
                      }
                    </small>
                  </td>
                  <td align="right" style="font-family:monospace">
                    ${sym}${Number(p.lineTotal).toLocaleString()}
                  </td>
                </tr>`
                )
                .join("")}
            </table>

            <div style="margin-top:24px;font-family:monospace">
              <p style="margin:6px 0">Subtotal: <strong>${sym}${subtotal.toLocaleString()}</strong></p>
              <p style="margin:6px 0">VAT (7.5%): <strong>${sym}${vat.toLocaleString()}</strong></p>
              <p style="margin:6px 0">Delivery: <strong>${sym}${deliveryCharge.toLocaleString()}</strong></p>
              <p style="margin:6px 0">Grand Total: <strong>${sym}${grandTotal.toLocaleString()}</strong></p>
            </div>

            <p style="margin-top:32px;font-size:12px;color:#777">
              Your order is currently being processed. If you have any questions, just reply to this email.
            </p>
          </div>
        `;

        await sendGenericEmail({
          to,
          subject: `Thank you for shopping! Order ${order.id}`,
          title: `Your Receipt — ${order.id}`,
          intro: `Hi ${name},<br/>Thank you for your purchase!`,
          bodyHtml,
          button: {
            label: "View Your Orders",
            url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/account`,
          },
          preheader: `Your order ${order.id} is being processed.`,
          footerNote: "If you have any questions, just reply to this email.",
        });

        if (receiptStatus) {
          await prisma.receiptEmailStatus.update({
            where: { orderId: order.id },
            data: {
              attempts: { increment: 1 },
              sent: true,
              lastError: null,
              nextRetryAt: null,
            },
          });
        }
      } catch (emailErr: any) {
        console.warn("Failed to send receipt email:", emailErr);
        const receiptStatus = await prisma.receiptEmailStatus.findUnique({
          where: { orderId: order.id },
        });
        if (receiptStatus) {
          const attempts = receiptStatus.attempts;
          const delayMs = Math.min(
            24 * 60 * 60 * 1000,
            60 * 60 * 1000 * Math.pow(2, attempts)
          );
          const nextRetryAt = new Date(Date.now() + delayMs);
          await prisma.receiptEmailStatus.update({
            where: { orderId: order.id },
            data: {
              attempts: { increment: 1 },
              sent: false,
              lastError: String(emailErr?.message || emailErr),
              nextRetryAt,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err: any) {
    console.error("Offline-sale POST error:", err);
    const msg =
      typeof err?.message === "string" && err.message.startsWith("Insufficient")
        ? err.message
        : "Internal Server Error";
    const status = msg === "Internal Server Error" ? 500 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
