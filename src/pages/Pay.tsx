// Payment approval screen — MOCK provider. Mirrors the planned backend flow (plan §4): the provider
// pushes a PIN prompt and the backend polls status until success, failure or expiry. Here the
// store's resolvePayment() plays the provider; it is idempotent and refuses a second pending attempt.
import clsx from "clsx";
import { CheckCircle2, Clock, Smartphone, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Container } from "@/components/layout";
import { PaymentForm } from "@/components/PaymentForm";
import { Button, MockBadge } from "@/components/ui";
import { displayPhone, formatRWF } from "@/lib/format";
import { latestPayment, useAuth, useOrders } from "@/store";

const EXPIRY_SECONDS = 120;
const MOCK_APPROVE_AFTER = 9;

function PayInner() {
  const { orderId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user)!;
  const order = useOrders((s) => s.orders.find((o) => o.id === orderId && o.userId === user.id));
  const { resolvePayment, startPayment } = useOrders();
  const attempt = order ? latestPayment(order) : undefined;
  const pending = attempt?.status === "pending";
  const [left, setLeft] = useState(EXPIRY_SECONDS);

  useEffect(() => {
    if (!order || !attempt || !pending) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(attempt.createdAt).getTime()) / 1000);
      setLeft(Math.max(0, EXPIRY_SECONDS - elapsed));
      if (elapsed >= EXPIRY_SECONDS) resolvePayment(order.id, attempt.id, "expired");
      else if (elapsed >= MOCK_APPROVE_AFTER) resolvePayment(order.id, attempt.id, "successful");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order, attempt, pending, resolvePayment]);

  if (!order) return <Navigate to="/account" replace />;

  const providerName = attempt?.provider === "airtel" ? "Airtel Money" : "MTN MoMo";
  const ussd = attempt?.provider === "airtel" ? "*182*7#" : "*182*7*1#";
  const mm = Math.floor(left / 60);
  const ss = (left % 60).toString().padStart(2, "0");

  if (order.status === "awaiting_seller_confirmation") return <Navigate to={`/orders/${order.id}`} replace />;

  return (
    <Container className="max-w-lg">
      <div className="mb-4 flex justify-center"><MockBadge label={t("mock.payment")} className="text-center" /></div>
      <div className="card p-6 text-center sm:p-10" aria-live="polite">
        {order.status === "confirmed" || order.status === "completed" ? (
          <div className="animate-fade-up">
            <CheckCircle2 className="mx-auto size-16 text-brand-600" aria-hidden />
            <h1 className="mt-4 font-display text-2xl font-semibold">{t("pay.success")}</h1>
            <p className="tabular mt-2 text-lg font-semibold">{formatRWF(order.total)}</p>
            <p className="mt-1 text-muted">{t("pay.successSub")}</p>
            <Button size="lg" className="mt-8 w-full" onClick={() => navigate(`/orders/${order.id}`)}>{t("pay.viewOrder")}</Button>
          </div>
        ) : pending && attempt ? (
          <>
            <div className="relative mx-auto grid size-24 place-items-center" aria-hidden>
              <span className={clsx("absolute inset-0 animate-pulse-ring rounded-full", attempt.provider === "mtn" ? "bg-mtn" : "bg-airtel")} />
              <span className={clsx("relative grid size-20 place-items-center rounded-full", attempt.provider === "mtn" ? "bg-mtn text-ink" : "bg-airtel text-white")}>
                <Smartphone className="size-9" />
              </span>
            </div>
            <h1 className="mt-6 font-display text-2xl font-semibold">{t("pay.title")}</h1>
            <p className="mt-3 text-muted">{t("pay.sent", { provider: providerName, amount: formatRWF(attempt.amount), phone: displayPhone(attempt.msisdn) })}</p>
            <p className="mt-2 text-sm font-medium">{t("pay.instruction")}</p>
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-sunken px-4 py-2 text-sm">
              <Clock className="size-4 text-muted" aria-hidden />
              {t("pay.waiting", { provider: providerName })}
              <span className="tabular font-semibold">{t("pay.expiresIn", { time: `${mm}:${ss}` })}</span>
            </div>
            <p className="mt-6 text-xs text-muted">{t("pay.noPrompt", { ussd })}</p>

            <div className="mt-8 border-t border-dashed border-line pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t("pay.simulate")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => resolvePayment(order.id, attempt.id, "successful")}>{t("pay.approve")}</Button>
                <Button size="sm" variant="secondary" onClick={() => resolvePayment(order.id, attempt.id, "failed")}>{t("pay.decline")}</Button>
                <Button size="sm" variant="ghost" onClick={() => resolvePayment(order.id, attempt.id, "expired")}>{t("pay.timeout")}</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-fade-up text-left">
            {attempt && (
              <div className="mb-6 text-center">
                <XCircle className="mx-auto size-14 text-danger" aria-hidden />
                <h1 className="mt-3 font-display text-2xl font-semibold">{attempt.status === "expired" ? t("pay.expired") : attempt.status === "cancelled" ? t("pay.cancelled") : t("pay.failed")}</h1>
                <p className="mt-2 text-muted">{t("pay.failedSub")}</p>
              </div>
            )}
            {!attempt && <h1 className="mb-5 font-display text-2xl font-semibold">{t("order.payNow", { amount: formatRWF(order.total) })}</h1>}
            <PaymentForm amount={order.total} defaultPhone={attempt?.msisdn ?? user.phone} submitLabel={attempt ? t("pay.retry") : undefined}
              onSubmit={(provider, msisdn) => startPayment(order.id, provider, msisdn)} />
            <Button variant="ghost" className="mt-3 w-full" onClick={() => navigate(`/orders/${order.id}`)}>{t("pay.viewOrder")}</Button>
          </div>
        )}
      </div>
    </Container>
  );
}

export default function Pay() {
  return <AuthGate feature="checkout"><PayInner /></AuthGate>;
}
