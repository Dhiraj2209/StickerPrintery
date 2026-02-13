import { jsPDF } from "jspdf";
import { type CartItem, type CustomerDetails } from "../types";

const PAYMENT_QR_IMAGE = "/payment-qr.svg";

async function toPngDataUrl(imageUrl: string): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
}

type BuildOrderPdfParams = {
  customer: CustomerDetails;
  cartItems: CartItem[];
};

export async function generateOrderPdf({ customer, cartItems }: BuildOrderPdfParams) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const now = new Date();
  const timestamp = now.toLocaleString();
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  let y = 44;
  doc.setFontSize(18);
  doc.text("Sticker Order Summary", 40, y);
  y += 22;
  doc.setFontSize(10);
  doc.text(`Generated: ${timestamp}`, 40, y);
  y += 18;
  doc.text(`Customer Name: ${customer.name}`, 40, y);
  y += 15;
  doc.text(`Contact Number: ${customer.contactNumber}`, 40, y);
  y += 15;
  addWrappedText(
    doc,
    `Address: ${customer.streetAddress}, Pincode - ${customer.pincode}`,
    40,
    y,
    520,
  );
  y += 30;

  doc.setDrawColor(190, 210, 203);
  doc.line(40, y, 555, y);
  y += 16;

  doc.setFontSize(11);
  for (const { product, quantity } of cartItems) {
    if (y > 730) {
      doc.addPage();
      y = 46;
    }

    const imageData = await toPngDataUrl(product.imageUrl);
    doc.addImage(imageData, "PNG", 40, y, 56, 56);

    doc.text(`Sticker Name: ${product.name}`, 106, y + 14);
    doc.text(`Sheet Name: ${product.sheetName}`, 106, y + 28);
    doc.text(`Sticker Sheet ID: ${product.id}`, 106, y + 42);
    doc.text(`Size: ${product.size.toUpperCase()} | Quantity: ${quantity}`, 106, y + 56);
    y += 72;
  }

  if (y > 665) {
    doc.addPage();
    y = 46;
  }

  doc.setFontSize(12);
  doc.text(`Total Quantity: ${totalQty}`, 40, y + 10);

  doc.addPage();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(16);
  doc.text("Payment and Terms", 40, 48);
  doc.setFontSize(11);
  doc.text("Please pay on this to confirm your order.", 40, 70);

  const leftX = 40;
  const topY = 92;
  const colWidth = 250;
  const sectionHeight = pageHeight - 160;

  doc.setDrawColor(198, 210, 206);
  doc.rect(leftX, topY, colWidth, sectionHeight);
  doc.rect(leftX + colWidth + 15, topY, colWidth, sectionHeight);

  doc.setFontSize(12);
  doc.text("Terms & Conditions", leftX + 10, topY + 20);
  doc.setFontSize(10);
  addWrappedText(
    doc,
    "1. Order is confirmed after payment verification.\n2. Please share the payment proof on WhatsApp.\n3. Sticker color may vary slightly on print.\n4. Custom requests may need extra processing time.\n5. No backend payment gateway is active yet.",
    leftX + 10,
    topY + 40,
    colWidth - 20,
  );

  const qrData = await toPngDataUrl(PAYMENT_QR_IMAGE);
  const qrX = leftX + colWidth + 65;
  const qrY = topY + 70;
  doc.addImage(qrData, "PNG", qrX, qrY, 150, 150);
  doc.setFontSize(10);
  doc.text("Scan QR to Pay", qrX + 36, qrY + 170);

  const blob = doc.output("blob");
  const fileName = `sticker-order-${now.getTime()}.pdf`;
  const summaryText = `Order from ${customer.name}. Total stickers: ${totalQty}. Contact: ${customer.contactNumber}.`;

  return { blob, fileName, summaryText };
}
