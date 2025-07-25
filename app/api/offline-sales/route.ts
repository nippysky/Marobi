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
    const body = await req.json();
    const { items, customer, paymentMethod, currency, staffId, timestamp } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // 1) Ensure staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 400 });
    }

    // 2) Determine existing customer vs guest
    let customerId: string | null = null;
    let existingCustomer:
      | { firstName: string; lastName: string; email: string }
      | undefined;
    let guestInfo: Record<string, string> | undefined;

    if (customer.id) {
      const foundCust = await prisma.customer.findUnique({ where: { id: customer.id } });
      if (!foundCust) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      customerId = foundCust.id;
      existingCustomer = {
        firstName: foundCust.firstName,
        lastName:  foundCust.lastName,
        email:     foundCust.email,
      };
    } else {
      // treat as guest
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

    // 3) Validate stock, build line‑items
    let totalAmount = 0;
    let totalNGN    = 0;
    const itemsCreateData: {
      variantId: string;
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
      // locate the exact variant
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

      // server‐side stock guard
      if (variant.stock < i.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${variant.product.name}` },
          { status: 400 }
        );
      }

      // decrement stock
      await prisma.variant.update({
        where: { id: variant.id },
        data: { stock: { decrement: i.quantity } },
      });

      // pick unit price by currency
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

      itemsCreateData.push({
        variantId: variant.id,
        name:      variant.product.name,
        image:     variant.product.images[0] ?? null,
        category:  variant.product.category,
        quantity:  i.quantity,
        currency:  currency as Currency,
        lineTotal,
        color:     variant.color,
        size:      variant.size,
      });
    }

    // 4) Create the Order
    const newOrderId = generateOrderId();
    const order = await prisma.order.create({
      data: {
        id:           newOrderId,
        status:       "Delivered",
        currency:     currency as Currency,
        totalAmount,
        totalNGN,
        paymentMethod,
        createdAt:    timestamp ? new Date(timestamp) : new Date(),
        customerId,
        staffId,
        items:        { create: itemsCreateData },
        ...(guestInfo && { guestInfo }),
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

     // 6) Send “Thank you” email
    let to: string | undefined;
    let name: string | undefined;
    if (existingCustomer) {
      to = existingCustomer.email;
      name = `${existingCustomer.firstName} ${existingCustomer.lastName}`;
    } else if (guestInfo) {
      to   = guestInfo.email;
      name = `${guestInfo.firstName} ${guestInfo.lastName}`;
    }

    if (to && name) {
      const vatRate       = 0.075;
      const subtotal      = +totalAmount.toFixed(2);
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
        <p>Here’s what you purchased in order <strong>${order.id}</strong>:</p>
        <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse">
          ${itemsCreateData
            .map(
              (p) => `
            <tr style="border-bottom:1px solid #ddd">
              <td>
                <img src="${p.image ?? ""}" width="40" alt="" 
                     style="vertical-align:middle;border-radius:4px;margin-right:8px"/>
                ${p.name}<br/>
                <small>Color: ${p.color} &bull; Size: ${p.size}</small>
              </td>
              <td align="right">
                ${sym}${p.lineTotal.toLocaleString()}
              </td>
            </tr>`
            )
            .join("")}
        </table>
        <p>
          Subtotal: <strong>${sym}${subtotal.toLocaleString()}</strong><br/>
          VAT (${(vatRate * 100).toFixed(1)}%): <strong>${sym}${vat.toLocaleString()}</strong><br/>
          Grand Total: <strong>${sym}${grandTotal.toLocaleString()}</strong>
        </p>
      `;

      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      try {
        await sendGenericEmail({
          to,
          subject: `Thanks for shopping! Order ${order.id}`,
          title:   `Your Receipt — ${order.id}`,
          intro:   `Hi ${name},<br/>Thank you for your purchase!`,
          bodyHtml,
          button: {
            label: "View Your Orders",
            url:   `${baseUrl}/account`,
          },
          preheader:  `Your order ${order.id} is now delivered.`,
          footerNote: "If you have questions, just reply to this email.",
        });
      } catch (err) {
        console.error("Failed to send offline‑sale email:", err);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error: any) {
    console.error("Error logging offline sale:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
