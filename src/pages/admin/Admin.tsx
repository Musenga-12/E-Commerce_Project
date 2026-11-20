import { Bot, CalendarDays, FileText, LayoutDashboard, Scale, ShieldCheck, Store, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import { toast } from "@/components/toast";
import { Badge, Button, EmptyState, Img, MockBadge, PageHeader, Stat } from "@/components/ui";
import { productById, sellers } from "@/data/catalog";
import { formatRange, formatRWF, loc } from "@/lib/format";
import { latestPayment, useAuth, useOrders } from "@/store";

export function AdminShell() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "admin") return <Navigate to="/account" replace />;
  return (
    <DashboardLayout
      title={t("admin.title")}
      nav={[
        { to: "/admin", label: t("admin.overview"), icon: LayoutDashboard, end: true },
        { to: "/admin/sellers", label: t("admin.sellers"), icon: ShieldCheck },
        { to: "/admin/prices", label: t("admin.prices"), icon: Scale },
      ]}
    />
  );
}

export function AdminOverview() {
  const { t } = useTranslation();
  const orders = useOrders((s) => s.orders);
  const paid = orders.filter((o) => latestPayment(o)?.status === "successful");
  const gmv = paid.reduce((s, o) => s + o.total, 0);
  const days = t("planner.days7", { returnObjects: true }) as string[];
  // Orders per weekday from this browser's mock orders (Mon = 0).
  const perDay = days.map((_, i) => paid.filter((o) => (new Date(o.createdAt).getDay() + 6) % 7 === i).reduce((s, o) => s + o.total, 0));
  const peak = Math.max(1, ...perDay);
  return (
    <>
      <PageHeader title={t("admin.overview")} eyebrow={<MockBadge label={t("mock.sampleData")} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("admin.gmv")} value={formatRWF(gmv)} icon={<Wallet className="size-4" />} hint={t("common.items", { count: paid.length })} />
        <Stat label={t("admin.activeSellers")} value={String(sellers.length)} icon={<Store className="size-4" />} hint={t("admin.pending", { count: APPLICANTS.length })} />
        <Stat label={t("admin.plans")} value="—" icon={<CalendarDays className="size-4" />} />
        <Stat label={t("admin.aiCost")} value={t("admin.aiCostNone")} icon={<Bot className="size-4" />} />
      </div>
      <section className="card mt-6 p-5" aria-labelledby="gmv-h">
        <h2 id="gmv-h" className="font-semibold">{t("admin.gmv")}</h2>
        <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label={t("a11y.chart", { label: t("admin.gmv") })}>
          {perDay.map((v, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="tabular text-[10px] text-muted">{v ? formatRWF(v).replace("RWF ", "") : ""}</span>
              <div className="w-full rounded-t-md bg-brand-500" style={{ height: `${Math.max(2, (v / peak) * 100)}%` }} />
              <span className="text-xs text-muted">{days[i].slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const APPLICANTS = [
  { id: "a1", name: "Gisozi Organic Farm", district: "Gasabo", tin: "108 223 917", docs: 3, submitted: "18/11/2026" },
  { id: "a2", name: "Mama Keza Kitchen Supplies", district: "Kicukiro", tin: "109 551 208", docs: 2, submitted: "19/11/2026" },
  { id: "a3", name: "Lake Kivu Fish Traders", district: "Nyarugenge", tin: "107 664 031", docs: 3, submitted: "20/11/2026" },
];

export function AdminSellers() {
  const { t } = useTranslation();
  const [queue, setQueue] = useState(APPLICANTS);
  const decide = (id: string, ok: boolean) => {
    setQueue((q) => q.filter((a) => a.id !== id));
    toast(ok ? t("admin.approve") : t("admin.reject"));
  };
  return (
    <>
      <PageHeader title={t("admin.sellers")} sub={t("admin.pending", { count: queue.length })} eyebrow={<MockBadge label={t("mock.sampleData")} />} />
      {queue.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="size-6" />} title={t("admin.allDone")} />
      ) : (
        <ul className="space-y-3">
          {queue.map((a) => (
            <li key={a.id} className="card flex flex-wrap items-center gap-4 p-5">
              <span className="grid size-12 place-items-center rounded-lg bg-sunken font-display text-lg font-semibold" aria-hidden>{a.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-muted">{a.district} · {t("admin.tin")} {a.tin} · {t("admin.submitted", { date: a.submitted })}</p>
              </div>
              <Badge><FileText className="size-3" aria-hidden />{t("admin.documents", { count: a.docs })}</Badge>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(a.id, true)}>{t("admin.approve")}<span className="sr-only"> {a.name}</span></Button>
                <Button size="sm" variant="ghost" onClick={() => decide(a.id, false)}>{t("admin.reject")}<span className="sr-only"> {a.name}</span></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const OBSERVATIONS = [
  { id: "o1", productId: "p-tomato", market: "Kimironko", source: "scout", min: 850, max: 1000, observed: "20/11/2026" },
  { id: "o2", productId: "p-beans", market: "Nyabugogo", source: "community", min: 900, max: 1100, observed: "19/11/2026" },
  { id: "o3", productId: "p-rice", market: "Kicukiro", source: "seller", min: 1400, max: 1700, observed: "20/11/2026" },
  { id: "o4", productId: "p-chicken", market: "Kimironko", source: "scout", min: 5200, max: 6800, observed: "18/11/2026" },
] as const;

export function AdminPrices() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<readonly (typeof OBSERVATIONS)[number][]>(OBSERVATIONS);
  return (
    <>
      <PageHeader title={t("admin.prices")} sub={t("market.priceNote")} eyebrow={<MockBadge label={t("mock.sampleData")} />} />
      {rows.length === 0 ? <EmptyState icon={<Scale className="size-6" />} title={t("admin.allDone")} /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-line bg-sunken/50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                {[t("admin.product"), t("admin.market"), t("admin.source"), t("admin.range"), t("admin.observed")].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t("admin.approve")}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const p = productById(r.productId)!;
                return (
                  <tr key={r.id}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="flex items-center gap-2"><Img src={p.image} alt="" fallback={p.emoji} className="size-8 rounded" sizes="32px" />{loc(p.name, i18n.language)}</span>
                    </th>
                    <td className="px-4 py-3">{r.market}</td>
                    <td className="px-4 py-3"><Badge tone={r.source === "seller" ? "brand" : r.source === "scout" ? "accent" : "neutral"}>{t(`admin.sources.${r.source}`)}</Badge></td>
                    <td className="tabular px-4 py-3">{formatRange(r.min, r.max)}</td>
                    <td className="px-4 py-3 text-muted">{r.observed}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => { setRows(rows.filter((x) => x.id !== r.id)); toast(t("admin.approve")); }}>{t("admin.approve")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>{t("admin.reject")}</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
