// Help and company pages. Copy lives in i18n (info.*) so every page is translatable.
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/layout";
import NotFound from "./NotFound";

const PAGES = ["about", "how", "faq", "contact", "privacy", "terms", "delivery"] as const;
type PageKey = (typeof PAGES)[number];

export default function Info() {
  const { page } = useParams();
  const { t } = useTranslation();
  if (!PAGES.includes(page as PageKey)) return <NotFound />;
  const key = page as PageKey;

  return (
    <Container className="max-w-3xl">
      <div className="grid gap-10 md:grid-cols-[180px_1fr]">
        <nav aria-label={t("footer.help")} className="order-last md:order-first">
          <ul className="space-y-1 text-sm">
            {PAGES.map((p) => (
              <li key={p}>
                <Link to={`/help/${p}`} aria-current={p === key ? "page" : undefined}
                  className={p === key ? "block rounded-lg bg-sunken px-3 py-2 font-medium" : "block rounded-lg px-3 py-2 text-muted hover:text-ink"}>
                  {t(`info.${p}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article>
          <h1 className="font-display text-3xl font-semibold">{t(`info.${key}.title`)}</h1>
          {key === "faq" ? (
            <div className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
              {[1, 2, 3, 4, 5].map((n) => (
                <details key={n} className="group p-4">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-medium">
                    {t(`info.faq.q${n}`)}<span className="text-muted transition group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-2 text-ink-soft">{t(`info.faq.a${n}`)}</p>
                </details>
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-ink-soft">
              {t(`info.${key}.body`).split("\n\n").map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
            </div>
          )}
        </article>
      </div>
    </Container>
  );
}
