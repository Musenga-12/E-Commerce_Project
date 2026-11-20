import clsx from "clsx";
import { AlertTriangle, ArrowLeft, ArrowRight, Info, ListChecks, MessageCircle, Pencil, RefreshCw, Repeat2, Settings2, ShoppingBasket, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { toast } from "@/components/toast";
import { Button, ButtonLink, Chip, EmptyState, Field, Img, MockBadge, PageHeader, Segmented, Stepper } from "@/components/ui";
import { productById } from "@/data/catalog";
import { recipeById } from "@/data/recipes";
import { parseRequest } from "@/lib/assistant";
import { assignSellers, linePrice, planNeeds, recipeCost, shoppingList, totalMinutes } from "@/lib/food";
import { formatRWF, loc } from "@/lib/format";
import { generatePlan, householdServings, planBudget, planTotal, swapRecipe } from "@/lib/planner";
import { useCart, useHousehold } from "@/store";
import {
  ALLERGENS, RECIPE_TAGS, type AssignStrategy, type HouseholdProfile, type HouseholdType, type MealSlot,
} from "@/types";

const TYPES: HouseholdType[] = ["student", "professional", "family", "shared"];
const TYPE_DEFAULTS: Record<HouseholdType, Partial<HouseholdProfile>> = {
  student: { adults: 1, children: 0, weeklyBudget: 20000, likes: ["budget", "quick"] },
  professional: { adults: 1, children: 0, weeklyBudget: 30000, maxCookMinutes: 45, likes: ["quick"] },
  family: { adults: 2, children: 2, weeklyBudget: 70000, likes: ["family", "traditional"] },
  shared: { adults: 3, children: 0, weeklyBudget: 50000, likes: ["budget"] },
};

/* ------------------------------------------------------------------ */
/* Guided setup                                                        */
/* ------------------------------------------------------------------ */

function SetupInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, saveProfile, setPlan, pantry } = useHousehold();
  const [p, setP] = useState<HouseholdProfile>(profile);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const labels = t("planner.stepLabels", { returnObjects: true }) as string[];
  const total = labels.length;
  const set = <K extends keyof HouseholdProfile>(k: K, v: HouseholdProfile[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const budgetError = p.weeklyBudget < 5000 || p.weeklyBudget > 500000 ? t("planner.budgetError") : null;
  const mealsError = p.slots.length === 0 ? t("planner.mealsError") : null;
  const stepError = step === 1 ? budgetError : step === 2 ? mealsError : null;

  const next = () => {
    if (stepError) return setShowErrors(true);
    setShowErrors(false);
    setStep((s) => s + 1);
  };
  const finish = () => {
    saveProfile(p);
    setPlan(generatePlan(p).entries);
    navigate("/planner");
  };

  return (
    <Container className="max-w-2xl">
      <nav aria-label={t("planner.setupTitle")}>
        <p className="eyebrow">{t("planner.step", { n: step + 1, total })} · {labels[step]}</p>
        <ol className="mt-3 flex gap-1.5">
          {labels.map((l, i) => (
            <li key={l} className="flex-1" aria-current={i === step ? "step" : undefined}>
              <span className={clsx("block h-1.5 rounded-full", i <= step ? "bg-brand-600" : "bg-line")} aria-hidden />
              <span className="sr-only">{l}</span>
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">{t("planner.setupTitle")}</h1>
      <p className="mt-2 text-muted">{t("planner.setupSub")}</p>

      <form className="card mt-8 p-5 sm:p-8" onSubmit={(e) => { e.preventDefault(); step < total - 1 ? next() : finish(); }} noValidate>
        {step === 0 && (
          <div className="space-y-6">
            <fieldset>
              <legend className="text-lg font-semibold">{t("planner.householdType")}</legend>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {TYPES.map((ty) => (
                  <label key={ty} className={clsx("flex min-h-12 cursor-pointer items-center gap-3 rounded-card border p-3.5 text-sm font-medium transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
                    p.type === ty ? "border-brand-600 bg-brand-50" : "border-line-strong/30 hover:border-ink/40")}>
                    <input type="radio" name="htype" className="size-4.5 accent-brand-600" checked={p.type === ty}
                      onChange={() => setP((x) => ({ ...x, type: ty, ...TYPE_DEFAULTS[ty] }))} />
                    {t(`planner.types.${ty}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-3">
              {(["adults", "children"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-card bg-sunken/60 p-4">
                  <span className="font-medium">{t(`planner.${k}`)}</span>
                  <Stepper value={p[k]} onChange={(v) => set(k, v)} min={k === "adults" ? 1 : 0} max={12} label={t(`planner.${k}`)} />
                </div>
              ))}
              <p className="text-sm text-muted">{t("planner.portion", { count: householdServings(p) })}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <Field label={t("planner.budget")} help={t("planner.budgetHelp")} error={showErrors ? budgetError : null}>
            {(a) => (
              <div>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">RWF</span>
                  <input {...a} type="number" inputMode="numeric" min={5000} max={500000} step={500} value={p.weeklyBudget}
                    onChange={(e) => set("weeklyBudget", Math.round(Number(e.target.value)))} className="field tabular py-3.5 pl-14 text-2xl font-semibold" />
                </div>
                <input type="range" min={5000} max={200000} step={2500} value={Math.min(200000, p.weeklyBudget)}
                  onChange={(e) => set("weeklyBudget", Number(e.target.value))} className="mt-5 w-full accent-brand-600" aria-label={t("planner.budget")} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[20000, 35000, 50000, 70000, 120000].map((b) => (
                    <Chip key={b} active={p.weeklyBudget === b} onClick={() => set("weeklyBudget", b)}>{formatRWF(b)}</Chip>
                  ))}
                </div>
              </div>
            )}
          </Field>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <fieldset>
              <legend className="font-semibold">{t("planner.time")}</legend>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((m) => (
                  <label key={m} className={clsx("cursor-pointer rounded-card border p-3 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100", p.maxCookMinutes === m ? "border-brand-600 bg-brand-50" : "border-line-strong/30 hover:border-ink/40")}>
                    <input type="radio" name="time" className="sr-only" checked={p.maxCookMinutes === m} onChange={() => set("maxCookMinutes", m)} />
                    <span className="tabular block text-xl font-semibold">{m}</span>
                    <span className="text-xs text-muted">{t("common.min")}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="font-semibold">{t("planner.days")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {[3, 5, 7].map((d) => <Chip key={d} active={p.days === d} onClick={() => set("days", d)}>{d}</Chip>)}
              </div>
            </fieldset>
            <fieldset aria-describedby={showErrors && mealsError ? "meals-err" : undefined}>
              <legend className="font-semibold">{t("planner.meals")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["lunch", "dinner"] as MealSlot[]).map((s) => <Chip key={s} active={p.slots.includes(s)} onClick={() => set("slots", toggle(p.slots, s))}>{t(`planner.${s}`)}</Chip>)}
              </div>
              {showErrors && mealsError && <span id="meals-err" className="error-text" role="alert">{mealsError}</span>}
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-7">
            <fieldset>
              <legend className="font-semibold">{t("planner.likes")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {RECIPE_TAGS.filter((x) => x !== "vegetarian").map((tag) => <Chip key={tag} active={p.likes.includes(tag)} onClick={() => set("likes", toggle(p.likes, tag))}>{t(`recipes.tags.${tag}`)}</Chip>)}
              </div>
            </fieldset>
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-card bg-sunken/60 p-4">
              <span className="font-medium">{t("planner.vegetarian")}</span>
              <input type="checkbox" checked={p.vegetarian} onChange={(e) => set("vegetarian", e.target.checked)} className="size-5 accent-brand-600" />
            </label>
            <fieldset>
              <legend className="font-semibold">{t("planner.allergies")}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALLERGENS.map((a) => <Chip key={a} active={p.allergies.includes(a)} onClick={() => set("allergies", toggle(p.allergies, a))}>{t(`allergens.${a}`)}</Chip>)}
              </div>
            </fieldset>
          </div>
        )}

        {step === 4 && (
          <fieldset>
            <legend className="text-lg font-semibold">{t("planner.kitchen")}</legend>
            <p className="help">{t("planner.kitchenHelp")}</p>
            <label className="mt-5 flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-card bg-sunken/60 p-4">
              <span>
                <span className="block font-medium">{t("planner.usePantry")}</span>
                <span className="text-sm text-muted">{t("planner.pantryCount", { count: pantry.length })}</span>
              </span>
              <input type="checkbox" checked={p.usePantry} onChange={(e) => set("usePantry", e.target.checked)} className="size-5 accent-brand-600" />
            </label>
            <Link to="/pantry" className="link mt-4 inline-block text-sm">{t("planner.editPantry")} →</Link>
          </fieldset>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold">{t("planner.review")}</h2>
            <dl className="mt-4 divide-y divide-line rounded-card border border-line">
              {[
                { s: 0, k: t("planner.householdType"), v: `${t(`planner.types.${p.type}`)} · ${t("planner.adults")} ${p.adults} · ${t("planner.children")} ${p.children}` },
                { s: 1, k: t("planner.budget"), v: formatRWF(p.weeklyBudget) },
                { s: 2, k: t("planner.days"), v: `${p.days} · ${p.slots.map((x) => t(`planner.${x}`)).join(", ")} · ≤ ${t("common.minutes", { count: p.maxCookMinutes })}` },
                { s: 3, k: t("planner.diet"), v: [p.vegetarian && t("planner.vegetarian"), ...p.likes.map((x) => t(`recipes.tags.${x}`))].filter(Boolean).join(", ") || "—" },
                { s: 3, k: t("planner.allergies"), v: p.allergies.map((a) => t(`allergens.${a}`)).join(", ") || "—" },
                { s: 4, k: t("planner.kitchen"), v: p.usePantry ? t("planner.pantryCount", { count: pantry.length }) : t("common.no") },
              ].map((row) => (
                <div key={row.k} className="flex items-start justify-between gap-3 p-3.5 text-sm">
                  <div>
                    <dt className="text-muted">{row.k}</dt>
                    <dd className="mt-0.5 font-medium">{row.v}</dd>
                  </div>
                  <button type="button" onClick={() => setStep(row.s)} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                    <Pencil className="size-3.5" aria-hidden />{t("common.edit")}<span className="sr-only"> {row.k}</span>
                  </button>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-10 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}><ArrowLeft className="size-4" aria-hidden />{t("common.back")}</Button>
          {step < total - 1 ? (
            <Button type="submit">{t("common.continue")}<ArrowRight className="size-4" aria-hidden /></Button>
          ) : (
            <Button type="submit"><Sparkles className="size-4" aria-hidden />{t("planner.generate")}</Button>
          )}
        </div>
      </form>
    </Container>
  );
}

export function PlannerSetup() {
  return <AuthGate feature="planner"><SetupInner /></AuthGate>;
}

/* ------------------------------------------------------------------ */
/* Plan results                                                        */
/* ------------------------------------------------------------------ */

function PlanInner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { profile, onboarded, plan, setPlan, pantry, saveProfile } = useHousehold();
  const addMany = useCart((s) => s.addMany);
  const [strategy, setStrategy] = useState<AssignStrategy>("cheapest");
  const [ask, setAsk] = useState("");
  const days = t("planner.days7", { returnObjects: true }) as string[];
  const servings = householdServings(profile);
  const budget = planBudget(profile);

  useEffect(() => {
    if (onboarded && plan.length === 0) setPlan(generatePlan(profile).entries);
  }, [onboarded, plan.length, profile, setPlan]);

  const list = useMemo(
    () => shoppingList(planNeeds(plan, servings), profile.usePantry ? pantry : []).filter((l) => l.toBuy > 0),
    [plan, servings, pantry, profile.usePantry],
  );
  const lines = useMemo(() => assignSellers(list.map((l) => ({ productId: l.productId, qty: l.toBuy })), strategy), [list, strategy]);
  const shopTotal = lines.reduce((s, l) => s + linePrice(l), 0);
  const sellerCount = new Set(lines.map((l) => l.sellerId)).size;
  const mealsTotal = planTotal(plan, servings);
  const remaining = budget - mealsTotal;
  const pct = Math.min(100, (mealsTotal / Math.max(1, budget)) * 100);
  const unique = new Set(plan.map((e) => e.recipeId)).size;

  if (!onboarded) return <SetupInner />;

  const applyAsk = (e: FormEvent) => {
    e.preventDefault();
    if (!ask.trim()) return;
    const next = parseRequest(ask, profile);
    saveProfile(next);
    setPlan(generatePlan(next).entries);
    setAsk("");
    toast(t("planner.assistantUpdated"));
  };

  const planDays = [...new Set(plan.map((e) => e.day))];

  return (
    <Container>
      <PageHeader
        title={t("planner.title")}
        sub={`${t(`planner.types.${profile.type}`)} · ${t("planner.servingsNote", { count: servings })} · ${t("planner.budgetFor", { days: profile.days, amount: formatRWF(budget) })}`}
      >
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/planner/setup" variant="secondary" size="sm"><Settings2 className="size-4" aria-hidden />{t("planner.editProfile")}</ButtonLink>
          <Button size="sm" variant="secondary" onClick={() => setPlan(generatePlan(profile).entries)}><RefreshCw className="size-4" aria-hidden />{t("planner.regenerate")}</Button>
        </div>
      </PageHeader>

      {/* Budget panel — always visible near the top */}
      <section aria-labelledby="budget-h" className="card mb-6 grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 id="budget-h" className="sr-only">{t("planner.budgetPanel")}</h2>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <p><span className="block text-xs text-muted">{t("planner.planned")}</span><span className="tabular text-2xl font-semibold">≈ {formatRWF(mealsTotal)}</span></p>
            <p><span className="block text-xs text-muted">{remaining >= 0 ? t("planner.remaining") : t("planner.over")}</span>
              <span className={clsx("tabular text-2xl font-semibold", remaining >= 0 ? "text-brand-700" : "text-danger")}>{formatRWF(Math.abs(remaining))}</span></p>
            <p><span className="block text-xs text-muted">{t("planner.budgetPanel")}</span><span className="tabular text-lg font-medium text-ink-soft">{formatRWF(budget)}</span></p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label={t("planner.budgetPanel")} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className={clsx("h-full rounded-full transition-all", remaining < 0 ? "bg-danger" : "bg-brand-600")} style={{ width: `${pct}%` }} />
          </div>
          {remaining < 0 && <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger"><AlertTriangle className="size-4" aria-hidden />{t("planner.overBy", { amount: formatRWF(-remaining) })}</p>}
        </div>
      </section>

      {/* Assistant (honestly labelled) */}
      <form onSubmit={applyAsk} className="mb-8 rounded-card border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="assistant" className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-brand-600" aria-hidden />{t("planner.assistant")}</label>
          <MockBadge />
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input id="assistant" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={t("planner.assistantHint")} className="field flex-1" aria-describedby="assistant-note" />
          <Button type="submit" variant="secondary">{t("planner.assistantApply")}</Button>
        </div>
        <p id="assistant-note" className="help">{t("mock.assistant")}</p>
      </form>

      {plan.length === 0 ? (
        <EmptyState icon={<Sparkles className="size-6" />} title={t("planner.noRecipes")} sub={t("planner.noRecipesSub")} action={<ButtonLink to="/planner/setup">{t("planner.editProfile")}</ButtonLink>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            {unique < Math.min(4, plan.length) && (
              <p className="mb-4 flex items-start gap-2 rounded-card bg-accent-50 p-3 text-sm text-accent-700" role="status">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />{t("planner.lowVariety", { count: unique })}
              </p>
            )}
            <ol className="space-y-3">
              {planDays.map((day) => (
                <li key={day} className="card p-4">
                  <h3 className="mb-3 text-sm font-semibold">{days[day]}</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {plan.filter((e) => e.day === day).map((entry) => {
                      const r = recipeById(entry.recipeId);
                      if (!r) return null;
                      const name = loc(r.name, lang);
                      return (
                        <li key={entry.slot} className="flex items-center gap-3 rounded-card bg-sunken/50 p-2">
                          <Img src={r.image} alt="" fallback={r.emoji} className="size-16 shrink-0 rounded-lg" sizes="64px" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t(`planner.${entry.slot}`)}</p>
                            <Link to={`/recipes/${r.slug}`} className="line-clamp-1 text-sm font-medium hover:text-brand-700">{name}</Link>
                            <p className="tabular text-xs text-muted">{t("common.minutes", { count: totalMinutes(r) })} · {t("planner.portion", { count: servings })} · ≈ {formatRWF(recipeCost(r, servings))}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPlan(plan.map((e) => (e === entry ? { ...e, recipeId: swapRecipe(profile, e.recipeId, entry.slot) } : e)))}
                            className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"
                            aria-label={`${t("planner.swap")}: ${name}`}
                          >
                            <Repeat2 className="size-4" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          {/* Shopping panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <section className="card p-5" aria-labelledby="shop-h">
              <h2 id="shop-h" className="font-semibold">{t("planner.shoppingTitle")}</h2>
              <p className="text-sm text-muted">{t("planner.shoppingSub", { count: list.length })}</p>
              <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
                {list.map((l) => {
                  const p = productById(l.productId)!;
                  return (
                    <li key={l.productId} className="flex justify-between gap-2">
                      <span className="truncate">{loc(p.name, lang)}</span>
                      <span className="tabular shrink-0 text-muted">{l.toBuy} × {loc(p.unit, lang)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-sm font-medium">{t("planner.strategy")}</p>
                <Segmented label={t("planner.strategy")} value={strategy} onChange={setStrategy}
                  options={(["cheapest", "fewest"] as const).map((v) => ({ value: v, label: t(`planner.strategies.${v}`) }))} />
                <p className="mt-3 text-xs text-muted">{t("shop.sellers", { count: sellerCount })}</p>
              </div>
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-sunken/70 p-2.5 text-xs text-ink-soft"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />{t("planner.leftoverNote")}</p>
              <div className="mt-4 grid gap-2">
                <Button size="lg" disabled={lines.length === 0}
                  onClick={() => { addMany(lines); toast(t("planner.addedToCart", { count: lines.reduce((n, l) => n + l.qty, 0) })); navigate("/cart"); }}>
                  <ShoppingBasket className="size-4" aria-hidden /> {t("planner.buyEverything")} · {formatRWF(shopTotal)}
                </Button>
                <ButtonLink to="/market?from=plan" variant="secondary"><ListChecks className="size-4" aria-hidden />{t("planner.marketMode")}</ButtonLink>
                <Button variant="ghost" disabled={lines.length === 0}
                  onClick={() => { addMany(lines); navigate("/checkout?channel=whatsapp"); }}>
                  <MessageCircle className="size-4" aria-hidden />{t("planner.whatsapp")}
                </Button>
              </div>
            </section>
          </aside>
        </div>
      )}
    </Container>
  );
}

export default function Planner() {
  return <AuthGate feature="planner"><PlanInner /></AuthGate>;
}
