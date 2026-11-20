import { AlertTriangle, ArrowLeft, ArrowRightLeft, Clock, Flame, Gauge, ShoppingBasket } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { VerifiedMark } from "@/components/cards";
import { Container } from "@/components/layout";
import { toast } from "@/components/toast";
import { Avatar, Badge, Button, FavoriteButton, Img, Rating, Stepper } from "@/components/ui";
import { bestOffer, mealKits, productById } from "@/data/catalog";
import { chefById } from "@/data/chefs";
import { recipeBySlug } from "@/data/recipes";
import { assignSellers, recipeAllergens, recipeCost, recipeNeeds, shoppingList } from "@/lib/food";
import { formatQty, formatRWF, loc } from "@/lib/format";
import { useAuth, useCart, useCatalog, useHousehold } from "@/store";
import NotFound from "./NotFound";

export default function RecipePage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  useCatalog((s) => s.version);
  const recipe = recipeBySlug(slug ?? "");
  const user = useAuth((s) => s.user);
  const { pantry, profile, favorites, toggleFavorite } = useHousehold();
  const addMany = useCart((s) => s.addMany);
  const [servings, setServings] = useState(recipe?.servings ?? 4);
  if (!recipe) return <NotFound />;

  const name = loc(recipe.name, lang);
  const chef = chefById(recipe.chefId);
  const list = shoppingList(recipeNeeds(recipe, servings), user ? pantry : []);
  const missing = list.filter((l) => l.toBuy > 0);
  const cost = recipeCost(recipe, servings);
  const conflicts = user ? recipeAllergens(recipe).filter((a) => profile.allergies.includes(a)) : [];
  const kit = mealKits.find((k) => k.kitRecipe === recipe.id);
  const saved = favorites.includes(recipe.id);

  const addToCart = (onlyMissing: boolean) => {
    const items = (onlyMissing ? missing : list).map((l) => ({ productId: l.productId, qty: onlyMissing ? l.toBuy : Math.ceil(l.needed - 1e-9) }));
    const lines = assignSellers(items, "cheapest");
    addMany(lines);
    toast(t("planner.addedToCart", { count: lines.reduce((n, l) => n + l.qty, 0) }));
  };

  return (
    <Container>
      <Link to="/recipes" className="mb-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("recipes.title")}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="relative">
            <Img src={recipe.image} alt={name} fallback={recipe.emoji} priority sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-[16/10] w-full rounded-card" />
            <FavoriteButton className="absolute right-4 top-4" active={saved} label={saved ? t("a11y.unsave", { name }) : t("a11y.save", { name })}
              onToggle={() => (user ? toggleFavorite(recipe.id) : navigate(`/login?next=/recipes/${recipe.slug}`))} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => <Badge key={tag} tone={tag === "traditional" ? "clay" : "brand"}>{t(`recipes.tags.${tag}`)}</Badge>)}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-3 text-lg text-muted">{loc(recipe.summary, lang)}</p>
          <div className="mt-3"><Rating value={recipe.rating} count={recipe.ratingCount} sample /></div>

          <dl className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Clock, label: t("recipes.prep"), value: t("common.minutes", { count: recipe.prepMin }) },
              { icon: Flame, label: t("recipes.cook"), value: t("common.minutes", { count: recipe.cookMin }) },
              { icon: Gauge, label: t("recipes.difficulty"), value: t(`recipes.${recipe.difficulty}`) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-card bg-sunken/70 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted"><Icon className="size-3.5" aria-hidden />{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {chef && (
            <Link to={`/chefs/${chef.slug}`} className="card mt-6 flex items-center gap-4 p-4 hover:border-ink/30">
              <Avatar name={chef.name} className="size-14 text-lg" />
              <div>
                <p className="font-semibold">{t("recipes.by", { name: chef.name })}</p>
                <p className="text-sm text-muted">{loc(chef.speciality, lang)}</p>
                <VerifiedMark verified={chef.verified} />
              </div>
            </Link>
          )}

          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl font-semibold">{t("recipes.method")}</h2>
            <ol className="space-y-5">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white" aria-hidden>{i + 1}</span>
                  <p className="pt-1 text-ink-soft"><span className="sr-only">{i + 1}. </span>{loc(s, lang)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Shoppable ingredients */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5 sm:p-6" aria-labelledby="ingredients-h">
            <h2 id="ingredients-h" className="font-semibold">{t("recipes.ingredients")}</h2>
            <div className="mt-4 flex items-center justify-between rounded-card bg-sunken/70 p-3">
              <span className="text-sm font-medium">{t("recipes.servings")}</span>
              <Stepper value={servings} onChange={setServings} min={1} max={20} label={t("recipes.servings")} />
            </div>

            {conflicts.length > 0 && (
              <p className="mt-4 flex items-start gap-2 rounded-card bg-accent-50 p-3 text-sm text-accent-700" role="alert">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t("recipes.allergyWarning", { list: conflicts.map((a) => t(`allergens.${a}`)).join(", ") })}
              </p>
            )}

            <ul className="mt-4 divide-y divide-line">
              {list.map((l) => {
                const p = productById(l.productId)!;
                const inStock = bestOffer(p).stock > 0;
                return (
                  <li key={l.productId} className="flex items-center gap-3 py-2.5 text-sm">
                    <Img src={p.image} alt="" fallback={p.emoji} className="size-10 shrink-0 rounded-md" sizes="40px" />
                    <span className="min-w-0 flex-1">
                      <Link to={`/product/${p.slug}`} className="hover:text-brand-700">{loc(p.name, lang)}</Link>
                      <span className="block text-xs text-muted">
                        {l.fromPantry > 0 ? <span className="text-brand-700">✓ {t("recipes.inPantry")}</span> : inStock ? t("recipes.available") : <span className="text-danger">{t("recipes.unavailable")}</span>}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-right text-ink-soft">{formatQty(l.needed)} × {loc(p.unit, lang)}</span>
                  </li>
                );
              })}
            </ul>

            {recipe.substitutions && recipe.substitutions.length > 0 && (
              <div className="mt-4 rounded-card border border-line p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium"><ArrowRightLeft className="size-4 text-muted" aria-hidden />{t("recipes.substitutions")}</p>
                <ul className="mt-1.5 space-y-1 text-muted">
                  {recipe.substitutions.map((s) => (
                    <li key={s.productId}>{t("recipes.insteadOf", { alt: loc(productById(s.productId)!.name, lang), orig: loc(productById(s.insteadOf)!.name, lang) })}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm text-muted">{t("recipes.estCost")}</span>
              <span className="text-right">
                <span className="tabular block text-xl font-semibold">≈ {formatRWF(cost)}</span>
                <span className="tabular text-xs text-muted">{t("recipes.perServing", { amount: formatRWF(Math.round(cost / servings)) })}</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">{t("recipes.costNote")}</p>

            <div className="mt-5 grid gap-2">
              <Button size="lg" onClick={() => addToCart(true)} disabled={missing.length === 0}>
                <ShoppingBasket className="size-4" aria-hidden /> {t("recipes.addMissing")} ({missing.length})
              </Button>
              <Button variant="secondary" onClick={() => addToCart(false)}>{t("recipes.addAll")}</Button>
              {kit && (
                <Link to={`/product/${kit.slug}`} className="mt-1 rounded-card border border-dashed border-brand-200 bg-brand-50/50 p-3 text-center text-sm font-medium text-brand-700 hover:bg-brand-50">
                  {loc(kit.name, lang)} · {formatRWF(bestOffer(kit).price)} →
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
    </Container>
  );
}
