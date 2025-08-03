export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  Currency,
  OrderChannel,
  OrderStatus,
  Variant,
  Product,
} from "@/lib/generated/prisma-client";
import { sendGenericEmail } from "@/lib/mail";

type IncomingItem = {
  productId: string;
  color: string;
  size: string;
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
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
};

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return (
    "M-ORD" +
    Array.from({ length: 7 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("")
  );
}

export async function POST(req: NextRequest) {
  try {
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
    } = await req.json();

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    if (!paymentMethod || typeof paymentMethod !== "string") {
      return NextResponse.json(
        { error: "paymentMethod is required" },
        { status: 400 }
      );
    }
    if (!staffId || typeof staffId !== "string") {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 }
      );
    }
    if (!currency || !Object.values(Currency).includes(currency)) {
      return NextResponse.json(
        { error: "Invalid or missing currency" },
        { status: 400 }
      );
    }

    // Validate staff
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 400 });
    }

    // Resolve customer / guest
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
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }
      customerId = found.id;
      existingCustomer = {
        firstName: found.firstName,
        lastName: found.lastName,
        email: found.email,
      };
    } else {
      if (
        !customer?.firstName ||
        !customer?.lastName ||
        !customer?.email ||
        !customer?.phone
      ) {
        return NextResponse.json(
          { error: "Guest customer info incomplete" },
          { status: 400 }
        );
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

    // If deliveryOptionId provided, validate it exists and is active
    let deliveryOptionRecord:
      | { id: string; baseFee: number }
      | null = null;
    if (deliveryOptionId) {
      const opt = await prisma.deliveryOption.findUnique({
        where: { id: deliveryOptionId },
      });
      if (!opt || !opt.active) {
        return NextResponse.json(
          { error: "Invalid or inactive delivery option" },
          { status: 400 }
        );
      }
      deliveryOptionRecord = { id: opt.id, baseFee: opt.baseFee };
    }

    // Transactional work
    const { order, lineItems } = await prisma.$transaction(
      async (tx) => {
        let totalAmount = 0; // in selected currency (items only)
        let totalNGN = 0; // accumulate in NGN (items only)

        // Basic incoming item validation
        for (const rawItem of items as IncomingItem[]) {
          if (
            !rawItem.productId ||
            typeof rawItem.quantity !== "number" ||
            rawItem.quantity <= 0 ||
            typeof rawItem.color !== "string" ||
            typeof rawItem.size !== "string"
          ) {
            throw new Error("Invalid item format");
          }
        }

        // Build batch filters (include color/size only if not "N/A")
        const variantFilters: any[] = [];
        for (const rawItem of items as IncomingItem[]) {
          const whereClause: any = { productId: rawItem.productId };
          if (rawItem.color !== "N/A") whereClause.color = rawItem.color;
          if (rawItem.size !== "N/A") whereClause.size = rawItem.size;
          variantFilters.push(whereClause);
        }

        // Fetch all matching variants with their products
        const variants = await tx.variant.findMany({
          where: { OR: variantFilters },
          include: { product: true },
        });

        type VariantWithProduct = Variant & { product: Product };
        const variantMap = new Map<string, VariantWithProduct>();
        for (const v of variants as VariantWithProduct[]) {
          const colorKey = v.color.trim() || "N/A";
          const sizeKey = v.size.trim() || "N/A";
          const normalizedKey = `${v.productId}|${colorKey}|${sizeKey}`;
          variantMap.set(normalizedKey, v);
        }

        // Build order items
        const itemsCreateData: any[] = [];
        for (const rawItem of items as IncomingItem[]) {
          const lookupColor = rawItem.color || "N/A";
          const lookupSize = rawItem.size || "N/A";
          const key = `${rawItem.productId}|${lookupColor}|${lookupSize}`;

          const variant = variantMap.get(key);
          if (!variant) {
            throw new Error(
              `Variant not found: ${rawItem.productId} ${rawItem.color}/${rawItem.size}`
            );
          }

          if (variant.stock < rawItem.quantity) {
            throw new Error(`Insufficient stock for ${variant.product.name}`);
          }

          // Decrement stock
          await tx.variant.update({
            where: { id: variant.id },
            data: { stock: { decrement: rawItem.quantity } },
          });

          // Determine base price in sale currency
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

          // Line total before size modification
          let lineTotal = unitPrice * rawItem.quantity;

          // Size modification (5%) if applicable
          const wantsSizeMod = !!rawItem.hasSizeMod;
          const applicableSizeMod =
            wantsSizeMod && variant.product.sizeMods ? true : false;
          const sizeModFee = applicableSizeMod
            ? +(unitPrice * rawItem.quantity * 0.05).toFixed(2)
            : 0;
          if (applicableSizeMod) {
            lineTotal += sizeModFee;
          }

          totalAmount += lineTotal;
          const ngnUnitPrice = variant.product.priceNGN ?? 0;
          totalNGN += ngnUnitPrice * rawItem.quantity;

          const orderItemData: any = {
            variantId: variant.id,
            name: variant.product.name,
            image: variant.product.images[0] ?? null,
            category: variant.product.categorySlug,
            quantity: rawItem.quantity,
            currency: currency as Currency,
            lineTotal,
            color: variant.color,
            size: variant.size,
            hasSizeMod: applicableSizeMod,
            sizeModFee,
          };

          if (applicableSizeMod && rawItem.customSize) {
            orderItemData.customSize = rawItem.customSize;
          }

          itemsCreateData.push(orderItemData);
        }

        // Determine final delivery fee (override if provided, else baseFee, else 0)
        const resolvedDeliveryFee =
          typeof incomingDeliveryFee === "number"
            ? incomingDeliveryFee
            : deliveryOptionRecord
            ? deliveryOptionRecord.baseFee
            : 0;

        // Total amount including delivery (for display/receipt, keep totalAmount as items-only and store deliveryFee separately)
        const newOrderId = generateOrderId();
        const order = await tx.order.create({
          data: {
            id: newOrderId,
            status: OrderStatus.Processing,
            currency: currency as Currency,
            totalAmount, // items only
            totalNGN: Math.round(totalNGN),
            paymentMethod,
            createdAt: timestamp ? new Date(timestamp) : new Date(),
            customerId,
            staffId,
            channel: OrderChannel.OFFLINE,
            items: { create: itemsCreateData },
            ...(guestInfo && { guestInfo }),
            receiptEmailStatus: {
              create: {
                attempts: 0,
                sent: false,
                deliveryFee: resolvedDeliveryFee,
              },
            },
            ...(deliveryOptionRecord && {
              deliveryOptionId: deliveryOptionRecord.id,
            }),
            deliveryFee: resolvedDeliveryFee,
            ...(deliveryDetails && { deliveryDetails }),
          },
        });

        // Record offline sale
        await tx.offlineSale.create({
          data: {
            orderId: order.id,
            staffId,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
          },
        });

        return { order, lineItems: itemsCreateData };
      },
      {
        timeout: 15_000,
      }
    );

    // Email (best-effort)
    let to: string | undefined, name: string | undefined;
    if (existingCustomer) {
      to = existingCustomer.email;
      name = `${existingCustomer.firstName} ${existingCustomer.lastName}`;
    } else if (guestInfo) {
      to = guestInfo.email;
      name = `${guestInfo.firstName} ${guestInfo.lastName}`;
    }

    if (to && name) {
      const receiptStatusExists = await prisma.receiptEmailStatus.findUnique({
        where: { orderId: order.id },
      });

      try {
        const vatRate = 0.075;
        const subtotal = +order.totalAmount.toFixed(2);
        const vat = +(subtotal * vatRate).toFixed(2);
        const deliveryCharge = order.deliveryFee ?? 0;
        const grandTotal = +(subtotal + vat + deliveryCharge).toFixed(2);
        const sym =
          order.currency === Currency.NGN
            ? "₦"
            : order.currency === Currency.USD
            ? "$"
            : order.currency === Currency.EUR
            ? "€"
            : "£";

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
                    <img
                      src="${p.image ?? ""}"
                      width="40"
                      alt=""
                      style="vertical-align:middle;border-radius:4px;margin-right:8px"
                    />
                    ${p.name} × ${p.quantity}<br/>
                    <small>
                      Color: ${p.color} &bull; Size: ${p.size}
                      ${
                        p.hasSizeMod
                          ? `&bull; Custom Size (5%): ${sym}${p.sizeModFee.toFixed(
                              2
                            )}`
                          : ""
                      }
                      ${
                        p.customSize
                          ? `&bull; Measurements: ${Object.entries(
                              p.customSize
                            )
                              .map(([k, v]) => `${k}:${v}`)
                              .join(", ")}`
                          : ""
                      }
                    </small>
                  </td>
                  <td align="right" style="font-family:monospace">
                    ${sym}${p.lineTotal.toLocaleString()}
                  </td>
                </tr>`
                )
                .join("")}
            </table>

            <div style="margin-top:24px;font-family:monospace">
              <p style="margin:6px 0">
                Subtotal:&nbsp;<strong>${sym}${subtotal.toLocaleString()}</strong>
              </p>
              <p style="margin:6px 0">
                VAT (7.5%):&nbsp;<strong>${sym}${vat.toLocaleString()}</strong>
              </p>
              <p style="margin:6px 0">
                Delivery:&nbsp;<strong>${sym}${deliveryCharge.toLocaleString()}</strong>
              </p>
              <p style="margin:6px 0">
                Grand Total:&nbsp;<strong>${sym}${grandTotal.toLocaleString()}</strong>
              </p>
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

        if (receiptStatusExists) {
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
        if (receiptStatusExists) {
          const existingAttempts = receiptStatusExists.attempts;
          const delayMs = Math.min(
            24 * 60 * 60 * 1000,
            60 * 60 * 1000 * Math.pow(2, existingAttempts)
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

    return NextResponse.json(
      { success: true, orderId: order.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Offline‐sale POST error:", err);
    const msg =
      typeof err.message === "string" && err.message.startsWith("Insufficient")
        ? err.message
        : "Internal Server Error";
    const status = msg === "Internal Server Error" ? 500 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
