import clsx from "clsx";
import { CalendarDays, ChefHat, Globe, Home, LayoutDashboard, Menu, Search, ShoppingBag, Store, User } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LANGUAGES, setLanguage } from "@/i18n";
import { cartCount, useAuth, useCart } from "@/store";
import { Toaster } from "./toast";
import { Dialog, MockBadge } from "./ui";

export function Logo({ className, inverse }: { className?: string; inverse?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link to="/" className={clsx("flex shrink-0 items-center gap-2", className)} aria-label={t("nav.homeLink")}>
      <span className="grid size-9 place-items-center rounded-lg bg-brand-600 text-white" aria-hidden>
        <svg viewBox="0 0 32 32" className="size-6">
          <path d="M8 21c0-5 3.6-9 8-9s8 4 8 9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="16" cy="8.5" r="2.2" fill="#e8a33d" />
        </svg>
      </span>
      <span className={clsx("font-display text-lg leading-none font-semibold tracking-tight", inverse ? "text-white" : "text-ink")}>
        <span className="hidden text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-muted sm:block">Smart</span>
        Meal<span className={inverse ? "text-accent-100" : "text-brand-600"}>Match</span>
      </span>
    </Link>
  );
}

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("nav.language")}</span>
      <Globe className="pointer-events-none absolute left-2.5 size-4 text-muted" aria-hidden />
      <select
        value={current.code}
        onChange={(e) => setLanguage(e.target.value)}
        className={clsx(
          "min-h-10 cursor-pointer appearance-none rounded-full border border-line-strong/40 bg-surface pl-8 pr-3 text-sm font-medium text-ink-soft hover:border-ink/50",
          compact ? "w-[4.5rem]" : "w-auto",
        )}
      >
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{compact ? l.short : l.label}</option>)}
      </select>
    </label>
  );
}

function SearchBox({ onDone, id }: { onDone?: () => void; id: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">{t("nav.search")}</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nav.search")}
        className="min-h-10 w-full rounded-full border border-line-strong/40 bg-surface pl-10 pr-4 text-sm placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
    </form>
  );
}

const mainNav = [
  { to: "/", key: "nav.home", end: true },
  { to: "/planner", key: "nav.planner" },
  { to: "/recipes", key: "nav.recipes" },
  { to: "/kits", key: "nav.kits" },
  { to: "/shop", key: "nav.shop" },
  { to: "/chefs", key: "nav.chefs" },
];
const toolNav = [
  { to: "/cook", key: "nav.cook" },
  { to: "/market", key: "nav.market" },
  { to: "/pantry", key: "nav.pantry" },
  { to: "/favorites", key: "nav.favorites" },
];

function Header() {
  const { t } = useTranslation();
  const count = useCart((s) => cartCount(s.lines));
  const user = useAuth((s) => s.user);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-3">
        <button className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-sunken xl:hidden" onClick={() => setOpen(true)} aria-label={t("nav.menu")} aria-haspopup="dialog">
          <Menu className="size-5" aria-hidden />
        </button>
        <Logo />
        <nav className="ml-4 hidden items-center xl:flex" aria-label={t("nav.main")}>
          {mainNav.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => clsx(
                "rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                isActive ? "bg-sunken text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden w-56 md:block lg:w-64"><SearchBox id="search-desktop" /></div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <div className="hidden sm:block"><LanguageSwitcher compact /></div>
          {user?.role === "seller" && <Link to="/seller" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:bg-sunken 2xl:block">{t("nav.sellerHub")}</Link>}
          {user?.role === "admin" && <Link to="/admin" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:bg-sunken 2xl:block">{t("nav.admin")}</Link>}
          {user ? (
            <Link to="/account" className="grid size-11 place-items-center rounded-full hover:bg-sunken" aria-label={t("nav.account")}>
              <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700" aria-hidden>{user.name.charAt(0).toUpperCase()}</span>
            </Link>
          ) : (
            <Link to="/login" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sunken">
              <User className="size-5" aria-hidden /><span className="hidden sm:inline">{t("nav.signIn")}</span><span className="sr-only sm:hidden">{t("nav.signIn")}</span>
            </Link>
          )}
          <Link to="/cart" className="relative grid size-11 place-items-center rounded-full hover:bg-sunken" aria-label={t("nav.cartCount", { count })}>
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && <span className="tabular absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-ink" aria-hidden>{count}</span>}
          </Link>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={t("nav.menu")} side="left">
        <div className="flex flex-col gap-6">
          <SearchBox id="search-mobile" onDone={() => setOpen(false)} />
          <nav aria-label={t("nav.mobile")} className="flex flex-col gap-1">
            {mainNav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => clsx("rounded-lg px-3 py-3 font-medium", isActive ? "bg-sunken" : "hover:bg-sunken/70")}>{t(n.key)}</NavLink>
            ))}
            <hr className="my-2 border-line" />
            {toolNav.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => clsx("rounded-lg px-3 py-2.5 text-sm", isActive ? "bg-sunken font-medium" : "text-ink-soft hover:bg-sunken/70")}>{t(n.key)}</NavLink>
            ))}
            {user?.role === "seller" && <NavLink to="/seller" className="rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-sunken/70">{t("nav.sellerHub")}</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className="rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-sunken/70">{t("nav.admin")}</NavLink>}
          </nav>
          <LanguageSwitcher />
        </div>
      </Dialog>
    </header>
  );
}

function MobileTabBar() {
  const { t } = useTranslation();
  const count = useCart((s) => cartCount(s.lines));
  const tabs = [
    { to: "/", icon: Home, key: "nav.home", end: true },
    { to: "/planner", icon: CalendarDays, key: "nav.planner" },
    { to: "/recipes", icon: ChefHat, key: "nav.recipes" },
    { to: "/shop", icon: Store, key: "nav.shop" },
    { to: "/cart", icon: ShoppingBag, key: "nav.cart", badge: count },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label={t("nav.tabs")}>
      <div className="grid grid-cols-5">
        {tabs.map(({ to, icon: Icon, key, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx("relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight font-medium", isActive ? "text-brand-700" : "text-muted")}>
            <Icon className="size-5" aria-hidden />
            <span className="line-clamp-1 text-center">{t(key)}</span>
            {!!badge && <span className="tabular absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-ink" aria-hidden>{badge}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Footer() {
  const { t } = useTranslation();
  const cols = [
    { title: t("footer.explore"), links: [["/planner", "nav.planner"], ["/recipes", "nav.recipes"], ["/kits", "nav.kits"], ["/shop", "nav.shop"], ["/chefs", "nav.chefs"], ["/cook", "nav.cook"]] },
    { title: t("footer.help"), links: [["/help/how", "info.how.title"], ["/help/faq", "info.faq.title"], ["/help/delivery", "info.delivery.title"], ["/help/contact", "info.contact.title"]] },
    { title: t("footer.company"), links: [["/help/about", "info.about.title"], ["/help/privacy", "info.privacy.title"], ["/help/terms", "info.terms.title"], ["/seller", "footer.sell"]] },
  ];
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{t("footer.about")}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded bg-mtn px-2 py-1 text-ink">MTN MoMo</span>
            <span className="rounded bg-airtel px-2 py-1 text-white">Airtel Money</span>
            <MockBadge />
          </div>
          <div className="mt-5"><LanguageSwitcher /></div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-semibold">{c.title}</p>
            <ul className="space-y-2.5 text-sm text-muted">
              {c.links.map(([to, key]) => <li key={to}><Link to={to} className="hover:text-ink hover:underline">{t(key)}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
          <span>{t("mock.banner")}</span>
        </div>
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow">
      {t("nav.skip")}
    </a>
  );
}

export function StoreLayout() {
  return (
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <ScrollToTop />
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <Toaster />
    </div>
  );
}

/** Shared shell for the seller hub and admin console. */
export function DashboardLayout({ title, nav }: { title: string; nav: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }[] }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  return (
    <div className="min-h-dvh bg-canvas">
      <ScrollToTop />
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Logo />
          <span className="hidden rounded-md bg-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft sm:inline">{title}</span>
          <MockBadge className="hidden md:inline-flex" />
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link to="/" className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:bg-sunken">{t("nav.home")}</Link>
            {user && <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700" aria-hidden>{user.name.charAt(0)}</span>}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden" aria-label={title}>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => clsx("shrink-0 rounded-full px-3 py-2 text-sm font-medium", isActive ? "bg-ink text-white" : "text-ink-soft hover:bg-sunken")}>{n.label}</NavLink>
          ))}
        </nav>
      </header>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 border-r border-line bg-surface p-4 lg:block">
          <nav className="flex flex-col gap-1" aria-label={title}>
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-sunken")}>
                <Icon className="size-4.5" aria-hidden /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("container-page py-8 sm:py-10", className)}>{children}</div>;
}
