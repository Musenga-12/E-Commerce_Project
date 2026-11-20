import { productById, sellerById } from "@/data/catalog";
import type { Order, SellerOrder } from "@/types";
import { formatRWF } from "./format";

/** Pre-filled message so the seller sees cart, address, total and our order ID (report §7). */
export function whatsappText(order: Order, so: SellerOrder): string {
  const seller = sellerById(so.sellerId);
  const lines = so.lines.map((l) => `• ${l.qty} × ${productById(l.productId)?.name.en ?? l.productId} — ${formatRWF(l.unitPrice * l.qty)}`);
  return [
    `Muraho ${seller.name}! MealMatch order ${order.number}`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatRWF(so.subtotal)}`,
    order.fulfilment === "collection" && seller.collection ? "Collection at your stall" : `Delivery (${order.district}): ${formatRWF(so.deliveryFee)}`,
    `Total: ${formatRWF(so.subtotal + so.deliveryFee)}`,
    `Address: ${order.address}${order.fulfilment === "delivery" ? `, ${order.district}` : ""}`,
    "",
    `Please confirm availability. I will pay with mobile money in the MealMatch app after you confirm. Ref: ${order.number}`,
  ].join("\n");
}

export function whatsappLink(order: Order, so: SellerOrder): string {
  return `https://wa.me/${sellerById(so.sellerId).whatsapp}?text=${encodeURIComponent(whatsappText(order, so))}`;
}
