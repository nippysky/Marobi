import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Currency } from "@/lib/generated/prisma-client";
import { sendGenericEmail } from "@/lib/mail";

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
    const { items, customer, paymentMethod, currency, staffId, timestamp } =
      await req.json();

    // 0) Validate payload
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // 1) Ensure staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 400 }
      );
    }

    // 2) Determine existing customer vs guest
    let customerId: string | null = null;
    let existingCustomer:
      | { firstName: string; lastName: string; email: string }
      | undefined;
    let guestInfo: Record<string, string> | undefined;

    if (customer.id) {
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
        lastName:  found.lastName,
        email:     found.email,
      };
    } else {
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

    // 3) Run everything in a single transaction
    const { order, lineItems } = await prisma.$transaction(async (tx) => {
      let totalAmount = 0; // in sale currency
      let totalNGN    = 0; // always in NGN

      const itemsCreateData: {
        variantId: string;
        name:      string;
        image:     string | null;
        category:  string;
        quantity:  number;
        currency:  Currency;
        lineTotal: number;
        color:     string;
        size:      string;
      }[] = [];

      for (const i of items) {
        // 3a) Locate the variant
        const where: any = { productId: i.productId };
        if (i.color !== "N/A") where.color = i.color;
        if (i.size  !== "N/A") where.size  = i.size;

        const variant = await tx.variant.findFirst({
          where,
          include: { product: true },
        });
        if (!variant) {
          throw new Error(
            `Variant not found: ${i.productId} ${i.color}/${i.size}`
          );
        }

        // 3b) Stock guard
        if (variant.stock < i.quantity) {
          throw new Error(`Insufficient stock for ${variant.product.name}`);
        }

        // 3c) Decrement stock
        await tx.variant.update({
          where: { id: variant.id },
          data:  { stock: { decrement: i.quantity } },
        });

        // 3d) Compute line total in sale currency
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

        // 3e) Always convert to NGN and accumulate
        const ngnUnitPrice = variant.product.priceNGN ?? 0;
        totalNGN += ngnUnitPrice * i.quantity;

        itemsCreateData.push({
          variantId: variant.id,
          name:      variant.product.name,
          image:     variant.product.images[0] ?? null,
          category:  variant.product.categorySlug,
          quantity:  i.quantity,
          currency:  currency as Currency,
          lineTotal,
          color:     variant.color,
          size:      variant.size,
        });
      }

      // 3f) Create the Order record
      const newOrderId = generateOrderId();
      const order = await tx.order.create({
        data: {
          id:           newOrderId,
          status:       "Processing",
          currency,
          totalAmount,
          totalNGN:     Math.round(totalNGN),
          paymentMethod,
          createdAt:    timestamp ? new Date(timestamp) : new Date(),
          customerId,
          staffId,
          items:        { create: itemsCreateData },
          ...(guestInfo && { guestInfo }),
        },
      });

      // 3g) Record OfflineSale
      await tx.offlineSale.create({
        data: {
          orderId:   order.id,
          staffId,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      return { order, lineItems: itemsCreateData };
    });

    // 4) Send “Thank you” email (outside transaction)
    let to: string | undefined, name: string | undefined;
    if (existingCustomer) {
      to   = existingCustomer.email;
      name = `${existingCustomer.firstName} ${existingCustomer.lastName}`;
    } else if (guestInfo) {
      to   = guestInfo.email;
      name = `${guestInfo.firstName} ${guestInfo.lastName}`;
    }

    if (to && name) {
      const vatRate       = 0.075;
      const subtotal      = +order.totalAmount.toFixed(2);
      const vat           = +(subtotal * vatRate).toFixed(2);
      const deliveryCharge= 0;
      const grandTotal    = +(subtotal + vat + deliveryCharge).toFixed(2);
      const sym = currency === Currency.NGN
        ? "₦"
        : currency === Currency.USD
        ? "$"
        : currency === Currency.EUR
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
                (p) => `
              <tr style="border-bottom:1px solid #e1e1e1">
                <td style="vertical-align:middle">
                  <img
                    src="${p.image ?? ""}"
                    width="40"
                    alt=""
                    style="vertical-align:middle;border-radius:4px;margin-right:8px"
                  />
                  ${p.name} × ${p.quantity}<br/>
                  <small>Color: ${p.color} &bull; Size: ${p.size}</small>
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
              Grand Total:&nbsp;<strong>${sym}${grandTotal.toLocaleString()}</strong>
            </p>
          </div>

          <p style="margin-top:32px;font-size:12px;color:#777">
            If you have any questions, just reply to this email.
          </p>
        </div>
      `;

      await sendGenericEmail({
        to,
        subject:   `Thank you for shopping! Order ${order.id}`,
        title:     `Your Receipt — ${order.id}`,
        intro:     `Hi ${name},<br/>Thank you for your purchase!`,
        bodyHtml,
        button:    {
          label: "View Your Orders",
          url:   `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/account`,
        },
        preheader:  `Your order ${order.id} has been delivered.`,
        footerNote: "If you have any questions, just reply to this email.",
      });
    }

    // 5) Done
    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err: any) {
    console.error("Offline‐sale POST error:", err);
    const msg =
      err.message?.startsWith("Insufficient stock")
        ? err.message
        : "Internal Server Error";
    const status = msg === "Internal Server Error" ? 500 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
