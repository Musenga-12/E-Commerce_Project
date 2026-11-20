// Listing and profile pages: meal kits, chefs, chef profile, seller profile.
import { ArrowLeft, MapPin, PackageCheck, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ChefCard, KitCard, ProductCard, RecipeCard, VerifiedMark } from "@/components/cards";
import { Container } from "@/components/layout";
import { Avatar, MockBadge, PageHeader, Rating } from "@/components/ui";
import { mealKits, products, sellerBySlug } from "@/data/catalog";
import { chefBySlug, chefs } from "@/data/chefs";
import { recipes } from "@/data/recipes";
import { formatRWF, loc } from "@/lib/format";
import { useCatalog } from "@/store";
import { DISTRICTS } from "@/types";
import NotFound from "./NotFound";

export function Kits() {
  const { t } = useTranslation();
  useCatalog((s) => s.version);
  return (
    <Container>
      <PageHeader title={t("kits.title")} sub={t("kits.sub")} eyebrow={<MockBadge label={t("mock.sampleData")} />} />
      <div className="grid gap-4 lg:grid-cols-2">
        {mealKits.map((k) => <KitCard key={k.id} kit={k} />)}
      </div>
    </Container>
  );
}

export function Chefs() {
  const { t } = useTranslation();
  return (
    <Container>
      <PageHeader title={t("chefs.title")} sub={t("chefs.sub")} eyebrow={<MockBadge label={t("mock.sampleProfile")} />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chefs.map((c) => <ChefCard key={c.id} chef={c} recipeCount={recipes.filter((r) => r.chefId === c.id).length} />)}
      </div>
    </Container>
  );
}

export function ChefProfile() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const chef = chefBySlug(slug ?? "");
  if (!chef) return <NotFound />;
  const list = recipes.filter((r) => r.chefId === chef.id);
  return (
    <Container>
      <Link to="/chefs" className="mb-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> {t("chefs.title")}</Link>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar name={chef.name} className="size-28 text-3xl" />
        <div className="max-w-2xl">
          <MockBadge label={t("mock.sampleProfile")} />
          <h1 className="mt-2 font-display text-3xl font-semibold">{chef.name}</h1>
          <p className="mt-1 text-ink-soft">{loc(chef.speciality, i18n.language)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
            <VerifiedMark verified={chef.verified} />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{chef.district}</span>
          </div>
          <p className="mt-4 text-ink-soft">{loc(chef.bio, i18n.language)}</p>
        </div>
      </div>
      <h2 className="mb-5 mt-12 font-display text-2xl font-semibold">{t("chefs.recipesBy", { name: chef.name })}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((r) => <RecipeCard key={r.id} recipe={r} />)}
      </div>
    </Container>
  );
}

export function SellerProfile() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  useCatalog((s) => s.version);
  const seller = sellerBySlug(slug ?? "");
  if (!seller) return <NotFound />;
  const list = products.filter((p) => p.offers.some((o) => o.sellerId === seller.id));
  return (
    <Container>
      <Link to="/shop" className="mb-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> {t("nav.shop")}</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <MockBadge label={t("mock.sampleData")} />
          <h1 className="mt-2 font-display text-3xl font-semibold">{seller.name}</h1>
          <p className="mt-1 text-ink-soft">{loc(seller.tagline, i18n.language)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <VerifiedMark verified={seller.verified} />
            <Rating value={seller.rating} count={seller.reviews} sample />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{seller.district}</span>
            <span>{t("sellerProfile.since", { year: seller.since })}</span>
          </div>
          <details className="mt-4 max-w-xl text-sm">
            <summary className="link cursor-pointer">{t("sellerProfile.whatVerified")}</summary>
            <p className="mt-2 text-muted">{t("sellerProfile.whatVerifiedD")}</p>
          </details>
        </div>
        <aside className="card p-5 text-sm">
          <h2 className="font-semibold">{t("sellerProfile.deliveryFees")}</h2>
          <ul className="mt-3 space-y-2">
            {DISTRICTS.map((d) => (
              <li key={d} className="flex justify-between gap-2">
                <span className="inline-flex items-center gap-1.5"><Truck className="size-3.5 text-muted" aria-hidden />{d}</span>
                <span className="tabular">{formatRWF(seller.zoneFees[d])} · {t("product.eta", { hours: seller.etaHours[d] })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3">
            <PackageCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            {seller.collection ? t("sellerProfile.collectionAt", { place: seller.collectionPoint }) : t("sellerProfile.noCollection")}
          </p>
          <p className="mt-3 text-xs text-muted">{t("mock.fees")}</p>
        </aside>
      </div>
      <h2 className="mb-5 mt-12 font-display text-2xl font-semibold">{t("sellerProfile.products", { name: seller.name })}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {list.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </Container>
  );
}
