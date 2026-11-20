import clsx from "clsx";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/cards";
import { Container } from "@/components/layout";
import { Button, ButtonLink, Dialog, EmptyState, PageHeader } from "@/components/ui";
import { bestOffer, categories, categoryById, products, sellerById, sellers } from "@/data/catalog";
import { loc } from "@/lib/format";
import { useCatalog } from "@/store";

type Sort = "featured" | "asc" | "desc" | "rating";

function Filters({ params, set }: { params: URLSearchParams; set: (k: string, v: string | null) => void }) {
  const { t } = useTranslation();
  const chosen = params.getAll("seller");
  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t("filters.price")}</legend>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="help mt-0 mb-1">{t("filters.min")}</span>
            <input type="number" inputMode="numeric" min={0} step={100} className="field" value={params.get("min") ?? ""} onChange={(e) => set("min", e.target.value || null)} />
          </label>
          <label><span className="help mt-0 mb-1">{t("filters.max")}</span>
            <input type="number" inputMode="numeric" min={0} step={100} className="field" value={params.get("max") ?? ""} onChange={(e) => set("max", e.target.value || null)} />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t("filters.seller")}</legend>
        <div className="space-y-1">
          {sellers.map((s) => (
            <label key={s.id} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox" className="size-4.5 accent-brand-600" checked={chosen.includes(s.id)}
                onChange={(e) => {
                  const next = e.target.checked ? [...chosen, s.id] : chosen.filter((x) => x !== s.id);
                  set("seller", next.join(",") || null);
                }}
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t("filters.availability")}</legend>
        <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" className="size-4.5 accent-brand-600" checked={params.get("stock") === "1"} onChange={(e) => set("stock", e.target.checked ? "1" : null)} />
          {t("filters.inStockOnly")}
        </label>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t("filters.rating")}</legend>
        {[["", t("filters.any")], ["4.5", t("filters.rating45")]].map(([v, label]) => (
          <label key={v} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
            <input type="radio" name="rating" className="size-4.5 accent-brand-600" checked={(params.get("rating") ?? "") === v} onChange={() => set("rating", v || null)} />
            {label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function Shop() {
  const { t, i18n } = useTranslation();
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  useCatalog((s) => s.version); // re-render when seller prices change
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const sort = (params.get("sort") ?? "featured") as Sort;
  const cat = category ? categoryById(category) : undefined;

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (k === "seller") { next.delete("seller"); v?.split(",").forEach((x) => next.append("seller", x)); }
    else if (v === null) next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };
  const sellersSel = params.getAll("seller");
  const min = Number(params.get("min")) || 0;
  const max = Number(params.get("max")) || Infinity;
  const activeCount = ["min", "max", "stock", "rating"].filter((k) => params.get(k)).length + (sellersSel.length ? 1 : 0);

  const list = useMemo(() => {
    let l = products.filter((p) => {
      if (cat && p.category !== cat.id) return false;
      if (q && !Object.values(p.name).some((n) => n.toLowerCase().includes(q))) return false;
      const offers = p.offers.filter((o) =>
        (!sellersSel.length || sellersSel.includes(o.sellerId)) &&
        (params.get("stock") !== "1" || o.stock > 0) &&
        (!params.get("rating") || sellerById(o.sellerId).rating >= Number(params.get("rating"))),
      );
      if (!offers.length) return false;
      const best = Math.min(...offers.map((o) => o.price));
      return best >= min && best <= max;
    });
    const price = (p: (typeof l)[number]) => bestOffer(p).price;
    if (sort === "asc") l = [...l].sort((a, b) => price(a) - price(b));
    if (sort === "desc") l = [...l].sort((a, b) => price(b) - price(a));
    if (sort === "rating") l = [...l].sort((a, b) => sellerById(bestOffer(b).sellerId).rating - sellerById(bestOffer(a).sellerId).rating);
    if (sort === "featured") l = [...l].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return l;
  }, [cat, q, sort, params]);

  const title = cat ? loc(cat.name, i18n.language) : q ? t("shop.searchFor", { q: params.get("q") }) : t("shop.title");

  return (
    <Container>
      <PageHeader title={title} sub={t("shop.sub")} />

      <nav aria-label={t("filters.category")} className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: "", name: null }, ...categories].map((c) => {
          const active = (cat?.id ?? "") === c.id;
          return (
            <Link key={c.id || "all"} to={c.id ? `/shop/${c.id}?${params}` : `/shop?${params}`} aria-current={active ? "page" : undefined}
              className={clsx("inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium", active ? "border-ink bg-ink text-white" : "border-line-strong/40 bg-surface text-ink-soft hover:border-ink/50")}>
              {c.name ? loc(c.name, i18n.language) : t("shop.all")}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label={t("filters.title")}>
          <div className="sticky top-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t("filters.title")}</h2>
              {activeCount > 0 && <button type="button" className="link text-sm" onClick={() => setParams(q ? { q } : {}, { replace: true })}>{t("filters.clear")}</button>}
            </div>
            <Filters params={params} set={set} />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">{t("shop.results", { count: list.length })}</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setSheet(true)}>
                <SlidersHorizontal className="size-4" aria-hidden /> {t("filters.open")}{activeCount > 0 && ` · ${t("filters.active", { count: activeCount })}`}
              </Button>
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="hidden sm:inline">{t("shop.sort")}</span>
                <select value={sort} onChange={(e) => set("sort", e.target.value === "featured" ? null : e.target.value)} className="field min-h-10 w-auto py-0" aria-label={t("shop.sort")}>
                  <option value="featured">{t("shop.sortFeatured")}</option>
                  <option value="asc">{t("shop.sortPriceAsc")}</option>
                  <option value="desc">{t("shop.sortPriceDesc")}</option>
                  <option value="rating">{t("shop.sortRating")}</option>
                </select>
              </label>
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<SearchX className="size-6" />} title={t("shop.empty")} sub={t("shop.emptySub")} action={<ButtonLink to="/shop" variant="secondary">{t("filters.clear")}</ButtonLink>} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title={t("filters.title")} side="bottom">
        <Filters params={params} set={set} />
        <div className="sticky bottom-0 mt-6 flex gap-2 bg-canvas pt-3">
          <Button variant="ghost" className="flex-1" onClick={() => setParams(q ? { q } : {}, { replace: true })}>{t("filters.clear")}</Button>
          <Button className="flex-1" onClick={() => setSheet(false)}>{t("common.showResults", { count: list.length })}</Button>
        </div>
      </Dialog>
    </Container>
  );
}
