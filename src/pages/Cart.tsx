import { ListChecks, MapPin, MessageCircle, PackageCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { VerifiedMark } from "@/components/cards";
import { Container } from "@/components/layout";
import { Button, ButtonLink, EmptyState, Img, PageHeader, Segmented, Stepper } from "@/components/ui";
import { productById, sellerById } from "@/data/catalog";
import { linePrice } from "@/lib/food";
import { formatRWF, loc } from "@/lib/format";
import { groupBySeller, useAuth, useCart, useCatalog } from "@/store";
import { DISTRICTS, type Fulfilment } from "@/types";

export default function Cart() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  useCatalog((s) => s.version);
  const { lines, setQty, remove, changeSeller, district, setDistrict, fulfilment, setFulfilment } = useCart();
  const user = useAuth((s) => s.user);
  const groups = groupBySeller(lines, district, fulfilment);
  const subtotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const delivery = groups.reduce((s, g) => s + g.deliveryFee, 0);

  if (lines.length === 0) {
    return (
      <Container className="max-w-2xl">
        <PageHeader title={t("cart.title")} />
        <EmptyState icon={<ShoppingBag className="size-6" />} title={t("cart.empty")} sub={t("cart.emptySub")}
          action={<><ButtonLink to="/planner">{t("home.ctaPlan")}</ButtonLink><ButtonLink to="/recipes" variant="secondary">{t("nav.recipes")}</ButtonLink></>} />
      </Container>
    );
  }

  const go = (path: string) => navigate(user ? path : `/login?next=${encodeURIComponent(path)}`);

  return (
    <Container>
      <PageHeader title={t("cart.title")} sub={t("cart.sellersNote", { count: groups.length })} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card flex flex-wrap items-center gap-4 p-4" aria-label={t("cart.fulfilment")}>
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium">{t("cart.fulfilment")}</p>
              <Segmented<Fulfilment> label={t("cart.fulfilment")} value={fulfilment} onChange={setFulfilment}
                options={[{ value: "delivery", label: t("cart.delivery") }, { value: "collection", label: t("cart.collection") }]} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <MapPin className="size-4" aria-hidden /> {t("cart.deliveryTo")}
              <select className="field min-h-10 w-auto py-0" value={district} onChange={(e) => setDistrict(e.target.value as typeof district)}>
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
          </section>

          {groups.map((g) => (
            <section key={g.seller.id} className="card overflow-hidden" aria-labelledby={`g-${g.seller.id}`}>
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-sunken/40 px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`g-${g.seller.id}`} className="font-semibold"><Link to={`/sellers/${g.seller.slug}`} className="hover:underline">{t("cart.fromSeller", { seller: g.seller.name })}</Link></h2>
                  <VerifiedMark verified={g.seller.verified} />
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  {g.collect ? <><PackageCheck className="size-3.5" aria-hidden />{g.seller.collectionPoint} · {t("common.free")}</> : <><Truck className="size-3.5" aria-hidden />{t("product.eta", { hours: g.eta })} · {formatRWF(g.deliveryFee)}</>}
                </span>
              </header>
              {fulfilment === "collection" && !g.collect && <p className="border-b border-line bg-accent-50 px-5 py-2 text-xs text-accent-700">{t("cart.collectionNA", { seller: g.seller.name })}</p>}
              <ul className="divide-y divide-line">
                {g.lines.map((l) => {
                  const p = productById(l.productId)!;
                  const name = loc(p.name, lang);
                  return (
                    <li key={l.productId} className="grid grid-cols-[64px_1fr_auto] items-start gap-x-4 gap-y-2 p-4 sm:grid-cols-[64px_1fr_auto_auto_auto] sm:items-center">
                      <Img src={p.image} alt="" fallback={p.emoji} className="size-16 rounded-lg" sizes="64px" />
                      <div className="min-w-0">
                        <Link to={`/product/${p.slug}`} className="line-clamp-2 font-medium hover:text-brand-700">{name}</Link>
                        <p className="text-xs text-muted">{loc(p.unit, lang)} · {formatRWF(linePrice({ ...l, qty: 1 }))} {t("price.each")}</p>
                        {p.offers.length > 1 && (
                          <label className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                            {t("cart.changeSeller")}
                            <select className="rounded border border-line-strong/40 bg-surface px-1.5 py-1 text-xs" value={l.sellerId}
                              onChange={(e) => changeSeller(l.productId, l.sellerId, e.target.value)}>
                              {p.offers.map((o) => <option key={o.sellerId} value={o.sellerId}>{sellerById(o.sellerId).name} · {formatRWF(o.price)}</option>)}
                            </select>
                          </label>
                        )}
                      </div>
                      <span className="tabular text-right font-semibold sm:order-last sm:w-24">{formatRWF(linePrice(l))}</span>
                      <div className="col-span-2 col-start-2 flex items-center gap-2 sm:col-span-1 sm:col-start-auto">
                        <Stepper value={l.qty} onChange={(q) => setQty(l.productId, l.sellerId, q)} label={name} />
                        <button type="button" onClick={() => remove(l.productId, l.sellerId)} className="grid size-10 place-items-center rounded-full text-muted hover:bg-sunken hover:text-danger" aria-label={`${t("common.remove")} ${name}`}>
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5" aria-labelledby="summary-h">
            <h2 id="summary-h" className="font-semibold">{t("cart.summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{t("common.subtotal")}</dt><dd className="tabular">{formatRWF(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("common.delivery")}</dt><dd className="tabular">{delivery ? formatRWF(delivery) : t("common.free")}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>{t("common.total")}</dt><dd className="tabular">{formatRWF(subtotal + delivery)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">{t("cart.feesNote")} {t("mock.fees")}</p>
            <Button size="lg" className="mt-5 w-full" onClick={() => go("/checkout")}>{t("cart.checkout")}</Button>
            <Button variant="whatsapp" className="mt-2 w-full" onClick={() => go("/checkout?channel=whatsapp")}>
              <MessageCircle className="size-4" aria-hidden /> {t("cart.whatsapp")}
            </Button>
            <ButtonLink to="/market?from=cart" variant="ghost" className="mt-2 w-full"><ListChecks className="size-4" aria-hidden />{t("planner.marketMode")}</ButtonLink>
          </section>
        </aside>
      </div>
    </Container>
  );
}
