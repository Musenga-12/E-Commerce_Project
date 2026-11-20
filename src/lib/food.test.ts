import { describe, expect, it } from "vitest";
import { productById } from "@/data/catalog";
import { recipes } from "@/data/recipes";
import { assignSellers, linePrice, purchaseCost, recipeCost, shoppingList } from "./food";

describe("money is integer-safe", () => {
  it("every recipe cost is a whole number of RWF at any serving size", () => {
    for (const r of recipes) for (const s of [1, 3, 4, 7, 11]) expect(Number.isInteger(recipeCost(r, s))).toBe(true);
  });
  it("purchase cost charges whole units", () => {
    const cheapest = Math.min(...productById("p-tomato")!.offers.map((o) => o.price));
    expect(purchaseCost([{ productId: "p-tomato", qty: 1.2 }])).toBe(cheapest * 2);
  });
});

describe("shoppingList", () => {
  it("merges duplicate needs, subtracts pantry and rounds up", () => {
    const list = shoppingList(
      [{ productId: "p-onion", qty: 0.6 }, { productId: "p-onion", qty: 0.7 }, { productId: "p-rice", qty: 0.5 }],
      [{ productId: "p-rice", qty: 1 }],
    );
    expect(list.find((l) => l.productId === "p-onion")!.toBuy).toBe(2);
    expect(list.find((l) => l.productId === "p-rice")!.toBuy).toBe(0);
  });
});

describe("assignSellers", () => {
  const items = [
    { productId: "p-tomato", qty: 1 }, { productId: "p-beans", qty: 2 },
    { productId: "p-chicken", qty: 1 }, { productId: "p-milk", qty: 1 },
  ];
  const total = (s: "cheapest" | "fewest") => assignSellers(items, s).reduce((t, l) => t + linePrice(l), 0);
  const count = (s: "cheapest" | "fewest") => new Set(assignSellers(items, s).map((l) => l.sellerId)).size;

  it("cheapest never costs more than fewest-sellers", () => {
    expect(total("cheapest")).toBeLessThanOrEqual(total("fewest"));
  });
  it("fewest-sellers uses no more sellers than cheapest", () => {
    expect(count("fewest")).toBeLessThanOrEqual(count("cheapest"));
  });
  it("only assigns sellers that actually stock the product", () => {
    for (const l of assignSellers(items, "fewest")) {
      expect(productById(l.productId)!.offers.some((o) => o.sellerId === l.sellerId)).toBe(true);
    }
  });
});
