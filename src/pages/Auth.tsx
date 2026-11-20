// Accounts (mock backend): registration verifies the phone with a one-time code, sign-in works
// only for registered accounts. No SMS or email is sent in the prototype — the UI says so.
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LanguageSwitcher, Logo } from "@/components/layout";
import { Button, Field, Img, Segmented } from "@/components/ui";
import { displayPhone, normalizeMsisdn } from "@/lib/format";
import { useAuth } from "@/store";

type Mode = "login" | "register" | "reset";

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Img src="hero/cooking" alt="" priority sizes="50vw" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="max-w-md font-display text-3xl leading-tight">{t("brand.tagline")}</p>
        </div>
      </div>
      <div className="flex flex-col px-4 py-6 sm:px-12">
        <div className="flex items-center justify-between"><Logo /><LanguageSwitcher compact /></div>
        <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</main>
      </div>
    </div>
  );
}

export default function Auth({ mode }: { mode: Mode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register, loginWithPhone, loginWithEmail, user } = useAuth();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const msisdn = normalizeMsisdn(phone);
  const next = params.get("next");
  const done = () => {
    const role = useAuth.getState().user?.role;
    navigate(next || (role === "seller" ? "/seller" : role === "admin" ? "/admin" : "/planner"), { replace: true });
  };

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const errs = {
    name: mode === "register" && !name.trim() ? t("auth.nameError") : null,
    phone: (mode === "register" || tab === "phone") && !msisdn ? t("checkout.invalidPhone") : null,
    email: (tab === "email" || (mode === "register" && email)) && !emailOk ? t("auth.emailError") : null,
    password: (tab === "email" || (mode === "register" && email)) && password.length < 8 ? t("auth.passwordError") : null,
    confirm: mode === "register" && email && confirm !== password ? t("auth.confirmError") : null,
    code: codeSent && !/^\d{6}$/.test(code) ? t("auth.codeError") : null,
  };
  const show = (k: keyof typeof errs) => (touched ? errs[k] : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (mode === "reset") { if (!emailOk) return; setResetDone(true); return; }
    if (mode === "register") {
      if (errs.name || errs.phone || errs.email || errs.password || errs.confirm) return;
      if (!codeSent) { setCodeSent(true); setTouched(false); return; }
      if (errs.code) return;
      const r = await register({ name: name.trim(), phone: msisdn!, email: email.trim() || undefined, password: email ? password : undefined });
      return r === "exists" ? setFormError(t("auth.exists")) : done();
    }
    if (tab === "phone") {
      if (errs.phone) return;
      if (!codeSent) { setCodeSent(true); setTouched(false); return; }
      if (errs.code) return;
      return loginWithPhone(msisdn!) === "not_found" ? setFormError(t("auth.notFound")) : done();
    }
    if (errs.email || errs.password) return;
    (await loginWithEmail(email, password)) === "invalid" ? setFormError(t("auth.invalid")) : done();
  };

  if (user && mode !== "reset") {
    return <Shell><p className="text-center">{user.name}</p><Button className="mt-4" onClick={done}>{t("common.continue")}</Button></Shell>;
  }

  if (mode === "reset") {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold">{t("auth.resetTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.resetSub")}</p>
        {resetDone ? (
          <p className="mt-6 rounded-lg bg-brand-50 p-4 text-sm text-brand-700" role="status">{t("auth.resetSent", { email })}</p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <Field label={t("auth.email")} error={touched && !emailOk ? t("auth.emailError") : null}>
              {(a) => <input {...a} type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Button type="submit" size="lg" className="w-full">{t("auth.resetSend")}</Button>
          </form>
        )}
        <Link to="/login" className="link mt-6 text-center text-sm">{t("auth.signIn")}</Link>
      </Shell>
    );
  }

  const otpField = codeSent && (
    <Field label={t("auth.code")} error={show("code")} help={t("auth.codeSent", { phone: displayPhone(msisdn!) })}>
      {(a) => <input {...a} className="field tabular tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />}
    </Field>
  );

  const phoneField = (
    <Field label={t("auth.phone")} error={show("phone")}>
      {(a) => (
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line-strong bg-sunken px-3 text-sm text-muted" aria-hidden>+250</span>
          <input {...a} className="field tabular rounded-l-none" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="78 123 4567" disabled={codeSent} />
        </div>
      )}
    </Field>
  );

  return (
    <Shell>
      <h1 className="font-display text-3xl font-semibold">{mode === "login" ? t("auth.signInTitle") : t("auth.registerTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("auth.subtitle")}</p>

      {mode === "login" && (
        <div className="mt-6">
          <Segmented label={t("auth.signInTitle")} value={tab} onChange={(v) => { setTab(v); setFormError(null); setTouched(false); setCodeSent(false); }}
            options={[{ value: "phone", label: t("auth.phoneTab") }, { value: "email", label: t("auth.emailTab") }]} />
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {mode === "register" ? (
          <>
            <Field label={t("auth.name")} error={show("name")}>
              {(a) => <input {...a} className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" disabled={codeSent} />}
            </Field>
            {phoneField}
            <Field label={`${t("auth.email")} (${t("common.optional")})`} error={show("email")} help={t("auth.phoneEmailNote")}>
              {(a) => <input {...a} type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={codeSent} />}
            </Field>
            {email && (
              <>
                <Field label={t("auth.password")} error={show("password")} help={t("auth.passwordHelp")}>
                  {(a) => <input {...a} type="password" className="field" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={codeSent} />}
                </Field>
                <Field label={t("auth.confirmPassword")} error={show("confirm")}>
                  {(a) => <input {...a} type="password" className="field" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={codeSent} />}
                </Field>
              </>
            )}
            {otpField}
          </>
        ) : tab === "phone" ? (
          <>{phoneField}{otpField}</>
        ) : (
          <>
            <Field label={t("auth.email")} error={show("email")}>
              {(a) => <input {...a} type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Field label={t("auth.password")} error={show("password")}>
              {(a) => <input {...a} type="password" className="field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Field>
            <Link to="/reset-password" className="link inline-block text-sm">{t("auth.forgot")}</Link>
          </>
        )}

        {formError && (
          <p className="rounded-lg bg-danger-50 p-3 text-sm text-danger" role="alert">
            {formError}{" "}
            {formError === t("auth.notFound") && <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline">{t("auth.createAccount")}</Link>}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full">
          {codeSent ? t("auth.verify") : mode === "register" || tab === "phone" ? t("auth.sendCode") : t("auth.signIn")}
        </Button>
        {codeSent && <button type="button" className="link w-full text-center text-sm" onClick={() => { setCodeSent(false); setCode(""); }}>{t("auth.changeNumber")}</button>}
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
        <Link to={`${mode === "login" ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link">
          {mode === "login" ? t("auth.createAccount") : t("auth.signIn")}
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted">{t("auth.terms")}</p>
      {mode === "login" && (
        <div className="mt-6 rounded-lg border border-dashed border-line-strong/40 p-3 text-xs text-muted">
          <p className="font-semibold text-ink-soft">{t("auth.demo")}</p>
          <p className="mt-1">{t("auth.demoD")}</p>
        </div>
      )}
    </Shell>
  );
}
