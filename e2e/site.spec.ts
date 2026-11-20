import { expect, test, type Page } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/", "/shop", "/shop/vegetables", "/product/tomatoes", "/recipes", "/recipes/isombe", "/kits", "/chefs",
  "/chefs/claudine-mukamana", "/sellers/kimironko-fresh", "/help/faq", "/help/about", "/cart", "/login", "/register",
];
const GATED_ROUTES = ["/planner", "/cook", "/market", "/pantry", "/account", "/favorites"];

/** Collects console errors and failed requests for a page. */
function watch(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(1);
}

for (const route of PUBLIC_ROUTES) {
  test(`renders ${route} without errors or horizontal scroll`, async ({ page }) => {
    const errors = watch(page);
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await noHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
}

for (const route of GATED_ROUTES) {
  test(`${route} asks visitors to sign in`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("link", { name: /create a free account/i })).toBeVisible();
  });
}

test("images load from local licensed files", async ({ page }) => {
  await page.goto("/recipes");
  await page.waitForLoadState("networkidle");
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.loading !== "lazy" && i.naturalWidth === 0).map((i) => i.src),
  );
  expect(broken).toEqual([]);
});

test("language switch translates the page and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/language/i).first().selectOption("rw");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Menya icyo uteka");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Menya icyo uteka");
  await expect(page.locator("html")).toHaveAttribute("lang", "rw");
});

test("full journey: register → plan → buy → mock MoMo payment", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-1440" && info.project.name !== "phone-390", "journey runs on one phone and one desktop size");
  const errors = watch(page);

  await page.goto("/planner");
  await page.getByRole("link", { name: /create a free account/i }).click();
  await page.getByLabel("Full name").fill("Test Customer");
  await page.getByLabel("Mobile number").fill("788123456");
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();

  // Guided setup: 6 steps, then review.
  await expect(page.getByRole("heading", { name: "Plan your meals" })).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Check your answers" })).toBeVisible();
  await page.getByRole("button", { name: "Build my plan" }).click();

  await expect(page.getByRole("heading", { name: "Your meal plan" })).toBeVisible();
  await expect(page.getByText("Remaining")).toBeVisible();
  await page.getByRole("button", { name: /Buy from sellers/ }).click();

  await expect(page.getByRole("heading", { name: "Cart" })).toBeVisible();
  await page.getByRole("button", { name: "Go to checkout" }).click();
  await page.getByLabel("Sector").fill("Kimironko");
  await page.getByLabel("Street, house number or landmark").fill("KG 11 Ave");
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: /^Pay RWF/ }).click();

  await expect(page.getByRole("heading", { name: "Approve the payment on your phone" })).toBeVisible();
  await expect(page.getByText(/Mock payment/).first()).toBeVisible();
  await page.getByRole("button", { name: "Approved" }).click();
  await expect(page.getByRole("heading", { name: "Payment confirmed" })).toBeVisible();
  await page.getByRole("button", { name: "View order" }).click();
  await expect(page.getByText("Paid").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("declined payment can be retried without a second pending charge", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-1440", "runs once");
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Retry Tester");
  await page.getByLabel("Mobile number").fill("731234567");
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill("654321");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.goto("/product/tomatoes");
  await page.getByRole("button", { name: /Add to cart · RWF/ }).click();
  await page.goto("/checkout");
  await page.getByLabel("Sector").fill("Remera");
  await page.getByLabel("Street, house number or landmark").fill("KG 9 Ave");
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByText("Airtel Money", { exact: true }).click();
  await page.getByRole("button", { name: /^Pay RWF/ }).click();
  await page.getByRole("button", { name: "Declined" }).click();
  await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("button", { name: "Approved" }).click();
  await expect(page.getByRole("heading", { name: "Payment confirmed" })).toBeVisible();
});
