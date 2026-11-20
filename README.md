# Smart MealMatch — Frontend

React 19 + Vite + TypeScript + Tailwind CSS v4. English, Kinyarwanda and French. Currency RWF.

> **Prototype.** Sellers, prices, ratings, chefs, delivery fees and payments are simulated. No real money moves,
> no SMS or email is sent, and the "AI" assistant is a rule-based preview. Every simulated feature is labelled in the UI.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm test             # unit + component tests (Vitest)
npm run test:e2e     # browser tests at 320/390/768/1440 px (Playwright; first run: npx playwright install chromium)
npm run i18n:check   # fails if rw/fr are missing keys from en
```

## Try it

| Journey | Where |
|---|---|
| Browse without an account | Home, Recipes, Meal Kits, Shop Ingredients, Chefs, seller pages, Help |
| Create an account | `/register` — phone + one-time code (any 6 digits in the prototype), optional email + password |
| Plan meals | `/planner` — 6-step setup with review → weekly plan with budget panel → buy from sellers / market list / WhatsApp |
| Cook with what I have | `/cook` — search or tap ingredients; buy only what's missing |
| Pay | Checkout → MTN (078/079) or Airtel (072/073) number → mock approval screen (auto-approves after ~9 s, or use *Simulate*) |
| Seller hub | Sign in with phone **0788 000 101** |
| Admin | Sign in with phone **0788 000 900** |

Accounts are required for personal features (planner, Cook with what I have, pantry, market list, saved recipes,
checkout, orders). Browsing stays open so visitors can understand the product first.

## Structure

| Path | Purpose |
|---|---|
| `src/index.css` | Design tokens (`@theme`) — contrast-checked colours, radii, shadow, fonts |
| `src/components/ui.tsx` | Primitives: Button, Badge, MockBadge, FreshnessBadge, Price, Img, Avatar, Stepper, Chip, Segmented, Field, Dialog… |
| `src/components/layout.tsx` | Store shell (header, mobile menu dialog, tab bar, footer) and dashboard shell |
| `src/components/AuthGate.tsx` | Explains why an account is needed instead of a silent redirect |
| `src/components/PaymentForm.tsx` | Provider + number selection with MTN/Airtel prefix detection |
| `src/lib/food.ts` | Integer-safe costs, shopping list, pantry subtraction, seller assignment |
| `src/lib/planner.ts` | Rules engine: allergy/diet/time filters, budget pass, pro-rated budget |
| `src/lib/assistant.ts` | Free-text parser (stand-in for the LLM) in en/rw/fr |
| `src/store/index.ts` | Mock backend: accounts (hashed passwords), cart, household, orders + payment attempts |
| `src/data/*` | Sample catalogue, recipes, chefs |
| `src/i18n/*.json` | UI strings; rw/fr load on demand |
| `public/images/` | Licensed photos in 400/800/1200 px WebP — see `ATTRIBUTION.md` |

## Rules the code follows

- **Money**: whole RWF integers only; every line is rounded before summing.
- **Order vs payment status** are separate fields with a status history. Payment resolution is idempotent and a second
  attempt is refused while one is pending (no double charge).
- **Prices**: seller prices show their age; market prices are always labelled *Market estimate*.
- **Honesty**: verification badges, ratings, fees and testimonials are marked as sample data. Chef profiles use
  initials, not photos of real people.

## Translations

`rw.json` and `fr.json` were drafted by the developer and **must be reviewed by fluent speakers** before release.
Kinyarwanda especially: commerce terms, day names and the assistant's word list in `src/lib/assistant.ts`.
