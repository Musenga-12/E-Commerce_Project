// Client state. These persisted stores stand in for the FastAPI backend (mock mode).
// Server state will move to TanStack Query once the API exists.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { products, sellerById } from "@/data/catalog";
import { linePrice } from "@/lib/food";
import type {
  CartLine, District, Fulfilment, HouseholdProfile, Order, OrderStatus, PantryItem, PaymentAttempt, PaymentProvider,
  PaymentStatus, PlanEntry, Role, SellerOrderStatus, StatusEvent, User,
} from "@/types";

/** localStorage can throw (private mode, blocked storage) — fall back to memory. */
const safeStorage = createJSONStorage(() => {
  try {
    const k = "__mm_probe";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
});

const now = () => new Date().toISOString();

/* ---------------- Catalogue edits (mock seller hub) ---------------- */
type OfferPatch = { price: number; stock: number };
interface CatalogState {
  overrides: Record<string, OfferPatch>; // key `${productId}:${sellerId}`
  version: number;
  updateOffer: (productId: string, sellerId: string, patch: OfferPatch) => void;
}

function applyOverrides(overrides: Record<string, OfferPatch>) {
  for (const p of products) for (const o of p.offers) {
    const ov = overrides[`${p.id}:${o.sellerId}`];
    if (ov) { o.price = ov.price; o.stock = ov.stock; o.priceUpdatedDaysAgo = 0; }
  }
}

export const useCatalog = create<CatalogState>()(
  persist(
    (set) => ({
      overrides: {},
      version: 0,
      updateOffer: (productId, sellerId, patch) =>
        set((s) => {
          const overrides = { ...s.overrides, [`${productId}:${sellerId}`]: patch };
          applyOverrides(overrides);
          return { overrides, version: s.version + 1 };
        }),
    }),
    { name: "mm-catalog", storage: safeStorage, onRehydrateStorage: () => (s) => s && applyOverrides(s.overrides) },
  ),
);

/* ---------------- Cart ---------------- */
interface CartState {
  lines: CartLine[];
  district: District;
  fulfilment: Fulfilment;
  setDistrict: (d: District) => void;
  setFulfilment: (f: Fulfilment) => void;
  add: (productId: string, sellerId: string, qty?: number) => void;
  addMany: (lines: CartLine[]) => void;
  setQty: (productId: string, sellerId: string, qty: number) => void;
  changeSeller: (productId: string, from: string, to: string) => void;
  remove: (productId: string, sellerId: string) => void;
  clear: () => void;
}

const merge = (lines: CartLine[], l: CartLine) => {
  const i = lines.findIndex((x) => x.productId === l.productId && x.sellerId === l.sellerId);
  if (i === -1) return [...lines, l];
  const copy = [...lines];
  copy[i] = { ...copy[i], qty: copy[i].qty + l.qty };
  return copy;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      district: "Gasabo",
      fulfilment: "delivery",
      setDistrict: (district) => set({ district }),
      setFulfilment: (fulfilment) => set({ fulfilment }),
      add: (productId, sellerId, qty = 1) => set((s) => ({ lines: merge(s.lines, { productId, sellerId, qty }) })),
      addMany: (ls) => set((s) => ({ lines: ls.reduce(merge, s.lines) })),
      setQty: (productId, sellerId, qty) =>
        set((s) => ({
          lines: qty <= 0
            ? s.lines.filter((l) => !(l.productId === productId && l.sellerId === sellerId))
            : s.lines.map((l) => (l.productId === productId && l.sellerId === sellerId ? { ...l, qty } : l)),
        })),
      changeSeller: (productId, from, to) =>
        set((s) => {
          const line = s.lines.find((l) => l.productId === productId && l.sellerId === from);
          if (!line) return s;
          return { lines: merge(s.lines.filter((l) => l !== line), { ...line, sellerId: to }) };
        }),
      remove: (productId, sellerId) =>
        set((s) => ({ lines: s.lines.filter((l) => !(l.productId === productId && l.sellerId === sellerId)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "mm-cart", storage: safeStorage },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);

export function groupBySeller(lines: CartLine[], district: District, fulfilment: Fulfilment = "delivery") {
  const groups = new Map<string, CartLine[]>();
  lines.forEach((l) => groups.set(l.sellerId, [...(groups.get(l.sellerId) ?? []), l]));
  return [...groups.entries()].map(([sellerId, ls]) => {
    const seller = sellerById(sellerId);
    const subtotal = ls.reduce((t, l) => t + linePrice(l), 0);
    const collect = fulfilment === "collection" && seller.collection;
    return {
      seller, lines: ls, subtotal,
      deliveryFee: collect ? 0 : seller.zoneFees[district],
      eta: seller.etaHours[district],
      collect,
    };
  });
}

/* ---------------- Accounts (mock) ---------------- */
interface Account extends User {
  passwordHash?: string; // SHA-256 of salt+password — never the password itself
  createdAt: string;
}

export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`mm:${email.toLowerCase()}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Demo staff accounts so the seller hub and admin can be reviewed. Phone sign-in only.
const DEMO_ACCOUNTS: Account[] = [
  { id: "u-seller", name: "Kimironko Fresh", phone: "250788000101", role: "seller", createdAt: "2026-01-10T08:00:00Z" },
  { id: "u-admin", name: "MealMatch Admin", phone: "250788000900", role: "admin", createdAt: "2026-01-10T08:00:00Z" },
];

interface AuthState {
  accounts: Account[];
  user: User | null;
  register: (a: { name: string; phone: string; email?: string; password?: string }) => Promise<"ok" | "exists">;
  loginWithPhone: (msisdn: string) => "ok" | "not_found";
  loginWithEmail: (email: string, password: string) => Promise<"ok" | "invalid">;
  updateProfile: (p: Partial<Pick<User, "name" | "email">>) => void;
  logout: () => void;
}

const publicUser = ({ passwordHash: _p, createdAt: _c, ...u }: Account): User => u;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      user: null,
      register: async ({ name, phone, email, password }) => {
        const all = [...DEMO_ACCOUNTS, ...get().accounts];
        if (all.some((a) => a.phone === phone || (email && a.email?.toLowerCase() === email.toLowerCase()))) return "exists";
        const acc: Account = {
          id: crypto.randomUUID(), name, phone, email: email || undefined, role: "customer", createdAt: now(),
          passwordHash: email && password ? await hashPassword(email, password) : undefined,
        };
        set((s) => ({ accounts: [...s.accounts, acc], user: publicUser(acc) }));
        return "ok";
      },
      loginWithPhone: (msisdn) => {
        const acc = [...DEMO_ACCOUNTS, ...get().accounts].find((a) => a.phone === msisdn);
        if (!acc) return "not_found";
        set({ user: publicUser(acc) });
        return "ok";
      },
      loginWithEmail: async (email, password) => {
        const acc = get().accounts.find((a) => a.email?.toLowerCase() === email.toLowerCase());
        if (!acc?.passwordHash || acc.passwordHash !== (await hashPassword(email, password))) return "invalid";
        set({ user: publicUser(acc) });
        return "ok";
      },
      updateProfile: (p) =>
        set((s) => s.user ? {
          user: { ...s.user, ...p },
          accounts: s.accounts.map((a) => (a.id === s.user!.id ? { ...a, ...p } : a)),
        } : s),
      logout: () => set({ user: null }),
    }),
    { name: "mm-auth", storage: safeStorage },
  ),
);

export const hasRole = (u: User | null, roles: Role[]) => !!u && roles.includes(u.role);

/* ---------------- Household, pantry, plan, favourites ---------------- */
export const defaultProfile: HouseholdProfile = {
  type: "family", adults: 2, children: 2, weeklyBudget: 70000, days: 7, slots: ["lunch", "dinner"],
  maxCookMinutes: 90, vegetarian: false, allergies: [], likes: ["traditional"], usePantry: true,
};

interface HouseholdState {
  profile: HouseholdProfile;
  onboarded: boolean;
  plan: PlanEntry[];
  pantry: PantryItem[];
  favorites: string[];
  saveProfile: (p: HouseholdProfile) => void;
  setPlan: (entries: PlanEntry[]) => void;
  setPantry: (productId: string, qty: number, expiresOn?: string) => void;
  toggleFavorite: (recipeId: string) => void;
}

export const useHousehold = create<HouseholdState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      onboarded: false,
      plan: [],
      pantry: [],
      favorites: [],
      saveProfile: (profile) => set({ profile, onboarded: true }),
      setPlan: (plan) => set({ plan }),
      setPantry: (productId, qty, expiresOn) =>
        set((s) => {
          const rest = s.pantry.filter((p) => p.productId !== productId);
          return { pantry: qty > 0 ? [...rest, { productId, qty, expiresOn }] : rest };
        }),
      toggleFavorite: (id) => set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
    }),
    { name: "mm-household-v2", storage: safeStorage },
  ),
);

/* ---------------- Orders + payments (mock backend) ---------------- */
interface PlaceInput {
  userId: string;
  lines: CartLine[];
  district: District;
  fulfilment: Fulfilment;
  address: string;
  phone: string;
  channel: "web" | "whatsapp";
}

interface OrdersState {
  orders: Order[];
  place: (input: PlaceInput) => Order;
  /** Creates a new attempt; refuses while another attempt for the order is still pending (no double charge). */
  startPayment: (orderId: string, provider: PaymentProvider, msisdn: string) => PaymentAttempt | null;
  /** Mock provider result. Idempotent: a final attempt never changes again. */
  resolvePayment: (orderId: string, attemptId: string, status: Exclude<PaymentStatus, "initiated" | "pending">) => void;
  setSellerStatus: (orderId: string, sellerId: string, status: SellerOrderStatus) => void;
  confirmWhatsApp: (orderId: string, sellerId: string) => void;
}

const event = (kind: StatusEvent["kind"], status: string, sellerId?: string): StatusEvent => ({ at: now(), kind, status, sellerId });
const FINAL: PaymentStatus[] = ["successful", "failed", "cancelled", "expired"];

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      place: ({ userId, lines, district, fulfilment, address, phone, channel }) => {
        const groups = groupBySeller(lines, district, fulfilment);
        const status: OrderStatus = channel === "whatsapp" ? "awaiting_seller_confirmation" : "pending_payment";
        const sellerOrders = groups.map((g) => ({
          sellerId: g.seller.id,
          lines: g.lines.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: linePrice(l) / l.qty })),
          subtotal: g.subtotal,
          deliveryFee: g.deliveryFee,
          status: "pending" as SellerOrderStatus,
        }));
        const subtotal = groups.reduce((t, g) => t + g.subtotal, 0);
        const deliveryTotal = groups.reduce((t, g) => t + g.deliveryFee, 0);
        const order: Order = {
          id: crypto.randomUUID(),
          number: `MM-${new Date().getFullYear()}-${1041 + get().orders.length}`,
          createdAt: now(), userId, channel, fulfilment, status, district, address, phone,
          sellerOrders, payments: [], history: [event("order", status)],
          subtotal, deliveryTotal, total: subtotal + deliveryTotal, currency: "RWF",
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },
      startPayment: (orderId, provider, msisdn) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== "pending_payment") return null;
        if (order.payments.some((p) => !FINAL.includes(p.status))) return null;
        const attempt: PaymentAttempt = {
          id: crypto.randomUUID(), provider, msisdn, amount: order.total, currency: "RWF",
          status: "pending", mock: true, createdAt: now(), updatedAt: now(),
        };
        set((s) => ({
          orders: s.orders.map((o) => o.id === orderId
            ? { ...o, payments: [...o.payments, attempt], history: [...o.history, event("payment", "pending")] }
            : o),
        }));
        return attempt;
      },
      resolvePayment: (orderId, attemptId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const att = o.payments.find((p) => p.id === attemptId);
            if (!att || FINAL.includes(att.status)) return o; // idempotent
            const paid = status === "successful";
            return {
              ...o,
              status: paid ? "confirmed" : o.status,
              payments: o.payments.map((p) => (p.id === attemptId ? { ...p, status, updatedAt: now() } : p)),
              history: [...o.history, event("payment", status), ...(paid ? [event("order", "confirmed")] : [])],
            };
          }),
        })),
      setSellerStatus: (orderId, sellerId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const sellerOrders = o.sellerOrders.map((so) => (so.sellerId === sellerId ? { ...so, status } : so));
            const done = sellerOrders.every((so) => ["delivered", "collected", "rejected"].includes(so.status));
            return {
              ...o, sellerOrders,
              status: done && o.status === "confirmed" ? "completed" : o.status,
              history: [...o.history, event("seller", status, sellerId)],
            };
          }),
        })),
      confirmWhatsApp: (orderId, sellerId) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const sellerOrders = o.sellerOrders.map((so) => (so.sellerId === sellerId ? { ...so, status: "accepted" as SellerOrderStatus } : so));
            const all = sellerOrders.every((so) => so.status === "accepted" || so.status === "rejected");
            return {
              ...o, sellerOrders,
              status: all ? "pending_payment" : o.status,
              history: [...o.history, event("seller", "accepted", sellerId), ...(all ? [event("order", "pending_payment")] : [])],
            };
          }),
        })),
    }),
    { name: "mm-orders-v2", storage: safeStorage },
  ),
);

export const latestPayment = (o: Order) => o.payments.at(-1);
