import clsx from "clsx";
import { Check, ExternalLink, MessageCircle, PackageCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { PaymentForm } from "@/components/PaymentForm";
import { Button, Field, PageHeader } from "@/components/ui";
import { productById } from "@/data/catalog";
import { formatRWF, loc } from "@/lib/format";
import { whatsappLink, whatsappText } from "@/lib/whatsapp";
import { groupBySeller, useAuth, useCart, useOrders } from "@/store";
import { DISTRICTS, type Order } from "@/types";

function CheckoutInner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const whatsapp = params.get("channel") === "whatsapp";
  const user = useAuth((s) => s.user)!;
  const { lines, district, setDistrict, fulfilment, clear } = useCart();
  const { place, startPayment } = useOrders();
  const steps = t("checkout.steps", { returnObjects: true }) as string[];

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.name);
  const [sector, setSector] = useState("");
  const [street, setStreet] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [placingPayment, setPlacingPayment] = useState(false);
  const [opened, setOpened] = useState<string[]>([]);

  if (lines.length === 0 && !placed && !placingPayment) return <Navigate to="/cart" replace />;

  const groups = groupBySeller(lines, district, fulfilment);
  const subtotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const delivery = groups.reduce((s, g) => s + g.deliveryFee, 0);
  const total = subtotal + delivery;
  const needsAddress = groups.some((g) => !g.collect);

  const errors = {
    name: !name.trim() ? t("auth.nameError") : null,
    sector: needsAddress && !sector.trim() ? t("common.required") : null,
    street: needsAddress && !street.trim() ? t("common.required") : null,
  };
  const errorCount = Object.values(errors).filter(Boolean).length;

  const createOrder = () =>
    place({
      userId: user.id, lines, district, fulfilment, phone: user.phone, channel: whatsapp ? "whatsapp" : "web",
      address: needsAddress ? `${street.trim()}, ${sector.trim()}` : groups.map((g) => g.seller.collectionPoint).join("; "),
    });

  if (placed) {
    return (
      <Container className="max-w-2xl">
        <PageHeader title={`${t("checkout.whatsappTitle")} · ${placed.number}`} />
        <section className="card p-5 sm:p-6" aria-labelledby="wa-how">
          <h2 id="wa-how" className="font-semibold">{t("checkout.whatsappHow")}</h2>
          <ol className="mt-3 space-y-2 text-sm text-ink-soft">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-sunken text-xs font-semibold" aria-hidden>{n}</span>{t(`checkout.whatsappStep${n}`)}</li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg bg-accent-50 p-3 text-sm text-accent-700" role="note">{t("checkout.whatsappNote")}</p>
        </section>
        <ul className="mt-5 space-y-4">
          {placed.sellerOrders.map((so) => {
            const g = groups.find((x) => x.seller.id === so.sellerId);
            const sellerName = g?.seller.name ?? so.sellerId;
            return (
              <li key={so.sellerId} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{sellerName}</p>
                  <p className="tabular text-sm">{formatRWF(so.subtotal + so.deliveryFee)}</p>
                </div>
                <details className="mt-3">
                  <summary className="link cursor-pointer text-sm">{t("checkout.preview")}</summary>
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-sunken p-3 font-sans text-xs text-ink-soft">{whatsappText(placed, so)}</pre>
                </details>
                <a href={whatsappLink(placed, so)} target="_blank" rel="noreferrer" onClick={() => setOpened((o) => [...o, so.sellerId])}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold text-white hover:brightness-110">
                  <MessageCircle className="size-4" aria-hidden />{t("checkout.send", { seller: sellerName })}<ExternalLink className="size-3.5" aria-hidden />
                </a>
                {opened.includes(so.sellerId) && <span className="ml-3 inline-flex items-center gap-1 text-sm text-brand-700"><Check className="size-4" aria-hidden />{t("checkout.sent")}</span>}
              </li>
            );
          })}
        </ul>
        <Button variant="secondary" className="mt-6" onClick={() => navigate(`/orders/${placed.id}`)}>{t("checkout.viewOrder")}</Button>
      </Container>
    );
  }

  const summary = (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <section className="card p-5" aria-labelledby="sum-h">
        <h2 id="sum-h" className="font-semibold">{t("cart.summary")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("common.subtotal")}</dt><dd className="tabular">{formatRWF(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t("common.delivery")}</dt><dd className="tabular">{delivery ? formatRWF(delivery) : t("common.free")}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>{t("common.total")}</dt><dd className="tabular">{formatRWF(total)}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted">{t("cart.feesNote")}</p>
      </section>
    </aside>
  );

  return (
    <Container>
      <PageHeader title={whatsapp ? t("checkout.whatsappTitle") : t("checkout.title")} />
      <ol className="mb-8 flex gap-2 text-sm" aria-label={t("checkout.title")}>
        {(whatsapp ? steps.slice(0, 2) : steps).map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={clsx("flex flex-1 items-center gap-2 border-t-2 pt-2", i <= step ? "border-brand-600 font-semibold text-ink" : "border-line text-muted")}>
            <span className={clsx("grid size-6 place-items-center rounded-full text-xs", i < step ? "bg-brand-600 text-white" : i === step ? "bg-ink text-white" : "bg-sunken")} aria-hidden>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {step === 0 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); if (errorCount) return setShowErrors(true); setStep(1); }} className="space-y-6">
              {showErrors && errorCount > 0 && <p className="rounded-lg bg-danger-50 p-3 text-sm font-medium text-danger" role="alert">{t("checkout.errors", { count: errorCount })}</p>}
              <fieldset className="card p-5 sm:p-6">
                <legend className="sr-only">{t("checkout.contact")}</legend>
                <h2 className="mb-4 font-semibold">{t("checkout.contact")}</h2>
                <Field label={t("checkout.name")} error={showErrors ? errors.name : null}>
                  {(a) => <input {...a} className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
                </Field>
              </fieldset>
              <fieldset className="card p-5 sm:p-6">
                <legend className="sr-only">{t("checkout.address")}</legend>
                <h2 className="mb-4 font-semibold">{t("checkout.address")}</h2>
                {!needsAddress ? (
                  <p className="flex items-start gap-2 text-sm text-ink-soft"><PackageCheck className="mt-0.5 size-4 shrink-0" aria-hidden />{t("checkout.collectionInfo")}</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("checkout.district")}>
                      {(a) => <select {...a} className="field" value={district} onChange={(e) => setDistrict(e.target.value as typeof district)}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select>}
                    </Field>
                    <Field label={t("checkout.sector")} error={showErrors ? errors.sector : null}>
                      {(a) => <input {...a} className="field" value={sector} onChange={(e) => setSector(e.target.value)} autoComplete="address-level3" />}
                    </Field>
                    <Field className="sm:col-span-2" label={t("checkout.street")} error={showErrors ? errors.street : null}>
                      {(a) => <input {...a} className="field" value={street} onChange={(e) => setStreet(e.target.value)} placeholder={t("checkout.streetPh")} autoComplete="street-address" />}
                    </Field>
                  </div>
                )}
              </fieldset>
              <Button type="submit" size="lg">{t("checkout.toReview")}</Button>
            </form>
          )}

          {step === 1 && (
            <section className="space-y-4" aria-labelledby="review-h">
              <h2 id="review-h" className="font-semibold">{t("checkout.review")}</h2>
              {groups.map((g) => (
                <div key={g.seller.id} className="card p-4 text-sm">
                  <div className="flex justify-between gap-2 font-medium"><span>{g.seller.name}</span><span className="tabular">{formatRWF(g.subtotal)}</span></div>
                  <ul className="mt-2 space-y-1 text-muted">
                    {g.lines.map((l) => <li key={l.productId}>{l.qty} × {loc(productById(l.productId)!.name, lang)}</li>)}
                  </ul>
                  <p className="mt-2 flex justify-between text-xs text-ink-soft">
                    <span>{g.collect ? `${t("cart.collection")} · ${g.seller.collectionPoint}` : `${t("cart.delivery")} · ${district}`}</span>
                    <span className="tabular">{g.deliveryFee ? formatRWF(g.deliveryFee) : t("common.free")}</span>
                  </p>
                </div>
              ))}
              <p className="text-sm text-ink-soft">{name} · {needsAddress ? `${street}, ${sector}, ${district}` : t("checkout.collectionInfo")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>{t("common.back")}</Button>
                {whatsapp ? (
                  <Button variant="whatsapp" size="lg" onClick={() => { const o = createOrder(); clear(); setPlaced(o); }}>
                    <MessageCircle className="size-4" aria-hidden />{t("checkout.placeWhatsApp")}
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => setStep(2)}>{t("checkout.toPayment")}</Button>
                )}
              </div>
            </section>
          )}

          {step === 2 && !whatsapp && (
            <section className="card p-5 sm:p-6">
              <PaymentForm amount={total} defaultPhone={user.phone} onSubmit={(provider, msisdn) => {
                const order = createOrder();
                startPayment(order.id, provider, msisdn);
                setPlacingPayment(true);
                navigate(`/pay/${order.id}`, { replace: true });
                clear();
              }} />
              <Button variant="ghost" className="mt-3" onClick={() => setStep(1)}>{t("common.back")}</Button>
            </section>
          )}
        </div>
        {summary}
      </div>
    </Container>
  );
}

export default function Checkout() {
  return <AuthGate feature="checkout"><CheckoutInner /></AuthGate>;
}
