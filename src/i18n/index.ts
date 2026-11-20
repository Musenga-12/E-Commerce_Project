import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
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
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    partialBundledLanguages: true,
    fallbackLng: "en",
    supportedLngs: ["en", "rw", "fr"],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], lookupLocalStorage: "mm-lang", caches: ["localStorage"] },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

/** Resolves once the detected language's resources are ready (awaited before first render). */
export const i18nReady = ensureLoaded(i18n.resolvedLanguage ?? "en").then(() => {
  document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  return i18n.changeLanguage(i18n.resolvedLanguage);
});

export default i18n;
