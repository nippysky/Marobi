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

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // 1) Ensure staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 400 });
    }

    // 2) Existing customer vs one‑off guest
    let customerId: string | null = null;
    let guestInfo: Record<string, string> | undefined;

    if (customer.id) {
      const existing = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      customerId = existing.id;
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

    // 3) Validate stock & build line‑item payloads
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

      // decrement stock
      await prisma.variant.update({
        where: { id: variant.id },
        data: { stock: { decrement: i.quantity } },
      });

      // pick price field by currency
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

    // 4) Create the Order (status = Delivered for offline sale)
    const newOrderId = generateOrderId();
    const order = await prisma.order.create({
      data: {
        id:           newOrderId,
        status:       "Delivered",          // << change here
        currency:     currency as Currency,
        totalAmount,
        totalNGN,
        paymentMethod,
        createdAt:    timestamp ? new Date(timestamp) : new Date(),
        customerId,                            // null for guests
        staffId,
        items:        { create: orderItemsData },
        ...(guestInfo && { guestInfo }),       // embed guest info if needed
      },
      include: {
        items: true,
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
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

    // 6) Send “Thank you” email with receipt
    let to: string | undefined;
    let name: string | undefined;

    if (order.customer) {
      to   = order.customer.email;
      name = `${order.customer.firstName} ${order.customer.lastName}`.trim();
    } else if (
      order.guestInfo &&
      typeof order.guestInfo === "object"
    ) {
      const gi = order.guestInfo as {
        firstName: string;
        lastName:  string;
        email:     string;
      };
      to   = gi.email;
      name = `${gi.firstName} ${gi.lastName}`.trim();
    }

    if (to) {
      const vatRate       = 0.075;
      const subtotal      = +order.totalAmount.toFixed(2);
      const vat           = +(subtotal * vatRate).toFixed(2);
      const deliveryCharge= 0;      // in‑store pickup
      const grandTotal    = +(subtotal + vat + deliveryCharge).toFixed(2);
      const sym = currency === Currency.NGN
        ? "₦"
        : currency === Currency.USD
        ? "$"
        : currency === Currency.EUR
        ? "€"
        : "£";

      // Build a simple HTML receipt
      let bodyHtml = `<p>Here’s what you purchased in order <strong>${order.id}</strong>:</p>
        <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse">
          ${order.items
            .map(
              p => `
            <tr style="border-bottom:1px solid #ddd">
              <td>
                <img src="${p.image || ""}" width="40" alt="" style="vertical-align:middle;border-radius:4px;margin-right:8px"/>
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
        </p>`;

      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      try {
        await sendGenericEmail({
          to,
          subject: `Thank you for shopping with us! Order ${order.id}`,
          title: `Your Receipt — ${order.id}`,
          intro: `Hi ${name},<br/>Thank you for your purchase!`,
          bodyHtml,
          button: {
            label: "View Your Orders",
            url: `${baseUrl}/account`,
          },
          preheader: `Your order ${order.id} is now delivered.`,
          footerNote: "If you have any questions, just reply to this email."
        });
      } catch (emailErr) {
        console.error("⚠️ Failed to send offline‑sale email:", emailErr);
      }
    }

    // 7) Done
    return NextResponse.json(
      { success: true, orderId: order.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error logging offline sale:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
