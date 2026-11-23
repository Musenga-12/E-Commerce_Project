import clsx from "clsx";
import { Check, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { Badge, Button, ButtonLink, EmptyState, Img, PageHeader, Segmented } from "@/components/ui";
import { markets, productById } from "@/data/catalog";
import { planNeeds, shoppingList } from "@/lib/food";
import { formatRange, formatRWF, loc } from "@/lib/format";
import { householdServings } from "@/lib/planner";
import { useCart, useHousehold } from "@/store";
import type { MarketSection } from "@/types";

const SECTION_ORDER: MarketSection[] = ["produce", "grains", "butchery", "dairy", "groceries"];
const round50 = (n: number) => Math.round(n / 50) * 50;

function MarketInner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [params] = useSearchParams();
  const { plan, profile, pantry } = useHousehold();
  const cartLines = useCart((s) => s.lines);
  const [source, setSource] = useState<"plan" | "cart">(params.get("from") === "cart" || plan.length === 0 ? "cart" : "plan");
  const [marketId, setMarketId] = useState<string>(markets[0].id);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const factor = markets.find((m) => m.id === marketId)!.factor;

  const items = useMemo(() => {
    const raw = source === "plan"
      ? shoppingList(planNeeds(plan, householdServings(profile)), profile.usePantry ? pantry : []).map((l) => ({ productId: l.productId, qty: l.toBuy }))
      : cartLines.map((l) => ({ productId: l.productId, qty: l.qty }));
    return raw
      .filter((i) => i.qty > 0 && productById(i.productId)?.category !== "meal-kits")
      .map((i) => {
        const p = productById(i.productId)!;
        return { ...i, p, min: round50(p.market.min * factor) * i.qty, max: round50(p.market.max * factor) * i.qty };
      });
  }, [source, plan, profile, pantry, cartLines, factor]);

  const totalMin = items.reduce((s, i) => s + i.min, 0);
  const totalMax = items.reduce((s, i) => s + i.max, 0);
  const done = items.filter((i) => checked.has(i.productId));
  const spentMin = done.reduce((s, i) => s + i.min, 0);
  const spentMax = done.reduce((s, i) => s + i.max, 0);
  const toggle = (id: string) => setChecked((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <Container>
      <PageHeader title={t("market.title")} sub={t("market.subtitle")} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted" id="src-label">{t("market.source")}</span>
        <Segmented label={t("market.source")} value={source} onChange={(v) => { setSource(v); setChecked(new Set()); }}
          options={[{ value: "plan", label: t("market.sourcePlan") }, { value: "cart", label: t("market.sourceCart") }]} />
        <label className="flex items-center gap-2 text-sm text-muted sm:ml-auto">
          {t("market.market")}
          <select className="field min-h-10 w-auto py-0" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-6" />} title={t("market.empty")} action={<ButtonLink to="/planner">{t("home.ctaPlan")}</ButtonLink>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {SECTION_ORDER.map((section) => {
              const rows = items.filter((i) => i.p.section === section);
              if (!rows.length) return null;
              return (
                <section key={section} className="card overflow-hidden" aria-labelledby={`sec-${section}`}>
                  <h2 id={`sec-${section}`} className="border-b border-line bg-sunken/50 px-5 py-3 text-sm font-semibold">{t(`market.sections.${section}`)}</h2>
                  <ul className="divide-y divide-line">
                    {rows.map((i) => {
                      const isDone = checked.has(i.productId);
                      return (
                        <li key={i.productId}>
                          <label className="flex min-h-16 cursor-pointer items-center gap-4 px-5 py-3 hover:bg-sunken/30">
                            <input type="checkbox" className="peer sr-only" checked={isDone} onChange={() => toggle(i.productId)} />
                            <span className={clsx("grid size-6 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100", isDone ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")} aria-hidden>
                              {isDone && <Check className="size-3.5" strokeWidth={3} />}
                            </span>
                            <Img src={i.p.image} alt="" fallback={i.p.emoji} className="hidden size-10 shrink-0 rounded-md sm:block" sizes="40px" />
                            <span className={clsx("min-w-0 flex-1", isDone && "text-muted line-through")}>
                              <span className="block truncate font-medium">{loc(i.p.name, lang)}</span>
                              <span className="text-xs text-muted">{i.qty} × {loc(i.p.unit, lang)}</span>
                            </span>
                            <span className="text-right">
                              <span className="tabular block text-sm font-semibold">{formatRange(i.min, i.max)}</span>
                              <Badge tone="clay" className="mt-1">
                                {t("price.estimate")} · {i.p.market.updatedDaysAgo === 0 ? t("price.today") : t("price.daysAgo", { count: i.p.market.updatedDaysAgo })}
                              </Badge>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <p className="text-sm text-muted">{t("market.estimate")}</p>
              <p className="tabular mt-1 text-2xl font-semibold">{formatRange(totalMin, totalMax)}</p>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm text-muted" aria-live="polite">{t("market.checked", { done: done.length, total: items.length })}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(done.length / items.length) * 100}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted">{t("market.spent")}</p>
                <p className="tabular font-semibold">{done.length ? formatRange(spentMin, spentMax) : formatRWF(0)}</p>
              </div>
              {done.length > 0 && <Button variant="ghost" size="sm" className="mt-3" onClick={() => setChecked(new Set())}>{t("market.reset")}</Button>}
            </div>
            <p className="mt-3 text-xs text-muted">{t("market.priceNote")}</p>
          </aside>
        </div>
      )}
    </Container>
  );
}

export default function Market() {
  return <AuthGate feature="market"><MarketInner /></AuthGate>;
}
