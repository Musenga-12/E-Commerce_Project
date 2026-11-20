import { Heart, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthGate } from "@/components/AuthGate";
import { RecipeCard } from "@/components/cards";
import { Container } from "@/components/layout";
import { ButtonLink, Chip, EmptyState, PageHeader } from "@/components/ui";
import { recipes } from "@/data/recipes";
import { useHousehold } from "@/store";
import { RECIPE_TAGS, type RecipeTag } from "@/types";

export default function Recipes() {
  const { t } = useTranslation();
  const [tag, setTag] = useState<RecipeTag | null>(null);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const list = recipes.filter(
    (r) => (!tag || r.tags.includes(tag)) && (!query || Object.values(r.name).some((n) => n.toLowerCase().includes(query))),
  );

  return (
    <Container>
      <PageHeader title={t("recipes.title")} sub={t("recipes.subtitle")}>
        <div className="relative w-full sm:w-72">
          <label htmlFor="recipe-search" className="sr-only">{t("recipes.search")}</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="recipe-search" type="search" className="field pl-10" placeholder={t("recipes.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </PageHeader>
      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t("recipes.title")}>
        <Chip active={!tag} onClick={() => setTag(null)}>{t("recipes.filterAll")}</Chip>
        {RECIPE_TAGS.map((x) => <Chip key={x} active={tag === x} onClick={() => setTag(tag === x ? null : x)}>{t(`recipes.tags.${x}`)}</Chip>)}
      </div>
      <p className="sr-only" aria-live="polite">{list.length}</p>
      {list.length === 0 ? (
        <EmptyState icon={<Search className="size-6" />} title={t("recipes.empty")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
      <p className="mt-8 text-xs text-muted">{t("recipes.ratingsNote")}</p>
    </Container>
  );
}

export function Favorites() {
  const { t } = useTranslation();
  const favorites = useHousehold((s) => s.favorites);
  const list = recipes.filter((r) => favorites.includes(r.id));
  return (
    <AuthGate feature="favorites">
      <Container>
        <PageHeader title={t("recipes.saved")} />
        {list.length === 0 ? (
          <EmptyState icon={<Heart className="size-6" />} title={t("recipes.savedEmpty")} action={<ButtonLink to="/recipes">{t("nav.recipes")}</ButtonLink>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
        )}
      </Container>
    </AuthGate>
  );
}
