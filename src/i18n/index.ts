import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "rw", label: "Ikinyarwanda", short: "RW" },
  { code: "fr", label: "Français", short: "FR" },
] as const;

// English ships in the main bundle; other locales load on demand to keep first load small.
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  rw: () => import("./rw.json"),
  fr: () => import("./fr.json"),
};

async function ensureLoaded(lng: string) {
  const code = lng.slice(0, 2);
  if (code === "en" || i18n.hasResourceBundle(code, "translation") || !loaders[code]) return;
  const mod = await loaders[code]();
  i18n.addResourceBundle(code, "translation", mod.default, true, true);
}

/** Use instead of i18n.changeLanguage so the bundle is present before switching. */
export async function setLanguage(lng: string) {
  await ensureLoaded(lng);
  await i18n.changeLanguage(lng);
  // Persist explicitly as a fallback for browsers that block detector caching.
  try { localStorage.setItem("mm-lang", lng); } catch { /* Language switching still works for this session. */ }
}

const i18nInitialized = i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    partialBundledLanguages: true,
    fallbackLng: "en",
    supportedLngs: ["en", "rw", "fr"],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

/** Resolve only after detection completes, then load and activate that locale before first paint. */
export const i18nReady = i18nInitialized.then(async () => {
  let savedLanguage: string | null = null;
  try { savedLanguage = localStorage.getItem("mm-lang"); } catch { /* Storage can be disabled in private browsing. */ }
  const browserLanguage = typeof navigator === "undefined" ? "en" : navigator.language.slice(0, 2);
  const candidate = savedLanguage ?? browserLanguage ?? i18n.resolvedLanguage ?? "en";
  const language = LANGUAGES.some((option) => option.code === candidate) ? candidate : "en";
  await ensureLoaded(language);
  await i18n.changeLanguage(language);
  document.documentElement.lang = language;
});

export default i18n;
