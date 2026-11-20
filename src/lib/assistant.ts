// Assistant preview: a naive multilingual parser standing in for the LLM (plan §5).
// In M8 the backend LLM returns this structure via tool use; the rules engine stays the same.
import type { Allergen, HouseholdProfile } from "@/types";

const ALLERGEN_WORDS: Record<Allergen, string[]> = {
  fish: ["fish", "amafi", "mafi", "ifi", "poisson", "sambaza"],
  peanuts: ["peanut", "groundnut", "ubunyobwa", "bunyobwa", "arachide"],
  eggs: ["egg", "amagi", "magi", "œuf", "oeuf"],
  dairy: ["milk", "dairy", "amata", "mata", "lait"],
  gluten: ["gluten", "wheat", "ifarini", "blé"],
};

export function parseRequest(text: string, base: HouseholdProfile): HouseholdProfile {
  const s = text.toLowerCase().replace(/(\d),(\d{3})/g, "$1$2");
  const next = { ...base };
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(k|000)?/g)].map((m) => Number(m[1]) * (m[2] === "k" ? 1000 : 1));
  const budget = nums.find((n) => n >= 5000);
  if (budget) next.weeklyBudget = budget;
  const minutes = s.match(/(\d+)\s*(min|minutes|iminota)/) ?? s.match(/(?:iminota)\s*(\d+)/);
  if (minutes) next.maxCookMinutes = Number(minutes[1]);
  const people = s.match(/(?:family of|abantu|famille de|for)\s*(\d+)/) ?? s.match(/(\d+)\s*(people|personnes|abantu)/);
  if (people) {
    const n = Number(people[1]);
    next.adults = Math.min(2, n);
    next.children = Math.max(0, n - 2);
  }
  const days = s.match(/(\d)\s*(days|day|jours|jour)/) ?? s.match(/iminsi\s*(\d)/);
  if (days) next.days = Math.min(7, Math.max(1, Number(days[1])));
  if (/vegetarian|végétarien|nta nyama/.test(s)) next.vegetarian = true;
  (Object.keys(ALLERGEN_WORDS) as Allergen[]).forEach((a) => {
    if (ALLERGEN_WORDS[a].some((w) => new RegExp(`(no|without|sans|nta)\\s+${w}`).test(s))) {
      next.allergies = [...new Set([...next.allergies, a])];
    }
  });
  return next;
}
