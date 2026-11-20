import { Package, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { Badge, Button, EmptyState, Img, PageHeader, Stepper } from "@/components/ui";
import { groceryProducts, productById } from "@/data/catalog";
import { formatDate, formatQty, loc } from "@/lib/format";
import { useHousehold } from "@/store";

const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5);

function PantryInner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { pantry, setPantry } = useHousehold();
  const [pid, setPid] = useState(groceryProducts[0].id);
  const [exp, setExp] = useState("");
  const sorted = [...pantry].sort((a, b) => (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999"));

  const add = (e: FormEvent) => {
    e.preventDefault();
    const current = pantry.find((p) => p.productId === pid);
    setPantry(pid, (current?.qty ?? 0) + 1, exp || current?.expiresOn);
    setExp("");
  };

  return (
    <Container className="max-w-3xl">
      <PageHeader title={t("pantry.title")} sub={t("pantry.subtitle")} />
      <form onSubmit={add} className="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <label>
          <span className="label">{t("pantry.item")}</span>
          <select className="field" value={pid} onChange={(e) => setPid(e.target.value)}>
            {groceryProducts.map((p) => <option key={p.id} value={p.id}>{loc(p.name, lang)} · {loc(p.unit, lang)}</option>)}
          </select>
        </label>
        <label>
          <span className="label">{t("pantry.expiry")} <span className="font-normal text-muted">({t("common.optional")})</span></span>
          <input type="date" className="field" value={exp} onChange={(e) => setExp(e.target.value)} />
        </label>
        <Button type="submit">{t("pantry.add")}</Button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState icon={<Package className="size-6" />} title={t("pantry.empty")} sub={t("pantry.emptySub")} />
      ) : (
        <ul className="card divide-y divide-line">
          {sorted.map((item) => {
            const p = productById(item.productId)!;
            const soon = item.expiresOn && daysUntil(item.expiresOn) <= 3;
            return (
              <li key={item.productId} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                <Img src={p.image} alt="" fallback={p.emoji} className="size-12 shrink-0 rounded-lg" sizes="48px" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{loc(p.name, lang)}</p>
                  <p className="text-xs text-muted">{formatQty(item.qty)} × {loc(p.unit, lang)}{item.expiresOn && <> · {t("pantry.expires", { date: formatDate(item.expiresOn) })}</>}</p>
                </div>
                {soon && <Badge tone="accent">{t("pantry.useSoon")}</Badge>}
                <Stepper value={item.qty} onChange={(q) => setPantry(item.productId, q, item.expiresOn)} label={loc(p.name, lang)} />
                <button type="button" onClick={() => setPantry(item.productId, 0)} className="grid size-10 place-items-center rounded-full text-muted hover:bg-sunken hover:text-danger" aria-label={`${t("common.remove")} ${loc(p.name, lang)}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}

export default function Pantry() {
  return <AuthGate feature="pantry"><PantryInner /></AuthGate>;
}
