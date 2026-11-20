import clsx from "clsx";
import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatRWF, normalizeMsisdn, providerFor } from "@/lib/format";
import type { PaymentProvider } from "@/types";
import { Button, Field, MockBadge } from "./ui";

const PROVIDERS: { id: PaymentProvider; label: string; cls: string; short: string }[] = [
  { id: "mtn", label: "MTN MoMo", cls: "bg-mtn text-ink", short: "MoMo" },
  { id: "airtel", label: "Airtel Money", cls: "bg-airtel text-white", short: "airtel" },
];

/** Provider + number selection, shared by checkout and the retry flow. */
export function PaymentForm({ amount, defaultPhone, onSubmit, submitLabel }: {
  amount: number; defaultPhone?: string; submitLabel?: string;
  onSubmit: (provider: PaymentProvider, msisdn: string) => void;
}) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(defaultPhone ? "0" + defaultPhone.slice(3) : "");
  const [provider, setProvider] = useState<PaymentProvider>(providerFor(normalizeMsisdn(defaultPhone ?? "")) ?? "mtn");
  const [touched, setTouched] = useState(false);
  const msisdn = normalizeMsisdn(phone);
  const detected = providerFor(msisdn);
  const error = touched && !msisdn ? t("checkout.invalidPhone") : null;
  const mismatch = msisdn && detected && detected !== provider ? t("checkout.providerMismatch", { provider: detected === "mtn" ? "MTN MoMo" : "Airtel Money" }) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!msisdn || mismatch) return;
    onSubmit(provider, msisdn);
  };

  return (
    <form onSubmit={submit} noValidate>
      <fieldset>
        <legend className="mb-3 font-semibold">{t("checkout.payment")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {PROVIDERS.map((p) => (
            <label key={p.id} className={clsx("flex min-h-14 cursor-pointer items-center gap-3 rounded-card border p-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
              provider === p.id ? "border-brand-600 bg-brand-50/50" : "border-line-strong/30 hover:border-ink/40")}>
              <input type="radio" name="provider" className="sr-only" checked={provider === p.id} onChange={() => setProvider(p.id)} />
              <span className={clsx("grid h-8 w-12 shrink-0 place-items-center rounded text-[11px] font-black", p.cls)} aria-hidden>{p.short}</span>
              <span className="text-sm font-semibold">{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field className="mt-5" label={t("checkout.momoNumber")} help={mismatch ? undefined : t("checkout.momoHint")} error={error ?? mismatch}>
        {(a) => (
          <input {...a} className="field tabular" inputMode="tel" autoComplete="tel" value={phone} placeholder="078 123 4567"
            onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} />
        )}
      </Field>
      <Button type="submit" size="lg" className="mt-6 w-full"><Lock className="size-4" aria-hidden />{submitLabel ?? t("checkout.pay", { amount: formatRWF(amount) })}</Button>
      <div className="mt-3 flex items-start gap-2 text-xs text-muted"><MockBadge /><span>{t("mock.payment")}</span></div>
    </form>
  );
}
