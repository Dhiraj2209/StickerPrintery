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

function fitText(doc: jsPDF, value: string, x: number, y: number, width: number) {
  const lines = doc.splitTextToSize(value, width - 4);
  doc.text(lines[0] ?? "", x, y);
}

type BuildOrderPdfParams = {
  customer: CustomerDetails;
  cartItems: CartItem[];
};

export async function generateOrderPdf({ customer, cartItems }: BuildOrderPdfParams) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const timestamp = now.toLocaleString();
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const marginX = 28;
  let y = 40;

  doc.setFontSize(17);
  doc.text("StickerPrintery - Invoice", marginX, y);
  doc.setFontSize(10);
  y += 18;
  doc.text(`Date Time: ${timestamp}`, marginX, y);
  y += 14;
  doc.text(`Customer: ${customer.name}`, marginX, y);
  y += 14;
  doc.text(`Contact: ${customer.contactNumber}`, marginX, y);
  y += 14;
  doc.text(`Address: ${customer.streetAddress}, ${customer.pincode}`, marginX, y);
  y += 18;

  const columns = [
    { title: "#", width: 24 },
    { title: "Image", width: 50 },
    { title: "Sheet ID", width: 82 },
    { title: "Name", width: 170 },
    { title: "Size", width: 46 },
    { title: "Qty", width: 46 },
  ];

  const drawTableHeader = () => {
    let x = marginX;
    doc.setFillColor(236, 245, 242);
    doc.rect(marginX, y, pageWidth - marginX * 2, 22, "F");
    doc.setFontSize(9);
    for (const column of columns) {
      doc.rect(x, y, column.width, 22);
      doc.text(column.title, x + 3, y + 14);
      x += column.width;
    }
    y += 22;
  };

  drawTableHeader();

  let rowIndex = 1;
  for (const item of cartItems) {
    const rowHeight = 56;
    if (y + rowHeight > pageHeight - 230) {
      doc.addPage();
      y = 30;
      drawTableHeader();
    }

    const imageData = await toPngDataUrl(item.product.imageUrl);
    let x = marginX;
    for (const column of columns) {
      doc.rect(x, y, column.width, rowHeight);
      x += column.width;
    }

    x = marginX;
    doc.setFontSize(9);
    doc.text(String(rowIndex), x + 7, y + 16);
    x += columns[0].width;
    doc.addImage(imageData, "PNG", x + 4, y + 4, 42, 42);
    x += columns[1].width;
    fitText(doc, item.product.id, x + 2, y + 16, columns[2].width);
    x += columns[2].width;
    fitText(doc, item.product.sheetName, x + 2, y + 16, columns[3].width);
    x += columns[3].width;
    doc.text(item.product.size.toUpperCase(), x + 4, y + 16);
    x += columns[4].width;
    doc.text(String(item.quantity), x + 14, y + 16);

    y += rowHeight;
    rowIndex += 1;
  }

  doc.setFontSize(10);
  doc.text(`Total Quantity: ${totalQty}`, marginX, y + 16);
  y += 34;

  if (y + 190 > pageHeight - 24) {
    doc.addPage();
    y = 32;
  }

  const boxGap = 14;
  const boxWidth = (pageWidth - marginX * 2 - boxGap) / 2;
  const boxHeight = 170;
  doc.setDrawColor(195, 210, 204);
  doc.rect(marginX, y, boxWidth, boxHeight);
  doc.rect(marginX + boxWidth + boxGap, y, boxWidth, boxHeight);

  doc.setFontSize(12);
  doc.text("Terms & Conditions", marginX + 8, y + 18);
  doc.setFontSize(9);
  const terms = [
    "1. Order confirmed after payment proof.",
    "2. Share payment screenshot on WhatsApp.",
    "3. Sticker shades may vary slightly.",
    "4. Custom sheets can take extra time.",
    "5. This is a no-backend direct order flow.",
  ];
  let termsY = y + 34;
  for (const line of terms) {
    doc.text(line, marginX + 8, termsY);
    termsY += 14;
  }

  doc.setFontSize(12);
  doc.text("Payment QR", marginX + boxWidth + boxGap + 8, y + 18);
  doc.setFontSize(9);
  doc.text("Please pay on this to confirm your order", marginX + boxWidth + boxGap + 8, y + 34);
  const qrData = await toPngDataUrl(PAYMENT_QR_IMAGE);
  doc.addImage(qrData, "PNG", marginX + boxWidth + boxGap + 45, y + 44, 118, 118);

  const blob = doc.output("blob");
  const fileName = `sticker-order-${now.getTime()}.pdf`;
  const summaryText = `Invoice from StickerPrintery for ${customer.name}. Total quantity: ${totalQty}.`;
  return { blob, fileName, summaryText };
}
