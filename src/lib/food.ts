// Pure domain logic shared by planner, Cook With What I Have, Market Budget mode and cart.
// The backend `planner` and `checkout` modules will own this in M5/M8; keep these functions pure.
import { bestOffer, productById, products, sellers } from "@/data/catalog";
import { recipeById } from "@/data/recipes";
import type { Allergen, AssignStrategy, CartLine, PantryItem, PlanEntry, Product, Recipe } from "@/types";

export interface Need {
  productId: string;
  qty: number; // fractional units needed
}

export const recipeAllergens = (r: Recipe): Allergen[] => [
  ...new Set(r.ingredients.flatMap((i) => productById(i.productId)?.allergens ?? [])),
];

export const totalMinutes = (r: Recipe) => r.prepMin + r.cookMin;

/** Ingredient needs scaled to a number of servings. */
export function recipeNeeds(r: Recipe, servings = r.servings): Need[] {
  const f = servings / r.servings;
  return r.ingredients.map((i) => ({ productId: i.productId, qty: i.qty * f }));
}

/**
 * Estimated cost of the portion actually used (per-meal estimate).
 * Each line is rounded to whole RWF before summing so totals stay integers.
 */
export function needsCost(needs: Need[]): number {
  return needs.reduce((sum, n) => {
    const p = productById(n.productId);
    return p ? sum + Math.round(bestOffer(p).price * n.qty) : sum;
  }, 0);
}

export const recipeCost = (r: Recipe, servings = r.servings) => needsCost(recipeNeeds(r, servings));

/** Merge needs, subtract pantry, round up to purchasable whole units. */
export function shoppingList(needs: Need[], pantry: PantryItem[] = []) {
  const merged = new Map<string, number>();
  for (const n of needs) merged.set(n.productId, (merged.get(n.productId) ?? 0) + n.qty);
  return [...merged.entries()]
    .map(([productId, qty]) => {
      const have = pantry.find((p) => p.productId === productId)?.qty ?? 0;
      const toBuy = Math.max(0, Math.ceil(qty - have - 1e-9));
      return { productId, needed: qty, fromPantry: Math.min(have, qty), toBuy };
    })
    .sort((a, b) => a.productId.localeCompare(b.productId));
}

export function planNeeds(entries: PlanEntry[], servings: number): Need[] {
  return entries.flatMap((e) => {
    const r = recipeById(e.recipeId);
    return r ? recipeNeeds(r, servings) : [];
  });
}

/** Choose an offer per item according to the buyer's strategy. */
export function assignSellers(items: { productId: string; qty: number }[], strategy: AssignStrategy): CartLine[] {
  const wanted = items.filter((i) => i.qty > 0);
  const avail = (p: Product, sellerId: string, qty: number) => p.offers.find((o) => o.sellerId === sellerId && o.stock >= qty);

  if (strategy === "cheapest") {
    return wanted.map((i) => ({ ...i, sellerId: bestOffer(productById(i.productId)!).sellerId }));
  }

  // Greedy set cover: repeatedly pick the seller that covers the most remaining items.
  const lines: CartLine[] = [];
  let remaining = [...wanted];
  for (let round = 0; round < sellers.length && remaining.length; round++) {
    const ranked = sellers
      .map((s) => {
        const covered = remaining.filter((i) => avail(productById(i.productId)!, s.id, i.qty));
        const cost = covered.reduce((c, i) => c + avail(productById(i.productId)!, s.id, i.qty)!.price * i.qty, 0);
        return { s, covered, cost };
      })
      .sort((a, b) => b.covered.length - a.covered.length || a.cost - b.cost);
    const best = ranked[0];
    if (!best || best.covered.length === 0) break;
    best.covered.forEach((i) => lines.push({ ...i, sellerId: best.s.id }));
    remaining = remaining.filter((i) => !best.covered.includes(i));
  }
  // Anything no seller can supply in full falls back to the cheapest offer.
  remaining.forEach((i) => lines.push({ ...i, sellerId: bestOffer(productById(i.productId)!).sellerId }));
  return lines;
}

export function linePrice(line: CartLine): number {
  const p = productById(line.productId);
  const o = p?.offers.find((x) => x.sellerId === line.sellerId) ?? (p ? bestOffer(p) : undefined);
  return (o?.price ?? 0) * line.qty;
}

/** Find products whose name matches free text in any locale (used by the assistant preview). */
export function matchProducts(text: string): Product[] {
  const t = text.toLowerCase();
  return products.filter(
    (p) =>
      p.category !== "meal-kits" &&
      Object.values(p.name).some((n) => {
        const key = n.toLowerCase().split(/[ (]/)[0];
        return key.length > 2 && t.includes(key.replace(/s$/, ""));
      }),
  );
}

/** Cost of buying whole units for a set of needs (what the shopper actually pays). */
export function purchaseCost(items: { productId: string; qty: number }[]): number {
  return items.reduce((sum, i) => {
    const p = productById(i.productId);
    return p ? sum + bestOffer(p).price * Math.ceil(i.qty - 1e-9) : sum;
  }, 0);
}
