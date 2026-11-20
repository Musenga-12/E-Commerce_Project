import { Camera, ChefHat, Leaf, Package, Plus, ShoppingBasket, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { toast } from "@/components/toast";
import { Badge, Button, EmptyState, Img, PageHeader } from "@/components/ui";
import { groceryProducts, productById } from "@/data/catalog";
import { recipes } from "@/data/recipes";
import { assignSellers, purchaseCost, recipeAllergens } from "@/lib/food";
import { formatRWF, loc } from "@/lib/format";
import { householdServings } from "@/lib/planner";
import { useCart, useHousehold } from "@/store";

// Staples nearly every kitchen has — never counted as "missing" (stated in the UI).
const STAPLES = new Set(["p-salt", "p-oil"]);
const COMMON = ["p-rice", "p-beans", "p-tomato", "p-onion", "p-potato", "p-eggs", "p-maize-flour", "p-cabbage", "p-matoke", "p-avocado"];

function CookInner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { pantry, profile } = useHousehold();
  const addMany = useCart((s) => s.addMany);
  const [have, setHave] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const servings = householdServings(profile);
  const query = q.trim().toLowerCase();

  const suggestions = query
    ? groceryProducts.filter((p) => !have.includes(p.id) && !STAPLES.has(p.id) && Object.values(p.name).some((n) => n.toLowerCase().includes(query))).slice(0, 6)
    : [];
  const add = (id: string) => { setHave((h) => (h.includes(id) ? h : [...h, id])); setQ(""); };
  const remove = (id: string) => setHave((h) => h.filter((x) => x !== id));

  const ranked = useMemo(
    () =>
      recipes
        .filter((r) => !recipeAllergens(r).some((a) => profile.allergies.includes(a)) && (!profile.vegetarian || r.tags.includes("vegetarian")))
        .map((r) => {
          const f = servings / r.servings;
          const required = r.ingredients.filter((i) => !STAPLES.has(i.productId));
          const missing = required.filter((i) => !have.includes(i.productId)).map((i) => ({ productId: i.productId, qty: Math.ceil(i.qty * f - 1e-9) }));
          const all = required.map((i) => ({ productId: i.productId, qty: Math.ceil(i.qty * f - 1e-9) }));
          return { r, missing, haveCount: required.length - missing.length, total: required.length, missingCost: purchaseCost(missing), fullCost: purchaseCost(all) };
        })
        .filter((x) => x.haveCount > 0)
        .sort((a, b) => b.haveCount / b.total - a.haveCount / a.total || a.missingCost - b.missingCost),
    [have, profile.allergies, profile.vegetarian, servings],
  );

  const buyMissing = (missing: { productId: string; qty: number }[]) => {
    const lines = assignSellers(missing, "cheapest");
    addMany(lines);
    toast(t("planner.addedToCart", { count: lines.reduce((n, l) => n + l.qty, 0) }));
  };

  return (
    <Container>
      <PageHeader title={t("cook.title")} sub={t("cook.subtitle")} />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <section className="card h-fit p-5 lg:sticky lg:top-24" aria-labelledby="kitchen-h">
          <div className="relative">
            <label className="label" htmlFor="ing-search">{t("cook.searchLabel")}</label>
            <input
              id="ing-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cook.searchPh")} className="field"
              role="combobox" aria-expanded={suggestions.length > 0} aria-controls="ing-list" aria-autocomplete="list"
              onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); add(suggestions[0].id); } }}
            />
            {query && (
              <ul id="ing-list" role="listbox" className="absolute inset-x-0 z-10 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-soft">
                {suggestions.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-muted">{t("cook.noMatch", { q })}</li>
                ) : suggestions.map((p) => (
                  <li key={p.id} role="option" aria-selected={false}>
                    <button type="button" onClick={() => add(p.id)} className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm hover:bg-sunken">
                      <Img src={p.image} alt="" fallback={p.emoji} className="size-8 rounded" sizes="32px" />{loc(p.name, lang)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h2 id="kitchen-h" className="mt-6 text-sm font-semibold">{t("cook.yourIngredients")}</h2>
          {have.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("cook.none")}</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {have.map((id) => {
                const p = productById(id)!;
                return (
                  <li key={id} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-600 pl-3.5 pr-1 text-sm font-medium text-white">
                    {loc(p.name, lang)}
                    <button type="button" onClick={() => remove(id)} className="grid size-8 place-items-center rounded-full hover:bg-white/20" aria-label={`${t("common.remove")} ${loc(p.name, lang)}`}>
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">{t("cook.staples")}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={pantry.length === 0} onClick={() => setHave((h) => [...new Set([...h, ...pantry.map((p) => p.productId).filter((id) => !STAPLES.has(id))])])}>
              <Package className="size-4" aria-hidden />{t("cook.usePantry")}
            </Button>
            {have.length > 0 && <Button size="sm" variant="ghost" onClick={() => setHave([])}>{t("cook.clear")}</Button>}
          </div>

          <h2 className="mt-6 text-sm font-semibold">{t("cook.common")}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMMON.filter((id) => !have.includes(id)).map((id) => (
              <button key={id} type="button" onClick={() => add(id)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line-strong/30 px-3 text-xs font-medium hover:border-ink/50">
                <Plus className="size-3" aria-hidden />{loc(productById(id)!.name, lang)}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-dashed border-line-strong/40 p-3 text-xs text-muted">
            <Camera className="size-4 shrink-0" aria-hidden />
            <p><span className="font-semibold text-ink-soft">{t("cook.photoTitle")}</span> — {t("cook.photoSoon")}</p>
          </div>
        </section>

        <section aria-live="polite">
          {ranked.length === 0 ? (
            <EmptyState icon={<ChefHat className="size-6" />} title={t("cook.empty")} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {ranked.map(({ r, missing, haveCount, total, missingCost, fullCost }) => {
                const ready = missing.length === 0;
                return (
                  <li key={r.id} className="card flex flex-col overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <Img src={r.image} alt="" fallback={r.emoji} className="size-24 shrink-0 rounded-lg" sizes="96px" />
                      <div className="min-w-0 flex-1">
                        <Badge tone={ready ? "success" : "neutral"}>{ready ? t("cook.readyNow") : t("cook.match", { have: haveCount, total })}</Badge>
                        <h3 className="mt-1.5 font-display text-lg leading-snug font-semibold">
                          <Link to={`/recipes/${r.slug}`} className="hover:text-brand-700">{loc(r.name, lang)}</Link>
                        </h3>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${(haveCount / total) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    {!ready && (
                      <div className="mt-auto space-y-3 border-t border-line bg-sunken/40 px-4 py-3">
                        <p className="text-xs text-ink-soft">{t("cook.missing", { list: missing.map((m) => loc(productById(m.productId)!.name, lang)).join(", ") })}</p>
                        <p className="flex items-center gap-1.5 text-xs text-brand-700"><Leaf className="size-3.5" aria-hidden />{t("cook.savings", { amount: formatRWF(fullCost - missingCost) })}</p>
                        <Button size="sm" onClick={() => buyMissing(missing)} className="w-full sm:w-auto">
                          <ShoppingBasket className="size-4" aria-hidden />{t("cook.buyMissing", { amount: formatRWF(missingCost) })}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}

export default function Cook() {
  return <AuthGate feature="cook"><CookInner /></AuthGate>;
}
