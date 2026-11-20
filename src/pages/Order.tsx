import clsx from "clsx";
import { Check, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { Badge, ButtonLink, Img } from "@/components/ui";
import { productById, sellerById } from "@/data/catalog";
import { formatDate, formatRWF, formatTime, loc } from "@/lib/format";
import { latestPayment, useAuth, useOrders } from "@/store";
import type { Fulfilment, OrderStatus, PaymentStatus, SellerOrderStatus } from "@/types";
import NotFound from "./NotFound";

export const trackFor = (f: Fulfilment): SellerOrderStatus[] =>
  f === "collection" ? ["accepted", "preparing", "ready", "collected"] : ["accepted", "preparing", "out_for_delivery", "delivered"];

type Tone = "success" | "danger" | "accent" | "brand" | "neutral";
export const orderTone = (s: OrderStatus): Tone =>
  s === "confirmed" || s === "completed" ? "success" : s === "cancelled" ? "danger" : "accent";
export const paymentTone = (s?: PaymentStatus): Tone =>
  s === "successful" ? "success" : s === "pending" || s === "initiated" ? "accent" : s ? "danger" : "neutral";
export const sellerTone = (s: SellerOrderStatus): Tone =>
  s === "rejected" ? "danger" : s === "pending" ? "neutral" : s === "delivered" || s === "collected" ? "success" : "brand";

function OrderInner() {
  const { orderId } = useParams();
  const { t, i18n } = useTranslation();
  const user = useAuth((s) => s.user)!;
  // Customers can only see their own orders.
  const order = useOrders((s) => s.orders.find((o) => o.id === orderId && (o.userId === user.id || user.role !== "customer")));
  if (!order) return <NotFound />;
  const pay = latestPayment(order);
  const statusLabel = (kind: string, status: string) =>
    kind === "payment" ? t(`order.payment.${status}`) : kind === "seller" ? t(`order.seller.${status}`) : t(`order.status.${status}`);

  return (
    <Container className="max-w-3xl">
      {order.status === "confirmed" && (
        <div className="mb-6 flex items-center gap-3 rounded-card bg-brand-50 p-4 text-brand-700" role="status">
          <CheckCircle2 className="size-5" aria-hidden /> <span className="font-medium">{t("order.thanks")}</span>
        </div>
      )}
      <h1 className="font-display text-3xl font-semibold">{t("order.title", { number: order.number })}</h1>
      <p className="mt-1 text-sm text-muted">{t("order.placed", { date: `${formatDate(order.createdAt)} ${formatTime(order.createdAt)}` })} · {order.address}</p>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2"><dt className="text-muted">{t("order.orderStatus")}:</dt><dd><Badge tone={orderTone(order.status)}>{t(`order.status.${order.status}`)}</Badge></dd></div>
        <div className="flex items-center gap-2"><dt className="text-muted">{t("order.paymentStatus")}:</dt><dd><Badge tone={paymentTone(pay?.status)}>{t(`order.payment.${pay?.status ?? "none"}`)}</Badge></dd></div>
      </dl>

      {order.status === "pending_payment" && (
        <ButtonLink to={`/pay/${order.id}`} className="mt-5">{t("order.payNow", { amount: formatRWF(order.total) })}</ButtonLink>
      )}

      <div className="mt-8 space-y-5">
        {order.sellerOrders.map((so) => {
          const seller = sellerById(so.sellerId);
          const track = trackFor(order.fulfilment);
          const idx = track.indexOf(so.status);
          return (
            <section key={so.sellerId} className="card p-5" aria-labelledby={`so-${so.sellerId}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id={`so-${so.sellerId}`} className="font-semibold">{seller.name}</h2>
                <Badge tone={sellerTone(so.status)}>{t(`order.seller.${so.status}`)}</Badge>
              </div>
              {so.status !== "rejected" && (
                <ol className="mt-5 grid grid-cols-4 gap-1" aria-label={t("order.tracking")}>
                  {track.map((s, i) => (
                    <li key={s} className="flex flex-col items-center gap-1.5 text-center" aria-current={i === idx ? "step" : undefined}>
                      <span className={clsx("grid size-7 place-items-center rounded-full text-xs", i <= idx ? "bg-brand-600 text-white" : "bg-sunken text-muted")} aria-hidden>
                        {i <= idx ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={clsx("text-[11px] leading-tight", i <= idx ? "font-medium text-ink" : "text-muted")}>{t(`order.seller.${s}`)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <ul className="mt-5 divide-y divide-line text-sm">
                {so.lines.map((l) => {
                  const p = productById(l.productId)!;
                  return (
                    <li key={l.productId} className="flex items-center gap-3 py-2">
                      <Img src={p.image} alt="" fallback={p.emoji} className="size-9 shrink-0 rounded" sizes="36px" />
                      <span className="flex-1">{l.qty} × {loc(p.name, i18n.language)}</span>
                      <span className="tabular">{formatRWF(l.unitPrice * l.qty)}</span>
                    </li>
                  );
                })}
                <li className="flex justify-between py-2 text-muted"><span>{t("common.delivery")}</span><span className="tabular">{so.deliveryFee ? formatRWF(so.deliveryFee) : t("common.free")}</span></li>
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{t("order.trackingNote")}</p>

      <div className="card mt-5 flex items-center justify-between p-5 text-lg font-semibold">
        <span>{t("common.total")}</span><span className="tabular">{formatRWF(order.total)}</span>
      </div>

      <section className="mt-8" aria-labelledby="hist-h">
        <h2 id="hist-h" className="mb-3 font-semibold">{t("order.history")}</h2>
        <ol className="space-y-2 border-l-2 border-line pl-4 text-sm">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-line-strong" aria-hidden />
              <span className="font-medium">{h.kind === "payment" ? t("order.paymentStatus") : h.kind === "seller" ? sellerById(h.sellerId!).name : t("order.orderStatus")}</span>
              {" · "}{statusLabel(h.kind, h.status)}
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted"><Clock className="size-3" aria-hidden />{formatTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}

export default function OrderPage() {
  return <AuthGate feature="orders"><OrderInner /></AuthGate>;
}
