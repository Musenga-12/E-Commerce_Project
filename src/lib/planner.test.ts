import { describe, expect, it } from "vitest";
import { recipeById } from "@/data/recipes";
import { defaultProfile } from "@/store";
import { ALLERGENS, type HouseholdProfile } from "@/types";
import { parseRequest } from "./assistant";
import { recipeAllergens, totalMinutes } from "./food";
import { generatePlan, planBudget } from "./planner";

const profile = (p: Partial<HouseholdProfile>): HouseholdProfile => ({ ...defaultProfile, ...p });

describe("rules engine hard constraints", () => {
  it("never includes an allergen the household listed (100 seeded plans)", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const allergies = ALLERGENS.filter((_, i) => (seed >> i) & 1);
      for (const e of generatePlan(profile({ allergies }), seed).entries) {
        expect(recipeAllergens(recipeById(e.recipeId)!).some((a) => allergies.includes(a))).toBe(false);
      }
    }
  });
  it("respects vegetarian and maximum cooking time", () => {
    for (const e of generatePlan(profile({ vegetarian: true, maxCookMinutes: 45 }), 3).entries) {
      const r = recipeById(e.recipeId)!;
      expect(r.tags).toContain("vegetarian");
      expect(totalMinutes(r)).toBeLessThanOrEqual(45);
    }
  });
  it("plans the requested days and meals", () => {
    const res = generatePlan(profile({ days: 5, slots: ["dinner"] }), 9);
    expect(res.entries).toHaveLength(5);
    expect(res.entries.every((e) => e.slot === "dinner")).toBe(true);
  });
  it("returns an empty plan rather than breaking a rule when nothing fits", () => {
    expect(generatePlan(profile({ vegetarian: true, maxCookMinutes: 10 }), 1).entries).toHaveLength(0);
  });
});

describe("budget", () => {
  it("pro-rates the weekly budget to the planned days", () => {
    expect(planBudget(profile({ weeklyBudget: 70000, days: 5 }))).toBe(50000);
  });
  it("keeps the default family plan within budget", () => {
    expect(generatePlan(profile({}), 42).withinBudget).toBe(true);
  });
});

describe("assistant preview parser", () => {
  const base = profile({ allergies: [] });
  it("reads English", () => {
    const p = parseRequest("Family of 5, 50,000 RWF, no fish, 45 minutes, 5 days", base);
    expect([p.adults + p.children, p.weeklyBudget, p.maxCookMinutes, p.days]).toEqual([5, 50000, 45, 5]);
    expect(p.allergies).toContain("fish");
  });
  it("reads Kinyarwanda, where the noun drops its vowel after nta", () => {
    expect(parseRequest("Abantu 3, RWF 30,000, nta mafi", base).allergies).toContain("fish");
  });
  it("reads French", () => {
    const p = parseRequest("Famille de 6, 90000 RWF, sans arachide, végétarien", base);
    expect(p.vegetarian).toBe(true);
    expect(p.allergies).toContain("peanuts");
  });
});
