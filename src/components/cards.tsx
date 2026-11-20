import { BadgeCheck, Clock, Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { bestOffer, sellerById } from "@/data/catalog";
import { chefById } from "@/data/chefs";
import { recipeCost, totalMinutes } from "@/lib/food";
import { formatRWF, loc } from "@/lib/format";
import { useAuth, useCart, useHousehold } from "@/store";
import type { Chef, Product, Recipe, Seller } from "@/types";
import { toast } from "./toast";
import { Avatar, Badge, FavoriteButton, FreshnessBadge, Img, Price, Rating } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation();
  const add = useCart((s) => s.add);
  const offer = bestOffer(product);
  const seller = sellerById(offer.sellerId);
  const name = loc(product.name, i18n.language);
  const inStock = offer.stock > 0;

  return (
    <article className="group card flex flex-col overflow-hidden">
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden" tabIndex={-1} aria-hidden>
        <Img src={product.image} alt="" fallback={product.emoji} className="aspect-[4/3] w-full transition duration-300 group-hover:scale-[1.02]" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[15px] leading-snug font-medium">
          <Link to={`/product/${product.slug}`} className="line-clamp-2 hover:text-brand-700">{name}</Link>
        </h3>
        <p className="text-xs text-muted">{loc(product.unit, i18n.language)}</p>
        <p className="truncate text-xs text-ink-soft">
          {product.offers.length > 1 ? t("shop.sellers", { count: product.offers.length }) : seller.name}
        </p>
        <div className="mt-auto pt-2">
          <div className="text-sm">
            {product.offers.length > 1 && <span className="mr-1 text-xs text-muted">{t("price.from")}</span>}
            <Price amount={offer.price} compareAt={offer.compareAt} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <FreshnessBadge days={offer.priceUpdatedDaysAgo} />
            {!inStock ? <Badge tone="danger">{t("common.outOfStock")}</Badge> : offer.stock < 10 && <Badge tone="accent">{t("common.lowStock", { count: offer.stock })}</Badge>}
          </div>
        </div>
        <button
          type="button"
          disabled={!inStock}
          onClick={() => { add(product.id, offer.sellerId); toast(`${name} · ${t("common.added")}`); }}
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-brand-600 text-sm font-semibold text-brand-700 transition hover:bg-brand-600 hover:text-white disabled:border-line disabled:text-muted"
          aria-label={`${t("common.addToCart")}: ${name}`}
        >
          <Plus className="size-4" aria-hidden /> {t("common.addToCart")}
        </button>
      </div>
    </article>
  );
}

export function RecipeCard({ recipe, servings }: { recipe: Recipe; servings?: number }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { favorites, toggleFavorite } = useHousehold();
  const s = servings ?? recipe.servings;
  const chef = chefById(recipe.chefId);
  const name = loc(recipe.name, i18n.language);
  const saved = favorites.includes(recipe.id);

  return (
    <article className="group card relative flex flex-col overflow-hidden">
      <div className="relative overflow-hidden">
        <Img src={recipe.image} alt={name} fallback={recipe.emoji} className="aspect-[4/3] w-full transition duration-300 group-hover:scale-[1.02]" />
        <FavoriteButton
          className="absolute right-3 top-3"
          active={saved}
          label={saved ? t("a11y.unsave", { name }) : t("a11y.save", { name })}
          onToggle={() => (user ? toggleFavorite(recipe.id) : navigate(`/login?next=/recipes/${recipe.slug}`))}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} tone={tag === "traditional" ? "clay" : "brand"}>{t(`recipes.tags.${tag}`)}</Badge>
          ))}
        </div>
        <h3 className="font-display text-lg leading-snug font-semibold">
          {/* Stretched link: whole card is clickable, heart stays separately focusable. */}
          <Link to={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700">{name}</Link>
        </h3>
        {chef && <p className="text-xs text-muted">{t("recipes.by", { name: chef.name })}</p>}
        <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs text-ink-soft">
          <div className="flex items-center gap-1"><Clock className="size-3.5" aria-hidden /><dt className="sr-only">{t("recipes.cook")}</dt><dd>{t("common.minutes", { count: totalMinutes(recipe) })}</dd></div>
          <div className="flex items-center gap-1"><Users className="size-3.5" aria-hidden /><dt className="sr-only">{t("recipes.servings")}</dt><dd>{s}</dd></div>
          <div className="text-right"><dt className="sr-only">{t("recipes.estCost")}</dt><dd className="tabular font-semibold text-ink">≈ {formatRWF(recipeCost(recipe, s))}</dd></div>
        </dl>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{t(`recipes.${recipe.difficulty}`)}</span>
          <Rating value={recipe.rating} count={recipe.ratingCount} />
        </div>
      </div>
    </article>
  );
}

export function KitCard({ kit }: { kit: Product }) {
  const { t, i18n } = useTranslation();
  const add = useCart((s) => s.add);
  const offer = bestOffer(kit);
  const name = loc(kit.name, i18n.language);
  return (
    <article className="card flex flex-col overflow-hidden sm:flex-row">
      <Link to={`/product/${kit.slug}`} className="sm:w-2/5" tabIndex={-1} aria-hidden>
        <Img src={kit.image} alt="" fallback={kit.emoji} className="aspect-[4/3] h-full w-full sm:aspect-auto" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg leading-snug font-semibold"><Link to={`/product/${kit.slug}`} className="hover:text-brand-700">{name}</Link></h3>
        {kit.kitServings && <p className="text-xs text-muted">{t("kits.serves", { count: kit.kitServings })}</p>}
        {kit.description && <p className="line-clamp-2 text-sm text-ink-soft">{loc(kit.description, i18n.language)}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div>
            <Price amount={offer.price} compareAt={offer.compareAt} />
            <p className="mt-0.5 text-xs text-muted">{offer.stock > 0 ? t("product.stockLeft", { count: offer.stock }) : t("common.outOfStock")}</p>
          </div>
          <button
            type="button"
            disabled={offer.stock === 0}
            onClick={() => { add(kit.id, offer.sellerId); toast(`${name} · ${t("common.added")}`); }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-45"
          >
            <Plus className="size-4" aria-hidden /> {t("common.addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
}

export function VerifiedMark({ verified }: { verified: boolean }) {
  const { t } = useTranslation();
  if (!verified) return <span className="text-xs text-muted">{t("mock.notVerified")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
      <BadgeCheck className="size-3.5" aria-hidden /> {t("mock.verifiedMock")}
    </span>
  );
}

export function SellerCard({ seller }: { seller: Seller }) {
  const { t, i18n } = useTranslation();
  return (
    <Link to={`/sellers/${seller.slug}`} className="card flex items-start gap-4 p-4 transition hover:border-ink/30">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 font-display text-lg font-semibold text-brand-700" aria-hidden>
        {seller.name.charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{seller.name}</p>
        <p className="line-clamp-1 text-xs text-muted">{loc(seller.tagline, i18n.language)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <VerifiedMark verified={seller.verified} />
          <Rating value={seller.rating} count={seller.reviews} sample />
          <span className="text-xs text-muted">{seller.district}</span>
        </div>
        <p className="sr-only">{t("sellerProfile.since", { year: seller.since })}</p>
      </div>
    </Link>
  );
}

export function ChefCard({ chef, recipeCount }: { chef: Chef; recipeCount: number }) {
  const { t, i18n } = useTranslation();
  return (
    <Link to={`/chefs/${chef.slug}`} className="group card flex flex-col items-center p-6 text-center transition hover:border-ink/30">
      <Avatar name={chef.name} className="size-24 text-2xl" />
      <p className="mt-4 font-semibold group-hover:text-brand-700">{chef.name}</p>
      <p className="mt-0.5 text-sm text-muted">{loc(chef.speciality, i18n.language)}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <VerifiedMark verified={chef.verified} />
        <span className="text-xs text-muted">· {t("chefs.recipes", { count: recipeCount })}</span>
      </div>
    </Link>
  );
}
