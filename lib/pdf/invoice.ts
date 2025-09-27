// lib/pdf/invoice.ts
// Use the standalone build (AFM embedded)
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

/**
 * Generate a Teeka4-style invoice PDF as a Buffer.
 */
export async function generateInvoicePDF({
  order,
  recipient,
  currency,
  deliveryFee,
}: {
  order: {
    id: string;
    createdAt: string | Date;
    items: Array<{
      name: string;
      image?: string | null;
      quantity: number;
      lineTotal: number;
      color?: string | null;
      size?: string | null;
      hasSizeMod?: boolean;
      sizeModFee?: number;
      customSize?: any;
    }>;
    paymentMethod: string;
    totalAmount?: number;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    deliveryAddress?: string;
    billingAddress?: string;
  };
  currency: "NGN" | "USD" | "EUR" | "GBP" | string;
  deliveryFee: number;
}): Promise<Buffer> {
  // Prefer a TTF with ₦. Place files at public/fonts or lib/pdf/fonts
  const fontCandidates = [
    ["NotoSans-Regular.ttf", "NotoSans-Bold.ttf"],
    ["Inter-Regular.ttf", "Inter-Bold.ttf"],
    ["Roboto-Regular.ttf", "Roboto-Bold.ttf"],
  ];

  function findFontPair() {
    const roots = [
      path.join(process.cwd(), "public", "fonts"),
      path.join(process.cwd(), "lib", "pdf", "fonts"),
    ];
    for (const [reg, bold] of fontCandidates) {
      for (const root of roots) {
        const r = path.join(root, reg);
        const b = path.join(root, bold);
        if (fs.existsSync(r) && fs.existsSync(b)) return { regular: r, bold: b };
      }
    }
    return null;
  }

  const fontPair = findFontPair();
  const doc = new PDFDocument({
    size: "A4",
    margin: 36,
    bufferPages: true,
  });

  // Register fonts (or fall back to Helvetica)
  let bodyFont = "Helvetica";
  let boldFont = "Helvetica-Bold";
  if (fontPair) {
    const regularBuf = fs.readFileSync(fontPair.regular);
    const boldBuf = fs.readFileSync(fontPair.bold);
    doc.registerFont("Body", regularBuf);
    doc.registerFont("Bold", boldBuf);
    bodyFont = "Body";
    boldFont = "Bold";
  }

  // Currency label (if the chosen font can't display ₦, use NGN)
  const symbol =
    currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  const currencyLabel =
    bodyFont === "Helvetica" && symbol === "₦" ? "NGN " : symbol;

  const money = (n: number) => `${currencyLabel}${Number(n).toLocaleString()}`;

  const subtotal = Number(order.totalAmount ?? 0);
  const shipping = Number(deliveryFee ?? 0);
  const total = +(subtotal + shipping).toFixed(2);

  const margin = doc.page.margins.left;
  const tableStartY = 260;

  // Capture buffer
  const chunks: Buffer[] = [];
  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer<ArrayBufferLike>) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  /* ---------- Header ---------- */
  doc.font(boldFont).fontSize(22).fillColor("#043927").text("Marobi", margin, margin);

  const rightBoxWidth = 200;
  const rightX = doc.page.width - margin - rightBoxWidth;
  const metaY = margin;

  doc
    .font(bodyFont)
    .fontSize(10)
    .fillColor("#111")
    .text(`Invoice Number:  ${order.id}`, rightX, metaY, { width: rightBoxWidth, align: "right" })
    .text(
      `Order Date:     ${new Date(order.createdAt).toLocaleDateString()}`,
      rightX,
      metaY + 14,
      { width: rightBoxWidth, align: "right" }
    )
    .text(`Payment Method: ${order.paymentMethod || "—"}`, rightX, metaY + 28, {
      width: rightBoxWidth,
      align: "right",
    });

  try {
    const qrDataURL = await QRCode.toDataURL(order.id, { margin: 0, width: 72 });
    const buf = Buffer.from(qrDataURL.split(",")[1], "base64");
    doc.image(buf, rightX + rightBoxWidth - 72, metaY - 6, { width: 72 });
  } catch {
    /* ignore */
  }

  doc.moveDown(2.2).font(boldFont).fontSize(18).fillColor("#111").text("INVOICE", margin, 110);

  const name = `${recipient.firstName} ${recipient.lastName}`.trim();
  doc
    .font(bodyFont)
    .fontSize(11)
    .fillColor("#111")
    .text("Bill To:", margin, 140)
    .font(boldFont)
    .text(name, margin, 154)
    .font(bodyFont)
    .text(recipient.email || "", { width: 260 });
  if (recipient.billingAddress) doc.moveDown(0.4).text(recipient.billingAddress, { width: 260 });

  doc
    .font(bodyFont)
    .fontSize(11)
    .fillColor("#111")
    .text("Ship To:", margin + 300, 140)
    .font(boldFont)
    .text(name, margin + 300, 154)
    .font(bodyFont);
  if (recipient.deliveryAddress) doc.moveDown(0.4).text(recipient.deliveryAddress, { width: 260 });

  /* ---------- Table ---------- */
  // Fixed-width right price box so it never hits the page edge
  const priceBoxWidth = 120;
  const priceX = doc.page.width - margin - priceBoxWidth;
  const qtyX = priceX - 80;
  const productX = margin;

  let y = tableStartY;

  const drawHeader = () => {
    doc
      .font(boldFont)
      .fontSize(11)
      .fillColor("#111")
      .text("Product", productX, y)
      .text("Quantity", qtyX, y)
      .text("Price", priceX, y, { width: priceBoxWidth, align: "right" })
      .font(bodyFont);

    y += 18;
    doc
      .moveTo(margin, y)
      .lineTo(doc.page.width - margin, y)
      .lineWidth(0.5)
      .stroke("#e5e7eb");
    y += 8;
  };

  const ensureSpace = (needed = 40) => {
    if (y + needed > doc.page.height - margin - 120) {
      doc.addPage();
      y = tableStartY;
      drawHeader();
    }
  };

  drawHeader();

  order.items.forEach((it, idx) => {
    // Build sub-lines
    const subParts: string[] = [];
    if (it.color) subParts.push(`Color: ${it.color}`);
    if (it.hasSizeMod) {
      subParts.push("Size: Custom");
    } else if (it.size) {
      subParts.push(`Size: ${it.size}`);
    }
    const subLine = subParts.join(" • ");

    const hasSizeFee = !!(it.hasSizeMod && it.sizeModFee);
    const cm = (it as any).customSize || {};
    const cmParts: string[] = [];
    if (cm.chest ?? cm.bust) cmParts.push(`Chest/Bust: ${cm.chest ?? cm.bust}`);
    if (cm.waist !== undefined) cmParts.push(`Waist: ${cm.waist}`);
    if (cm.hip !== undefined) cmParts.push(`Hip: ${cm.hip}`);
    if (cm.length !== undefined) cmParts.push(`Length: ${cm.length}`);
    const hasCustom = it.hasSizeMod && cmParts.length > 0;

    // Compute row height dynamically
    let rowHeight = 20; // name line
    if (subLine) rowHeight += 12;
    if (hasSizeFee) rowHeight += 12;
    if (hasCustom) rowHeight += 12;
    rowHeight = Math.max(rowHeight, 34);

    ensureSpace(rowHeight + 14);

    const rowBG = idx % 2 === 0 ? "#fafafa" : "#ffffff";
    doc.rect(margin, y - 6, doc.page.width - margin * 2, rowHeight).fillAndStroke(rowBG, rowBG);

    // Name
    let lineY = y - 2;
    doc
      .fillColor("#111")
      .font(bodyFont)
      .fontSize(10)
      .text(it.name, productX, lineY, { width: qtyX - productX - 12 });

    // Sub line (color/size)
    if (subLine) {
      lineY += 12;
      doc.fillColor("#6b7280").fontSize(9).text(subLine, productX, lineY, {
        width: qtyX - productX - 12,
      });
    }

    // Size-mod fee
    if (hasSizeFee) {
      lineY += 12;
      doc.fillColor("#92400e").fontSize(9).text(
        `+5% size-mod fee: ${money((it.sizeModFee || 0) * it.quantity)}`,
        productX,
        lineY,
        { width: qtyX - productX - 12 }
      );
    }

    // Custom measurements
    if (hasCustom) {
      lineY += 12;
      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .text(`Custom measurements: ${cmParts.join(" • ")}`, productX, lineY, {
          width: qtyX - productX - 12,
        });
    }

    // Qty
    doc.fillColor("#111").fontSize(10).text(String(it.quantity), qtyX, y - 2, { width: 50 });

    // Price (line total)
    doc
      .font(boldFont)
      .text(money(it.lineTotal), priceX, y - 2, { width: priceBoxWidth, align: "right" })
      .font(bodyFont);

    y += rowHeight + 6;
  });

  /* ---------- Totals ---------- */
  ensureSpace(110);
  y += 8;
  doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).lineWidth(0.5).stroke("#e5e7eb");
  y += 10;

  const labelX = qtyX - 40;

  const totalRow = (label: string, value: number | string, bold = false) => {
    doc
      .font(bold ? boldFont : bodyFont)
      .fontSize(11)
      .fillColor("#111")
      .text(label, labelX, y, { width: priceX - labelX - 10, align: "right" })
      .text(typeof value === "number" ? money(value) : value, priceX, y, {
        width: priceBoxWidth,
        align: "right",
      });
    y += 18;
  };

  totalRow("Subtotal:", subtotal);
  totalRow("Shipping:", shipping);
  totalRow("Total:", total, true);

  doc
    .font(bodyFont)
    .fontSize(9)
    .fillColor("#6b7280")
    .text("Thanks for shopping with Marobi.", margin, doc.page.height - margin - 20);

  doc.end();
  return bufferPromise;
}
