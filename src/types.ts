// Domain types mirror the planned backend schema (see plan §2). Money is whole RWF (integers only).

export type Locale = "en" | "rw" | "fr";
export type Localized = Record<Locale, string>;

export type District = "Gasabo" | "Kicukiro" | "Nyarugenge";
export const DISTRICTS: District[] = ["Gasabo", "Kicukiro", "Nyarugenge"];

export type Allergen = "peanuts" | "eggs" | "dairy" | "fish" | "gluten";
export const ALLERGENS: Allergen[] = ["peanuts", "eggs", "dairy", "fish", "gluten"];

export type CategoryId =
  | "vegetables"
  | "fruits"
  | "grains"
  | "legumes"
  | "meat-fish"
  | "dairy-eggs"
  | "pantry"
  | "meal-kits";

export interface Category {
  id: CategoryId;
  name: Localized;
  image?: string;
}

export type MarketSection = "produce" | "grains" | "butchery" | "dairy" | "groceries";

export interface Seller {
  id: string;
  slug: string;
  name: string;
  district: District;
  rating: number;
  reviews: number;
  /** Mock verification flag — real KYC review happens in the admin queue (M2). */
  verified: boolean;
  since: number;
  /** Sample fees until delivery pricing is confirmed by the business. */
  zoneFees: Record<District, number>;
  etaHours: Record<District, number>;
  collection: boolean;
  collectionPoint: string;
  whatsapp: string; // E.164 without +
  tagline: Localized;
}

export interface Offer {
  sellerId: string;
  price: number;
  compareAt?: number;
  stock: number;
  priceUpdatedDaysAgo: number;
}

export interface Product {
  id: string;
  slug: string;
  category: CategoryId;
  name: Localized;
  unit: Localized;
  emoji: string;
  image?: string; // key under /images, e.g. "products/tomato"
  allergens: Allergen[];
  offers: Offer[];
  section: MarketSection;
  /** Market estimate — never a seller price. */
  market: { min: number; max: number; updatedDaysAgo: number };
  description?: Localized;
  kitRecipe?: string;
  kitServings?: number;
  featured?: boolean;
}

export type RecipeTag = "traditional" | "vegetarian" | "budget" | "quick" | "protein" | "family";
export const RECIPE_TAGS: RecipeTag[] = ["traditional", "vegetarian", "budget", "quick", "protein", "family"];
export type MealSlot = "lunch" | "dinner";

export interface RecipeIngredient {
  productId: string;
  qty: number; // in product units, for recipe.servings
  optional?: boolean;
}

export interface Substitution {
  productId: string;
  insteadOf: string;
}

export interface Recipe {
  id: string;
  slug: string;
  name: Localized;
  summary: Localized;
  emoji: string;
  image?: string;
  chefId: string;
  servings: number;
  prepMin: number;
  cookMin: number;
  difficulty: "easy" | "medium";
  tags: RecipeTag[];
  slots: MealSlot[];
  ingredients: RecipeIngredient[];
  substitutions?: Substitution[];
  steps: Localized[];
  /** Sample rating until real reviews exist. */
  rating: number;
  ratingCount: number;
}

export interface Chef {
  id: string;
  slug: string;
  name: string;
  speciality: Localized;
  bio: Localized;
  district: District;
  verified: boolean; // mock
  image?: string;
}

export interface CartLine {
  productId: string;
  sellerId: string;
  qty: number;
}

export type AssignStrategy = "cheapest" | "fewest";
export type Fulfilment = "delivery" | "collection";
export type PaymentProvider = "mtn" | "airtel";

/** Parent order — kept separate from payment status (single-store spec rule, still applies). */
export type OrderStatus = "pending_payment" | "awaiting_seller_confirmation" | "confirmed" | "completed" | "cancelled";
export type SellerOrderStatus = "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "collected" | "rejected";
export type PaymentStatus = "initiated" | "pending" | "successful" | "failed" | "cancelled" | "expired";

export interface SellerOrder {
  sellerId: string;
  lines: { productId: string; qty: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  status: SellerOrderStatus;
}

export interface PaymentAttempt {
  id: string;
  provider: PaymentProvider;
  msisdn: string;
  amount: number;
  currency: "RWF";
  status: PaymentStatus;
  mock: true;
  createdAt: string;
  updatedAt: string;
}

export interface StatusEvent {
  at: string;
  kind: "order" | "payment" | "seller";
  status: string;
  sellerId?: string;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  channel: "web" | "whatsapp";
  fulfilment: Fulfilment;
  status: OrderStatus;
  district: District;
  address: string;
  phone: string;
  userId: string;
  sellerOrders: SellerOrder[];
  payments: PaymentAttempt[];
  history: StatusEvent[];
  subtotal: number;
  deliveryTotal: number;
  total: number;
  currency: "RWF";
}

export type Role = "customer" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
}

export type HouseholdType = "student" | "professional" | "family" | "shared";

export interface HouseholdProfile {
  type: HouseholdType;
  adults: number;
  children: number;
  weeklyBudget: number;
  days: number;
  slots: MealSlot[];
  maxCookMinutes: number;
  vegetarian: boolean;
  allergies: Allergen[];
  likes: RecipeTag[];
  usePantry: boolean;
}

export interface PantryItem {
  productId: string;
  qty: number;
  expiresOn?: string; // ISO date
}

export interface PlanEntry {
  day: number;
  slot: MealSlot;
  recipeId: string;
}
