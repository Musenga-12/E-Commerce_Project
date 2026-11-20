// Fails if rw/fr translation files are missing keys present in en.json (or vice versa).
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../src/i18n/${l}.json`, import.meta.url), "utf8"));
const flatten = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? flatten(v, `${p}${k}.`) : [`${p}${k}`],
  );

const base = new Set(flatten(load("en")));
let failed = false;
for (const lang of ["rw", "fr"]) {
  const keys = new Set(flatten(load(lang)));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length || extra.length) failed = true;
  console.log(`${lang}: ${missing.length} missing, ${extra.length} extra`);
  missing.forEach((k) => console.log(`  - missing ${k}`));
  extra.forEach((k) => console.log(`  + extra   ${k}`));
}
process.exit(failed ? 1 : 0);
