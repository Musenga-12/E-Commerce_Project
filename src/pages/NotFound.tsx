import { useTranslation } from "react-i18next";
import { Container } from "@/components/layout";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Container className="max-w-lg py-24 text-center">
      <p className="text-6xl" aria-hidden>🥄</p>
      <h1 className="mt-6 font-display text-3xl font-semibold">{t("notFound.title")}</h1>
      <ButtonLink to="/" className="mt-8">{t("notFound.back")}</ButtonLink>
    </Container>
  );
}
