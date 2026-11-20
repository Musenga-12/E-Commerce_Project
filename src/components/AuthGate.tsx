// Personal features need an account. Instead of a silent redirect, explain why and keep
// browsing one tap away — visitors can still understand the product before registering.
import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/store";
import { Container } from "./layout";
import { ButtonLink } from "./ui";

export type GatedFeature = "planner" | "cook" | "pantry" | "market" | "checkout" | "account" | "favorites" | "orders";

export function AuthGate({ feature, children }: { feature: GatedFeature; children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  if (user) return <>{children}</>;
  const next = encodeURIComponent(pathname + search);
  return (
    <Container className="max-w-xl py-16 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden>
        <LockKeyhole className="size-6" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold">{t("gate.title", { feature: t(`gate.features.${feature}`) })}</h1>
      <p className="mt-3 text-muted">{t("gate.sub")}</p>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <ButtonLink to={`/register?next=${next}`}>{t("gate.create")}</ButtonLink>
        <ButtonLink to={`/login?next=${next}`} variant="secondary">{t("gate.signIn")}</ButtonLink>
      </div>
      <ButtonLink to="/recipes" variant="ghost" className="mt-3">{t("gate.browse")}</ButtonLink>
    </Container>
  );
}
