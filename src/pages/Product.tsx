import clsx from "clsx";
import { ArrowLeft, Check, MapPin, PackageCheck, Truck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { RecipeCard, VerifiedMark } from "@/components/cards";
import { Container } from "@/components/layout";
import { toast } from "@/components/toast";
import { Badge, Button, FreshnessBadge, Img, MockBadge, Price, Rating, Stepper } from "@/components/ui";
import { bestOffer, categoryById, productById, productBySlug, sellerById } from "@/data/catalog";
import { recipeById, recipes } from "@/data/recipes";
import { formatQty, formatRange, formatRWF, loc } from "@/lib/format";
import { useCart, useCatalog } from "@/store";
import { DISTRICTS } from "@/types";
import NotFound from "./NotFound";

export default function ProductPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  useCatalog((s) => s.version);
  const product = productBySlug(slug ?? "");
  const { add, district, setDistrict } = useCart();
  const [sellerId, setSellerId] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  if (!product) return <NotFound />;

  const cheapest = bestOffer(product);
  const selected = product.offers.find((o) => o.sellerId === (sellerId ?? cheapest.sellerId)) ?? cheapest;
  const cat = categoryById(product.category);
  const kitRecipe = product.kitRecipe ? recipeById(product.kitRecipe) : undefined;
  const usedIn = recipes.filter((r) => r.ingredients.some((i) => i.productId === product.id));
  const name = loc(product.name, lang);

  return (
    <Container>
      <Link to={cat ? `/shop/${cat.id}` : "/shop"} className="mb-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {cat ? loc(cat.name, lang) : t("nav.shop")}
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <Img src={product.image} alt={name} fallback={product.emoji} priority sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-square w-full rounded-card lg:sticky lg:top-24" />

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-muted">{loc(product.unit, lang)}</p>
          {product.description && (
            <section className="mt-4">
              <h2 className="sr-only">{t("product.description")}</h2>
              <p className="text-ink-soft">{loc(product.description, lang)}</p>
            </section>
          )}
          {product.allergens.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
              <span className="text-muted">{t("product.allergens")}:</span>
              {product.allergens.map((a) => <Badge key={a} tone="accent">{t(`allergens.${a}`)}</Badge>)}
            </p>
          )}

          {/* Seller comparison */}
          <section className="mt-8" aria-labelledby="compare">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="compare" className="font-semibold">{t("product.compare")}</h2>
                <p className="text-sm text-muted">{t("product.compareSub")}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted" aria-hidden />
                <span className="sr-only">{t("product.deliverTo")}</span>
                <select className="field min-h-10 w-auto py-0" value={district} onChange={(e) => setDistrict(e.target.value as typeof district)}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            <div className="space-y-2.5" role="radiogroup" aria-labelledby="compare">
              {product.offers.map((o) => {
                const s = sellerById(o.sellerId);
                const active = o.sellerId === selected.sellerId;
                return (
                  <button
                    key={o.sellerId} type="button" role="radio" aria-checked={active} onClick={() => setSellerId(o.sellerId)}
                    className={clsx("flex w-full items-start gap-4 rounded-card border p-4 text-left transition",
                      active ? "border-brand-600 bg-brand-50/60 ring-4 ring-brand-100" : "border-line-strong/30 bg-surface hover:border-ink/40")}
                  >
                    <span className={clsx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", active ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")} aria-hidden>
                      {active && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium">{s.name}</span>
                        {o.sellerId === cheapest.sellerId && product.offers.length > 1 && <Badge tone="brand">{t("product.cheapest")}</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <VerifiedMark verified={s.verified} />
                        <Rating value={s.rating} count={s.reviews} sample />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1"><Truck className="size-3.5" aria-hidden />{t("product.eta", { hours: s.etaHours[district] })} · {formatRWF(s.zoneFees[district])}</span>
                        {s.collection && <span className="inline-flex items-center gap-1"><PackageCheck className="size-3.5" aria-hidden />{t("product.collection")}</span>}
                        <span>{o.stock > 0 ? t("product.stockLeft", { count: o.stock }) : t("common.outOfStock")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Price amount={o.price} compareAt={o.compareAt} className="text-base" />
                      <div className="mt-1"><FreshnessBadge days={o.priceUpdatedDaysAgo} /></div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">{t("mock.fees")} <Link to={`/sellers/${sellerById(selected.sellerId).slug}`} className="link">{sellerById(selected.sellerId).name} →</Link></p>
          </section>

          <div className="mt-6 flex items-center gap-3">
            <Stepper value={qty} onChange={setQty} min={1} max={Math.max(1, selected.stock)} label={t("common.qty")} />
            <Button size="lg" className="flex-1" disabled={selected.stock === 0}
              onClick={() => { add(product.id, selected.sellerId, qty); toast(`${formatQty(qty)} × ${name} · ${t("common.added")}`); }}>
              {t("common.addToCart")} · {formatRWF(selected.price * qty)}
            </Button>
          </div>

          {product.category !== "meal-kits" && (
            <section className="mt-6 rounded-card border border-dashed border-clay-600/40 bg-clay-50 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium">{t("product.marketTitle")}</h2>
                <Badge tone="clay">{t("price.estimate")}</Badge>
              </div>
              <p className="tabular mt-2 text-lg font-semibold">{formatRange(product.market.min, product.market.max)}</p>
              <p className="mt-1 text-xs text-ink-soft">{t("product.marketSub")}</p>
            </section>
          )}

          {kitRecipe && (
            <section className="mt-6">
              <h2 className="mb-3 font-semibold">{t("product.kitContents")}</h2>
              <ul className="divide-y divide-line rounded-card border border-line bg-surface">
                {kitRecipe.ingredients.map((i) => {
                  const p = productById(i.productId)!;
                  return (
                    <li key={i.productId} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <Img src={p.image} alt="" fallback={p.emoji} className="size-9 shrink-0 rounded-md" sizes="36px" />
                      <span className="flex-1">{loc(p.name, lang)}</span>
                      <span className="tabular text-muted">{formatQty(i.qty)} × {loc(p.unit, lang)}</span>
                    </li>
                  );
                })}
              </ul>
              <Link to={`/recipes/${kitRecipe.slug}`} className="link mt-3 inline-block text-sm">{t("product.cookThis")} →</Link>
            </section>
          )}
          <MockBadge className="mt-6" label={t("mock.sampleData")} />
        </div>
      </div>

      {usedIn.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 font-display text-2xl font-semibold">{t("product.usedIn")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {usedIn.slice(0, 4).map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        </section>
      )}
    </Container>
  );
}
