// Mock catalogue used until the FastAPI backend (M2) is available.
// Kinyarwanda and French strings need fluent-speaker review before release.
// Prices, stock, ratings, fees and verification flags are SAMPLE DATA, not real market data.
import type { Category, Localized, Offer, Product, Seller } from "@/types";

const L = (en: string, rw: string, fr: string): Localized => ({ en, rw, fr });

export const categories: Category[] = [
  { id: "vegetables", image: "products/cabbage", name: L("Vegetables", "Imboga", "Légumes") },
  { id: "fruits", image: "products/avocado", name: L("Fruits", "Imbuto", "Fruits") },
  { id: "grains", image: "products/rice", name: L("Grains & flour", "Ibinyampeke n'ifu", "Céréales et farines") },
  { id: "legumes", image: "products/beans", name: L("Beans & legumes", "Ibinyamisogwe", "Légumineuses") },
  { id: "meat-fish", image: "products/tilapia", name: L("Meat & fish", "Inyama n'amafi", "Viande et poisson") },
  { id: "dairy-eggs", image: "products/eggs", name: L("Dairy & eggs", "Amata n'amagi", "Produits laitiers et œufs") },
  { id: "pantry", image: "products/oil", name: L("Oils & pantry", "Amavuta n'ibindi", "Huiles et épicerie") },
  { id: "meal-kits", image: "recipes/isombe", name: L("Meal kits", "Ibikoresho by'ifunguro", "Kits repas") },
];

const Z = (g: number, k: number, n: number) => ({ Gasabo: g, Kicukiro: k, Nyarugenge: n });

export const sellers: Seller[] = [
  {
    id: "s1", slug: "kimironko-fresh", collection: true, collectionPoint: "Kimironko Market, stall B12", name: "Kimironko Fresh", district: "Gasabo", rating: 4.8, reviews: 412, verified: true, since: 2024,
    zoneFees: Z(800, 1500, 1500), etaHours: Z(2, 4, 4), whatsapp: "250788000101",
    tagline: L("Market-fresh produce, picked every morning", "Imboga n'imbuto bishya buri gitondo", "Produits frais du marché chaque matin"),
  },
  {
    id: "s2", slug: "nyabugogo-agro-hub", collection: false, collectionPoint: "Nyabugogo, near the bus park", name: "Nyabugogo Agro Hub", district: "Nyarugenge", rating: 4.5, reviews: 268, verified: true, since: 2025,
    zoneFees: Z(1500, 1500, 700), etaHours: Z(4, 5, 2), whatsapp: "250728000202",
    tagline: L("Wholesale prices on staples", "Ibiciro byiza ku biribwa by'ibanze", "Prix de gros sur les produits de base"),
  },
  {
    id: "s3", slug: "kicukiro-green-basket", collection: true, collectionPoint: "Kicukiro Centre, KK 15 Rd", name: "Kicukiro Green Basket", district: "Kicukiro", rating: 4.7, reviews: 189, verified: true, since: 2025,
    zoneFees: Z(1500, 700, 1500), etaHours: Z(4, 2, 4), whatsapp: "250788000303",
    tagline: L("Organic vegetables and ready meal kits", "Imboga zitarimo imiti n'ibikoresho by'ifunguro", "Légumes bio et kits repas"),
  },
  {
    id: "s4", slug: "remera-butchery-dairy", collection: true, collectionPoint: "Remera, Giporoso", name: "Remera Butchery & Dairy", district: "Gasabo", rating: 4.6, reviews: 233, verified: true, since: 2024,
    zoneFees: Z(1000, 1500, 1800), etaHours: Z(2, 3, 4), whatsapp: "250738000404",
    tagline: L("Fresh meat, fish and dairy, cold-chain delivered", "Inyama, amafi n'amata bishya", "Viande, poisson et lait frais"),
  },
];

/** Builds offers from a base price with small per-seller variation. */
const offers = (base: number, list: [string, number, number?][]): Offer[] =>
  list.map(([sellerId, pct, stock], i) => ({
    sellerId,
    price: Math.round((base * (1 + pct / 100)) / 50) * 50,
    stock: stock ?? 40,
    priceUpdatedDaysAgo: (base + i * 3) % 4,
  }));

const market = (base: number, days: number) => ({
  min: Math.round((base * 0.72) / 50) * 50,
  max: Math.round((base * 0.9) / 50) * 50,
  updatedDaysAgo: days,
});

type Seed = Omit<Product, "offers" | "market" | "slug"> & { base: number; sellers: [string, number, number?][]; days?: number };

const seeds: Seed[] = [
  { id: "p-tomato", image: "products/tomato", category: "vegetables", name: L("Tomatoes", "Inyanya", "Tomates"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🍅", allergens: [], section: "produce", base: 1200, sellers: [["s1", 0], ["s2", -8], ["s3", 6]], days: 0, featured: true },
  { id: "p-onion", image: "products/onion", category: "vegetables", name: L("Red onions", "Ibitunguru", "Oignons rouges"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🧅", allergens: [], section: "produce", base: 1000, sellers: [["s1", 0], ["s2", -10], ["s3", 5]], days: 1 },
  { id: "p-potato", image: "products/potato", category: "vegetables", name: L("Irish potatoes", "Ibirayi", "Pommes de terre"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🥔", allergens: [], section: "produce", base: 700, sellers: [["s1", 0], ["s2", -12, 120], ["s3", 4]], days: 0, featured: true },
  { id: "p-cassava-leaves", image: "products/cassava-leaves", category: "vegetables", name: L("Pounded cassava leaves", "Isombe", "Feuilles de manioc pilées"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🌿", allergens: [], section: "produce", base: 800, sellers: [["s1", 0], ["s3", 8]], days: 2, featured: true },
  { id: "p-matoke", image: "products/matoke", category: "vegetables", name: L("Cooking bananas", "Igitoki", "Bananes plantains"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🍌", allergens: [], section: "produce", base: 600, sellers: [["s1", 0], ["s2", -8, 90]], days: 1 },
  { id: "p-carrot", image: "products/carrot", category: "vegetables", name: L("Carrots", "Karoti", "Carottes"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🥕", allergens: [], section: "produce", base: 800, sellers: [["s1", 0], ["s3", 3]], days: 0 },
  { id: "p-cabbage", image: "products/cabbage", category: "vegetables", name: L("Cabbage", "Shu", "Chou"), unit: L("1 head", "1", "1 pièce"), emoji: "🥬", allergens: [], section: "produce", base: 600, sellers: [["s1", 0], ["s2", -10]], days: 3 },
  { id: "p-amaranth", image: "products/amaranth", category: "vegetables", name: L("Amaranth greens (dodo)", "Dodo", "Amarante (dodo)"), unit: L("1 bunch", "umuba 1", "1 botte"), emoji: "🥗", allergens: [], section: "produce", base: 300, sellers: [["s1", 0], ["s3", 0]], days: 0 },
  { id: "p-eggplant", image: "products/eggplant", category: "vegetables", name: L("Garden eggs", "Intoryi", "Aubergines africaines"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🍆", allergens: [], section: "produce", base: 900, sellers: [["s1", 0], ["s3", 6]], days: 4 },
  { id: "p-pumpkin", image: "products/pumpkin", category: "vegetables", name: L("Pumpkin", "Igihaza", "Citrouille"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🎃", allergens: [], section: "produce", base: 500, sellers: [["s1", 0], ["s2", -6]], days: 2 },
  { id: "p-garlic", image: "products/garlic", category: "vegetables", name: L("Garlic", "Tungurusumu", "Ail"), unit: L("250 g", "g 250", "250 g"), emoji: "🧄", allergens: [], section: "produce", base: 1000, sellers: [["s1", 0], ["s2", -5]], days: 5 },
  { id: "p-avocado", image: "products/avocado", category: "fruits", name: L("Avocados", "Avoka", "Avocats"), unit: L("4 pieces", "4", "4 pièces"), emoji: "🥑", allergens: [], section: "produce", base: 1000, sellers: [["s1", 0], ["s3", 5]], days: 0, featured: true },
  { id: "p-pineapple", image: "products/pineapple", category: "fruits", name: L("Pineapple", "Inanasi", "Ananas"), unit: L("1 piece", "1", "1 pièce"), emoji: "🍍", allergens: [], section: "produce", base: 1200, sellers: [["s1", 0], ["s2", -10]], days: 1 },
  { id: "p-rice", image: "products/rice", category: "grains", name: L("Rice", "Umuceri", "Riz"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🍚", allergens: [], section: "grains", base: 1800, sellers: [["s1", 4], ["s2", -6, 200], ["s3", 8]], days: 1, featured: true },
  { id: "p-maize-flour", image: "products/maize-flour", category: "grains", name: L("Maize flour", "Kawunga", "Farine de maïs"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🌽", allergens: [], section: "grains", base: 1100, sellers: [["s2", 0, 150], ["s3", 9]], days: 2 },
  { id: "p-wheat-flour", image: "products/wheat-flour", category: "grains", name: L("Wheat flour", "Ifarini", "Farine de blé"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🌾", allergens: ["gluten"], section: "grains", base: 1400, sellers: [["s2", 0], ["s3", 7]], days: 3 },
  { id: "p-beans", image: "products/beans", category: "legumes", name: L("Red beans", "Ibishyimbo", "Haricots rouges"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🫘", allergens: [], section: "grains", base: 1300, sellers: [["s1", 3], ["s2", -7, 160], ["s3", 5]], days: 0, featured: true },
  { id: "p-peanut-paste", image: "products/peanut-paste", category: "legumes", name: L("Groundnut paste", "Ubunyobwa bwasweye", "Pâte d'arachide"), unit: L("500 g", "g 500", "500 g"), emoji: "🥜", allergens: ["peanuts"], section: "groceries", base: 2500, sellers: [["s1", 0], ["s2", -4]], days: 6 },
  { id: "p-chicken", image: "products/chicken", category: "meat-fish", name: L("Whole chicken", "Inkoko", "Poulet entier"), unit: L("≈1.2 kg", "≈kg 1.2", "≈1,2 kg"), emoji: "🍗", allergens: [], section: "butchery", base: 7500, sellers: [["s4", 0, 25], ["s3", 6, 10]], days: 1, featured: true },
  { id: "p-beef", image: "products/beef", category: "meat-fish", name: L("Beef", "Inyama y'inka", "Bœuf"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🥩", allergens: [], section: "butchery", base: 6500, sellers: [["s4", 0, 30], ["s2", -3, 15]], days: 1 },
  { id: "p-sambaza", image: "products/sambaza", category: "meat-fish", name: L("Sambaza (lake sardines)", "Isambaza", "Sambaza (sardines du lac)"), unit: L("500 g", "g 500", "500 g"), emoji: "🐟", allergens: ["fish"], section: "butchery", base: 3000, sellers: [["s4", 0], ["s2", -5]], days: 2 },
  { id: "p-tilapia", image: "products/tilapia", category: "meat-fish", name: L("Tilapia", "Tilapiya", "Tilapia"), unit: L("1 kg", "kg 1", "1 kg"), emoji: "🐠", allergens: ["fish"], section: "butchery", base: 5500, sellers: [["s4", 0, 18]], days: 3 },
  { id: "p-eggs", image: "products/eggs", category: "dairy-eggs", name: L("Eggs", "Amagi", "Œufs"), unit: L("12 eggs", "amagi 12", "12 œufs"), emoji: "🥚", allergens: ["eggs"], section: "dairy", base: 2400, sellers: [["s4", 0], ["s1", 4], ["s2", -4]], days: 0 },
  { id: "p-milk", image: "products/milk", category: "dairy-eggs", name: L("Fresh milk", "Amata y'inshyushyu", "Lait frais"), unit: L("1 L", "litiro 1", "1 L"), emoji: "🥛", allergens: ["dairy"], section: "dairy", base: 900, sellers: [["s4", 0, 60]], days: 0 },
  { id: "p-oil", image: "products/oil", category: "pantry", name: L("Sunflower oil", "Amavuta yo guteka", "Huile de tournesol"), unit: L("1 L", "litiro 1", "1 L"), emoji: "🫗", allergens: [], section: "groceries", base: 3200, sellers: [["s1", 3], ["s2", -5], ["s3", 4]], days: 4 },
  { id: "p-salt", image: "products/salt", category: "pantry", name: L("Salt", "Umunyu", "Sel"), unit: L("500 g", "g 500", "500 g"), emoji: "🧂", allergens: [], section: "groceries", base: 300, sellers: [["s1", 0], ["s2", 0], ["s3", 0]], days: 7 },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const groceryProducts: Product[] = seeds.map(({ base, sellers: sl, days, ...p }) => ({
  ...p,
  slug: slugify(p.name.en),
  offers: offers(base, sl),
  market: market(base, days ?? 2),
}));

export const mealKits: Product[] = [
  {
    id: "k-isombe", slug: "isombe-kit", category: "meal-kits", kitRecipe: "r-isombe", kitServings: 4, image: "recipes/isombe", featured: true,
    name: L("Isombe kit · serves 4", "Ibikoresho by'isombe · abantu 4", "Kit isombe · 4 personnes"),
    unit: L("1 kit", "1", "1 kit"), emoji: "🌿", allergens: ["peanuts"], section: "groceries",
    description: L("Everything for a traditional isombe: cassava leaves, groundnut paste, garden eggs, onions and oil.", "Ibyo ukeneye byose ngo uteke isombe.", "Tout pour un isombe traditionnel."),
    offers: [{ sellerId: "s3", price: 5900, compareAt: 6600, stock: 14, priceUpdatedDaysAgo: 1 }, { sellerId: "s1", price: 6200, stock: 9, priceUpdatedDaysAgo: 1 }],
    market: market(6600, 1),
  },
  {
    id: "k-chicken", slug: "family-chicken-dinner-kit", category: "meal-kits", kitRecipe: "r-chicken-stew", kitServings: 5, image: "recipes/chicken-stew", featured: true,
    name: L("Family chicken dinner kit", "Ifunguro ry'umuryango ry'inkoko", "Kit dîner familial au poulet"),
    unit: L("1 kit · serves 5", "1 · abantu 5", "1 kit · 5 pers."), emoji: "🍗", allergens: [], section: "butchery",
    description: L("Whole chicken, potatoes, carrots, onions, tomatoes and garlic, portioned for a family stew.", "Inkoko, ibirayi, karoti n'ibindi byo guteka isupu y'umuryango.", "Poulet, pommes de terre, carottes et aromates pour un ragoût familial."),
    offers: [{ sellerId: "s4", price: 12900, compareAt: 14200, stock: 8, priceUpdatedDaysAgo: 1 }, { sellerId: "s3", price: 13400, stock: 6, priceUpdatedDaysAgo: 1 }],
    market: market(14200, 1),
  },
  {
    id: "k-healthy-week", slug: "healthy-week-kit", category: "meal-kits", kitServings: 4, image: "kits/healthy-week", featured: true,
    name: L("Healthy week · 7 dinners", "Icyumweru cy'ubuzima · amafunguro 7", "Semaine santé · 7 dîners"),
    unit: L("1 box · serves 4", "1 · abantu 4", "1 box · 4 pers."), emoji: "🧺", allergens: ["fish"], section: "groceries",
    description: L("Seven balanced dinners with recipes, planned by our nutritionist and priced below buying separately.", "Amafunguro arindwi aringaniye n'uburyo bwo kuyateka.", "Sept dîners équilibrés avec recettes."),
    offers: [{ sellerId: "s3", price: 54000, compareAt: 61000, stock: 5, priceUpdatedDaysAgo: 1 }],
    market: market(61000, 2),
  },
];

export const products: Product[] = [...groceryProducts, ...mealKits];

export const productById = (id: string) => products.find((p) => p.id === id);
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const sellerById = (id: string) => sellers.find((s) => s.id === id)!;
export const sellerBySlug = (slug: string) => sellers.find((s) => s.slug === slug);
export const categoryById = (id: string) => categories.find((c) => c.id === id);

/** Lowest in-stock offer. */
export const bestOffer = (p: Product) =>
  [...p.offers].filter((o) => o.stock > 0).sort((a, b) => a.price - b.price)[0] ?? p.offers[0];

export const markets = [
  { id: "kimironko", name: "Kimironko Market", district: "Gasabo", factor: 1 },
  { id: "nyabugogo", name: "Nyabugogo Market", district: "Nyarugenge", factor: 0.94 },
  { id: "kicukiro", name: "Kicukiro Centre Market", district: "Kicukiro", factor: 1.04 },
] as const;
