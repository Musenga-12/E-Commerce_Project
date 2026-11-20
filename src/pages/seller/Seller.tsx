import { AlertTriangle, Banknote, ClipboardList, Inbox, LayoutDashboard, Star, Tags, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { create } from "zustand";
import { DashboardLayout } from "@/components/layout";
import { toast } from "@/components/toast";
import { Badge, Button, EmptyState, Img, PageHeader, Stat } from "@/components/ui";
import { productById, products, sellerById, sellers } from "@/data/catalog";
import { recipes } from "@/data/recipes";
import { formatDate, formatRange, formatRWF, loc } from "@/lib/format";
import { latestPayment, useAuth, useCatalog, useOrders } from "@/store";
import type { Order, SellerOrder, SellerOrderStatus } from "@/types";
import { orderTone, sellerTone } from "../Order";

const useSellerView = create<{ sellerId: string; set: (id: string) => void }>((set) => ({
  sellerId: "s1",
  set: (sellerId) => set({ sellerId }),
}));

export function SellerShell() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login?next=/seller" replace />;
  if (user.role === "customer") return <Navigate to="/account" replace />;
  return (
    <DashboardLayout
      title={t("sellerHub.title")}
      nav={[
        { to: "/seller", label: t("sellerHub.overview"), icon: LayoutDashboard, end: true },
        { to: "/seller/orders", label: t("sellerHub.orders"), icon: ClipboardList },
        { to: "/seller/offers", label: t("sellerHub.offers"), icon: Tags },
      ]}
    />
  );
}

function ViewingAs() {
  const { t } = useTranslation();
  const { sellerId, set } = useSellerView();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {t("sellerHub.viewingAs")}
      <select className="field min-h-10 w-auto py-0" value={sellerId} onChange={(e) => set(e.target.value)}>
        {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </label>
  );
}

function useSellerOrders() {
  const sellerId = useSellerView((s) => s.sellerId);
  const orders = useOrders((s) => s.orders);
  return orders.flatMap((o) => o.sellerOrders.filter((so) => so.sellerId === sellerId).map((so) => ({ order: o, so })));
}

const isActionable = (o: Order, so: SellerOrder) =>
  (o.status === "awaiting_seller_confirmation" && so.status === "pending") || (o.status === "confirmed" && !["delivered", "collected", "rejected"].includes(so.status));

export function SellerOverview() {
  const { t, i18n } = useTranslation();
  const sellerId = useSellerView((s) => s.sellerId);
  const seller = sellerById(sellerId);
  const rows = useSellerOrders();
  const paid = rows.filter((r) => latestPayment(r.order)?.status === "successful" && r.so.status !== "rejected");
  const revenue = paid.reduce((s, r) => s + r.so.subtotal, 0);
  const pending = rows.filter((r) => isActionable(r.order, r.so)).length;
  const mine = new Set(products.filter((p) => p.offers.some((o) => o.sellerId === sellerId)).map((p) => p.id));
  const drivers = recipes.map((r) => ({ r, n: r.ingredients.filter((i) => mine.has(i.productId)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 4);

  return (
    <>
      <PageHeader title={seller.name} sub={loc(seller.tagline, i18n.language)}><ViewingAs /></PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("sellerHub.revenue")} value={formatRWF(revenue)} icon={<TrendingUp className="size-4" />} hint={t("sellerHub.commission")} />
        <Stat label={t("sellerHub.pending")} value={String(pending)} icon={<Inbox className="size-4" />} />
        <Stat label={t("sellerHub.rating")} value={seller.rating.toFixed(1)} icon={<Star className="size-4" />} hint={`${t("common.reviews", { count: seller.reviews })} · ${t("mock.sample")}`} />
        <Stat label={t("sellerHub.nextPayout")} value={formatRWF(revenue)} icon={<Banknote className="size-4" />} hint={t("sellerHub.commission")} />
      </div>
      <section className="card mt-6 p-5" aria-labelledby="drivers-h">
        <h2 id="drivers-h" className="font-semibold">{t("sellerHub.topDrivers")}</h2>
        <ul className="mt-4 space-y-3">
          {drivers.map(({ r, n }) => (
            <li key={r.id} className="flex items-center gap-3 text-sm">
              <Img src={r.image} alt="" fallback={r.emoji} className="size-10 rounded-md" sizes="40px" />
              <span className="flex-1">{loc(r.name, i18n.language)}</span>
              <span className="tabular text-muted">{n}/{r.ingredients.length}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function SellerOrders() {
  const { t, i18n } = useTranslation();
  const sellerId = useSellerView((s) => s.sellerId);
  const { setSellerStatus, confirmWhatsApp } = useOrders();
  const rows = useSellerOrders();

  const nextStep = (o: Order, so: SellerOrder): { to: SellerOrderStatus; key: string } | null => {
    if (o.status !== "confirmed") return null;
    const flow: Record<string, { to: SellerOrderStatus; key: string }> = o.fulfilment === "collection"
      ? { pending: { to: "accepted", key: "sellerHub.accept" }, accepted: { to: "preparing", key: "sellerHub.markPreparing" }, preparing: { to: "ready", key: "sellerHub.markReady" }, ready: { to: "collected", key: "sellerHub.markCollected" } }
      : { pending: { to: "accepted", key: "sellerHub.accept" }, accepted: { to: "preparing", key: "sellerHub.markPreparing" }, preparing: { to: "out_for_delivery", key: "sellerHub.markOut" }, out_for_delivery: { to: "delivered", key: "sellerHub.markDelivered" } };
    return flow[so.status] ?? null;
  };

  return (
    <>
      <PageHeader title={t("sellerHub.orders")}><ViewingAs /></PageHeader>
      {rows.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" />} title={t("sellerHub.noOrders")} />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ order, so }) => {
            const step = nextStep(order, so);
            const waConfirm = order.status === "awaiting_seller_confirmation" && so.status === "pending";
            return (
              <li key={order.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{order.number} {order.channel === "whatsapp" && <Badge tone="success" className="ml-1">WhatsApp</Badge>}</p>
                    <p className="text-xs text-muted">{formatDate(order.createdAt)} · {order.fulfilment === "collection" ? t("cart.collection") : `${order.address}, ${order.district}`}</p>
                  </div>
                  <Badge tone={orderTone(order.status)}>{t(`order.status.${order.status}`)}</Badge>
                  <Badge tone={sellerTone(so.status)}>{t(`order.seller.${so.status}`)}</Badge>
                  <span className="tabular font-semibold">{formatRWF(so.subtotal)}</span>
                </div>
                <p className="mt-3 text-sm text-ink-soft">{so.lines.map((l) => `${l.qty}× ${loc(productById(l.productId)!.name, i18n.language)}`).join(" · ")}</p>
                {order.status === "pending_payment" && <p className="mt-2 text-xs text-muted">{t("sellerHub.waitingPayment")}</p>}
                {(step || waConfirm) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {waConfirm
                      ? <Button size="sm" onClick={() => { confirmWhatsApp(order.id, sellerId); toast(t("sellerHub.confirmWhatsApp")); }}>{t("sellerHub.confirmWhatsApp")}</Button>
                      : step && <Button size="sm" onClick={() => { setSellerStatus(order.id, sellerId, step.to); toast(t(`order.seller.${step.to}`)); }}>{t(step.key)}</Button>}
                    {(so.status === "pending") && (
                      <Button size="sm" variant="ghost" onClick={() => setSellerStatus(order.id, sellerId, "rejected")}>{t("sellerHub.reject")}</Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function SellerOffers() {
  const { t, i18n } = useTranslation();
  const sellerId = useSellerView((s) => s.sellerId);
  const updateOffer = useCatalog((s) => s.updateOffer);
  useCatalog((s) => s.version);
  const mine = products.filter((p) => p.offers.some((o) => o.sellerId === sellerId));
  const [edits, setEdits] = useState<Record<string, { price: number; stock: number }>>({});

  return (
    <>
      <PageHeader title={t("sellerHub.offers")}><ViewingAs /></PageHeader>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-line bg-sunken/50 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">{t("sellerHub.product")}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("common.price")} (RWF)</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("sellerHub.stock")}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("sellerHub.marketRange")}</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">{t("common.save")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {mine.map((p) => {
              const o = p.offers.find((x) => x.sellerId === sellerId)!;
              const e = edits[p.id] ?? { price: o.price, stock: o.stock };
              const dirty = e.price !== o.price || e.stock !== o.stock;
              const invalid = !(e.price > 0) || e.stock < 0 || !Number.isInteger(e.price) || !Number.isInteger(e.stock);
              const name = loc(p.name, i18n.language);
              return (
                <tr key={p.id}>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <Img src={p.image} alt="" fallback={p.emoji} className="size-10 shrink-0 rounded-md" sizes="40px" />
                      <span>{name}<span className="block text-xs text-muted">{loc(p.unit, i18n.language)}</span></span>
                    </span>
                  </th>
                  <td className="px-4 py-3">
                    <input type="number" min={1} step={50} className="field tabular min-h-10 w-28 py-0" value={e.price} aria-label={`${t("common.price")}: ${name}`} aria-invalid={!(e.price > 0) || undefined}
                      onChange={(ev) => setEdits({ ...edits, [p.id]: { ...e, price: Math.round(Number(ev.target.value)) } })} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} className="field tabular min-h-10 w-20 py-0" value={e.stock} aria-label={`${t("sellerHub.stock")}: ${name}`}
                        onChange={(ev) => setEdits({ ...edits, [p.id]: { ...e, stock: Math.round(Number(ev.target.value)) } })} />
                      {e.stock < 10 && <Badge tone="accent"><AlertTriangle className="size-3" aria-hidden />{t("sellerHub.lowStock")}</Badge>}
                    </div>
                  </td>
                  <td className="tabular px-4 py-3 text-muted">{p.category === "meal-kits" ? "—" : formatRange(p.market.min, p.market.max)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant={dirty ? "primary" : "ghost"} disabled={!dirty || invalid}
                      onClick={() => { updateOffer(p.id, sellerId, e); setEdits(({ [p.id]: _, ...rest }) => rest); toast(t("sellerHub.updated")); }}>
                      {t("common.save")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
