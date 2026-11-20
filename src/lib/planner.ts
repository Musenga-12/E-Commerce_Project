// Client-side preview of the rules engine (plan §5). Hard constraints — allergies, diet,
// cook time — are filters; budget is enforced by swapping expensive meals for cheaper ones.
// In M8 the backend runs this and the LLM only orders/explains the candidate set.
import { recipes } from "@/data/recipes";
import type { HouseholdProfile, MealSlot, PlanEntry, Recipe } from "@/types";
import { recipeAllergens, recipeCost, totalMinutes } from "./food";

export const SLOTS: MealSlot[] = ["lunch", "dinner"];

export const householdServings = (p: Pick<HouseholdProfile, "adults" | "children">) =>
  Math.max(1, Math.ceil(p.adults + p.children * 0.5));

/** The weekly budget pro-rated to the number of planned days (integer RWF). */
export const planBudget = (p: HouseholdProfile) => Math.round((p.weeklyBudget * p.days) / 7);

export function eligibleRecipes(p: HouseholdProfile): Recipe[] {
  return recipes.filter(
    (r) =>
      !recipeAllergens(r).some((a) => p.allergies.includes(a)) &&
      (!p.vegetarian || r.tags.includes("vegetarian")) &&
      totalMinutes(r) <= p.maxCookMinutes,
  );
}

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export interface PlanResult {
  entries: PlanEntry[];
  total: number;
  budget: number;
  withinBudget: boolean;
  candidates: number;
  uniqueRecipes: number;
}

export function planTotal(entries: PlanEntry[], servings: number) {
  return entries.reduce((t, e) => {
    const r = recipes.find((x) => x.id === e.recipeId);
    return r ? t + recipeCost(r, servings) : t;
  }, 0);
}

export function generatePlan(p: HouseholdProfile, seed = Date.now()): PlanResult {
  const servings = householdServings(p);
  const budget = planBudget(p);
  const pool = eligibleRecipes(p);
  const slots = p.slots.length ? p.slots : SLOTS;
  if (pool.length === 0) return { entries: [], total: 0, budget, withinBudget: true, candidates: 0, uniqueRecipes: 0 };

  const rand = rng(seed);
  const cost = (r: Recipe) => recipeCost(r, servings);
  const entries: PlanEntry[] = [];
  const used = new Map<string, number>();

  for (let day = 0; day < p.days; day++) {
    for (const slot of slots) {
      const options = pool.filter((r) => r.slots.includes(slot));
      const list = options.length ? options : pool;
      // Score: repetition penalty + preferences + small noise for variety.
      const scored = list
        .map((r) => {
          const prev = entries.at(-1)?.recipeId === r.id ? 5 : 0;
          const pref = r.tags.some((t) => p.likes.includes(t)) ? -0.6 : 0;
          return { r, score: (used.get(r.id) ?? 0) * 1.5 + prev + pref + rand() };
        })
        .sort((a, b) => a.score - b.score);
      const pick = scored[0].r;
      used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
      entries.push({ day, slot, recipeId: pick.id });
    }
  }

  // Budget pass: swap the priciest meal for the cheapest alternative until within budget.
  const byId = new Map(pool.map((r) => [r.id, r]));
  const sum = () => entries.reduce((t, e) => t + cost(byId.get(e.recipeId)!), 0);
  const cheapest = [...pool].sort((a, b) => cost(a) - cost(b));
  for (let guard = 0; guard < 40 && sum() > budget; guard++) {
    const priciest = [...entries].sort((a, b) => cost(byId.get(b.recipeId)!) - cost(byId.get(a.recipeId)!))[0];
    const alt = cheapest.find((r) => r.slots.includes(priciest.slot) && cost(r) < cost(byId.get(priciest.recipeId)!));
    if (!alt) break;
    priciest.recipeId = alt.id;
  }

  const total = sum();
  return {
    entries, total, budget, withinBudget: total <= budget, candidates: pool.length,
    uniqueRecipes: new Set(entries.map((e) => e.recipeId)).size,
  };
}

/** Next eligible recipe for a slot, skipping the current one. */
export function swapRecipe(p: HouseholdProfile, current: string, slot: MealSlot): string {
  const list = eligibleRecipes(p).filter((r) => r.slots.includes(slot));
  if (list.length <= 1) return current;
  const i = list.findIndex((r) => r.id === current);
  return list[(i + 1) % list.length].id;
}
