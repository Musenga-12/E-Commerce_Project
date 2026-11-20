import { ChevronRight, Heart, LogOut, Package, Receipt } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container, LanguageSwitcher } from "@/components/layout";
import { toast } from "@/components/toast";
import { Badge, Button, ButtonLink, EmptyState, Field } from "@/components/ui";
import { displayPhone, formatDate, formatRWF } from "@/lib/format";
import { latestPayment, useAuth, useHousehold, useOrders } from "@/store";
import { ALLERGENS } from "@/types";
import { orderTone, paymentTone } from "./Order";

function AccountInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { profile, onboarded, favorites, pantry } = useHousehold();
  const allOrders = useOrders((s) => s.orders); // select stable ref, filter outside (zustand v5)
  const orders = allOrders.filter((o) => o.userId === user!.id);
  const [name, setName] = useState(user!.name);
  const [email, setEmail] = useState(user!.email ?? "");
  if (!user) return null;

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile({ name: name.trim(), email: email.trim() || undefined });
    toast(t("account.profileSaved"));
  };

  return (
    <Container>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-16 place-items-center rounded-xl bg-brand-100 font-display text-2xl font-semibold text-brand-700" aria-hidden>{user.name.charAt(0)}</span>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold">{user.name}</h1>
          <p className="text-sm text-muted">{displayPhone(user.phone)}{user.email && ` · ${user.email}`}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { logout(); navigate("/"); }}><LogOut className="size-4" aria-hidden />{t("nav.signOut")}</Button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="mb-4 text-lg font-semibold">{t("account.orders")}</h2>
          {orders.length === 0 ? (
            <EmptyState icon={<Receipt className="size-6" />} title={t("order.none")} action={<ButtonLink to="/planner">{t("home.ctaPlan")}</ButtonLink>} />
          ) : (
            <ul className="card divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-sunken/40">
                    <span className="grid size-11 place-items-center rounded-lg bg-sunken text-muted" aria-hidden><Package className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{o.number}</p>
                      <p className="text-xs text-muted">{formatDate(o.createdAt)} · {t("common.items", { count: o.sellerOrders.reduce((n, s) => n + s.lines.length, 0) })} · {formatRWF(o.total)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={orderTone(o.status)}>{t(`order.status.${o.status}`)}</Badge>
                      <Badge tone={paymentTone(latestPayment(o)?.status)}>{t(`order.payment.${latestPayment(o)?.status ?? "none"}`)}</Badge>
                    </div>
                    <ChevronRight className="size-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <form onSubmit={save} className="card space-y-4 p-5" aria-labelledby="profile-h">
            <h2 id="profile-h" className="font-semibold">{t("account.profile")}</h2>
            <Field label={t("auth.name")} error={!name.trim() ? t("auth.nameError") : null}>
              {(a) => <input {...a} className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
            </Field>
            <Field label={`${t("auth.email")} (${t("common.optional")})`}>
              {(a) => <input {...a} type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}
            </Field>
            <Button type="submit" size="sm" variant="secondary">{t("common.save")}</Button>
          </form>

          <section className="card p-5" aria-labelledby="hh-h">
            <div className="flex items-center justify-between">
              <h2 id="hh-h" className="font-semibold">{t("account.household")}</h2>
              <Link to="/planner/setup" className="link text-sm">{t("common.edit")}</Link>
            </div>
            <p className="mt-2 text-sm text-muted">
              {onboarded ? t("account.householdSummary", { adults: profile.adults, children: profile.children, budget: formatRWF(profile.weeklyBudget) }) : t("account.notSet")}
            </p>
            {profile.allergies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ALLERGENS.filter((a) => profile.allergies.includes(a)).map((a) => <Badge key={a} tone="accent">{t(`allergens.${a}`)}</Badge>)}
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <Link to="/pantry" className="flex min-h-11 items-center justify-between rounded-lg bg-sunken/60 px-3 text-sm font-medium hover:bg-sunken">
                {t("nav.pantry")} <span className="flex items-center gap-1 text-muted">{pantry.length}<ChevronRight className="size-4" aria-hidden /></span>
              </Link>
              <Link to="/favorites" className="flex min-h-11 items-center justify-between rounded-lg bg-sunken/60 px-3 text-sm font-medium hover:bg-sunken">
                <span className="flex items-center gap-2"><Heart className="size-4" aria-hidden />{t("nav.favorites")}</span>
                <span className="flex items-center gap-1 text-muted">{favorites.length}<ChevronRight className="size-4" aria-hidden /></span>
              </Link>
            </div>
          </section>
          <section className="card flex items-center justify-between p-5">
            <h2 className="font-semibold">{t("account.language")}</h2>
            <LanguageSwitcher />
          </section>
          {user.role !== "customer" && (
            <ButtonLink to={user.role === "seller" ? "/seller" : "/admin"} variant="secondary" className="w-full">
              {user.role === "seller" ? t("nav.sellerHub") : t("nav.admin")}
            </ButtonLink>
          )}
        </aside>
      </div>
    </Container>
  );
}

export default function Account() {
  return <AuthGate feature="account"><AccountInner /></AuthGate>;
}
