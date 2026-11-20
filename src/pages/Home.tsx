import { ArrowRight, Check, ListChecks, MessageCircle, Store } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ChefCard, KitCard, RecipeCard, SellerCard } from "@/components/cards";
import { Container } from "@/components/layout";
import { ButtonLink, Img, MockBadge, SectionHeader } from "@/components/ui";
import { mealKits, productById, sellers } from "@/data/catalog";
import { chefs } from "@/data/chefs";
import { recipeById, recipes } from "@/data/recipes";
import { formatRWF, loc } from "@/lib/format";
import { generatePlan, householdServings } from "@/lib/planner";
import { defaultProfile, useAuth, useHousehold } from "@/store";
import type { HouseholdProfile } from "@/types";

const PRESETS: { key: string; image: string; profile: Partial<HouseholdProfile> }[] = [
  { key: "Student", image: "recipes/beans-rice", profile: { type: "student", adults: 1, children: 0, weeklyBudget: 20000, days: 7, maxCookMinutes: 60, likes: ["budget"] } },
  { key: "Family", image: "recipes/chicken-stew", profile: { type: "family", adults: 2, children: 2, weeklyBudget: 70000, days: 7, maxCookMinutes: 90, likes: ["family", "traditional"] } },
  { key: "Quick", image: "recipes/sambaza-ugali", profile: { type: "professional", adults: 2, children: 0, weeklyBudget: 35000, days: 5, maxCookMinutes: 45, likes: ["quick"] } },
  { key: "Healthy", image: "recipes/pumpkin-dodo", profile: { type: "professional", adults: 2, children: 0, weeklyBudget: 40000, days: 7, maxCookMinutes: 90, vegetarian: true, likes: ["vegetarian"] } },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { saveProfile, setPlan } = useHousehold();
  const days = t("planner.days7", { returnObjects: true }) as string[];

  // Live preview from the real rules engine (fixed seed so it doesn't jump between renders).
  const preview = useMemo(() => generatePlan({ ...defaultProfile, days: 7, slots: ["dinner"] }, 11), []);
  const servings = householdServings(defaultProfile);

  const usePreset = (p: Partial<HouseholdProfile>) => {
    const profile = { ...defaultProfile, ...p };
    if (!user) return navigate("/register?next=/planner/setup");
    saveProfile(profile);
    setPlan(generatePlan(profile).entries);
    navigate("/planner");
  };

  const cookExample = { have: ["p-rice", "p-tomato", "p-onion"], make: recipeById("r-beans-rice")!, buy: ["p-beans"] };

  return (
    <>
      {/* B. Hero */}
      <section className="border-b border-line bg-surface">
        <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
          <div>
            <p className="eyebrow mb-4">{t("home.eyebrow")}</p>
            <h1 className="font-display text-[2rem] leading-[1.1] font-semibold tracking-tight sm:text-5xl">{t("home.title")}</h1>
            <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">{t("home.subtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink to="/planner" size="lg">{t("home.ctaPlan")} <ArrowRight className="size-4" aria-hidden /></ButtonLink>
              <ButtonLink to="/cook" size="lg" variant="secondary">{t("home.ctaCook")}</ButtonLink>
            </div>
            <button type="button" onClick={() => usePreset(PRESETS[0].profile)} className="link mt-4 text-sm">
              {t("home.ctaBudget", { amount: formatRWF(20000) })} →
            </button>
          </div>
          <div className="relative">
            <Img src="hero/market" alt={t("home.heroAlt")} priority sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] w-full rounded-card" />
            {/* Live plan preview overlay */}
            <div className="card absolute -bottom-6 left-4 right-4 p-4 sm:left-auto sm:right-6 sm:w-72">
              <p className="text-xs font-semibold text-muted">{t("home.planFamilyD")}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {preview.entries.slice(0, 3).map((e) => (
                  <li key={e.day} className="flex justify-between gap-2">
                    <span className="truncate"><span className="text-muted">{days[e.day].slice(0, 3)} · </span>{loc(recipeById(e.recipeId)!.name, lang)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-sm">
                <span className="text-muted">{t("planner.planned")}</span>
                <span className="tabular font-semibold">≈ {formatRWF(preview.total)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">{t("planner.servingsNote", { count: servings })} · {t("mock.sampleData")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* C. How it works */}
      <Container className="pt-14 sm:pt-16">
        <SectionHeader title={t("home.howTitle")} sub={t("home.howSub")} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="card p-5">
              <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white" aria-hidden>{n}</span>
              <h3 className="mt-4 font-semibold">{t(`home.how${n}`)}</h3>
              <p className="mt-1.5 text-sm text-muted">{t(`home.how${n}d`)}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* D. Popular meal plans */}
      <Container className="pt-4 sm:pt-6">
        <SectionHeader title={t("home.plansTitle")} sub={t("home.plansSub")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <article key={p.key} className="card flex flex-col overflow-hidden">
              <Img src={p.image} alt="" className="aspect-[16/10] w-full" />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold">{t(`home.plan${p.key}`)}</h3>
                <p className="mt-1 text-sm text-muted">{t(`home.plan${p.key}D`)}</p>
                <button type="button" onClick={() => usePreset(p.profile)} className="link mt-auto pt-4 text-left text-sm">{t("home.usePlan")} →</button>
              </div>
            </article>
          ))}
        </div>
      </Container>

      {/* E. Cook with what I have */}
      <section className="mt-6 bg-brand-900 py-14 text-white sm:py-16">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("home.cookTitle")}</h2>
            <p className="mt-3 max-w-lg text-brand-100">{t("home.cookSub")}</p>
            <ButtonLink to="/cook" variant="accent" size="lg" className="mt-6">{t("home.ctaCook")}</ButtonLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-3" aria-label={t("home.cookTitle")}>
            {[
              { label: t("home.cookExampleHave"), items: cookExample.have.map((id) => loc(productById(id)!.name, lang)) },
              { label: t("home.cookExampleMake"), items: [loc(cookExample.make.name, lang)] },
              { label: t("home.cookExampleBuy"), items: cookExample.buy.map((id) => loc(productById(id)!.name, lang)) },
            ].map((col, i) => (
              <div key={col.label} className="rounded-card bg-white/8 p-4 ring-1 ring-white/15">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">{i + 1}. {col.label}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {col.items.map((x) => <li key={x} className="flex items-center gap-2"><Check className="size-3.5 text-accent-500" aria-hidden />{x}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* F. Popular recipes */}
      <Container className="pt-14 sm:pt-16">
        <SectionHeader title={t("home.recipesTitle")} action={<Link to="/recipes" className="link text-sm">{t("common.viewAll")}</Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...recipes].sort((a, b) => b.rating - a.rating).slice(0, 4).map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      </Container>

      {/* G. Meal kits */}
      <Container className="pt-4 sm:pt-6">
        <SectionHeader title={t("home.kitsTitle")} sub={t("home.kitsSub")} action={<Link to="/kits" className="link text-sm">{t("common.viewAll")}</Link>} />
        <div className="grid gap-4 lg:grid-cols-3">
          {mealKits.map((k) => <KitCard key={k.id} kit={k} />)}
        </div>
      </Container>

      {/* Three ways to buy + H. sellers */}
      <section className="mt-6 border-y border-line bg-surface py-14 sm:py-16">
        <div className="container-page">
          <SectionHeader title={t("home.buyTitle")} sub={t("home.buySub")} />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ListChecks, key: "market", to: "/market" },
              { icon: Store, key: "sellers", to: "/shop" },
              { icon: MessageCircle, key: "whatsapp", to: "/cart" },
            ].map(({ icon: Icon, key, to }) => (
              <Link key={key} to={to} className="rounded-card border border-line p-5 transition hover:border-ink/30">
                <Icon className="size-6 text-brand-600" aria-hidden />
                <h3 className="mt-3 font-semibold">{t(`buy.${key}`)}</h3>
                <p className="mt-1 text-sm text-muted">{t(`buy.${key}D`)}</p>
              </Link>
            ))}
          </div>

          <div className="mt-14">
            <SectionHeader title={t("home.sellersTitle")} sub={t("home.sellersSub")} action={<MockBadge label={t("mock.sampleData")} />} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sellers.map((s) => <SellerCard key={s.id} seller={s} />)}
            </div>
          </div>
        </div>
      </section>

      {/* I. Chefs */}
      <Container className="pt-14 sm:pt-16">
        <SectionHeader title={t("home.chefsTitle")} sub={t("home.chefsSub")} action={<Link to="/chefs" className="link text-sm">{t("common.viewAll")}</Link>} />
        <div className="grid gap-4 sm:grid-cols-3">
          {chefs.map((c) => <ChefCard key={c.id} chef={c} recipeCount={recipes.filter((r) => r.chefId === c.id).length} />)}
        </div>
      </Container>

      {/* J. Community feedback — clearly labelled as sample */}
      <Container className="pt-4 sm:pt-6">
        <SectionHeader title={t("home.communityTitle")} sub={t("home.communitySub")} action={<MockBadge label={t("mock.sampleData")} />} />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <figure key={n} className="card p-5">
              <blockquote className="text-ink-soft">“{t(`home.quote${n}`)}”</blockquote>
              <figcaption className="mt-3 text-sm text-muted">— {t(`home.quote${n}by`)}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </>
  );
}
