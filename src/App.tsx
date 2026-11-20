import { lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StoreLayout } from "@/components/layout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

// Route-level code splitting keeps the first load small on mobile data.
const Shop = lazy(() => import("@/pages/Shop"));
const Product = lazy(() => import("@/pages/Product"));
const Recipes = lazy(() => import("@/pages/Recipes"));
const Favorites = lazy(() => import("@/pages/Recipes").then((m) => ({ default: m.Favorites })));
const directory = () => import("@/pages/Directory");
const Kits = lazy(() => directory().then((m) => ({ default: m.Kits })));
const Chefs = lazy(() => directory().then((m) => ({ default: m.Chefs })));
const ChefProfile = lazy(() => directory().then((m) => ({ default: m.ChefProfile })));
const SellerProfile = lazy(() => directory().then((m) => ({ default: m.SellerProfile })));
const Info = lazy(() => import("@/pages/Info"));
const Recipe = lazy(() => import("@/pages/Recipe"));
const Planner = lazy(() => import("@/pages/Planner"));
const PlannerSetup = lazy(() => import("@/pages/Planner").then((m) => ({ default: m.PlannerSetup })));
const Cook = lazy(() => import("@/pages/Cook"));
const Market = lazy(() => import("@/pages/Market"));
const Pantry = lazy(() => import("@/pages/Pantry"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Pay = lazy(() => import("@/pages/Pay"));
const Order = lazy(() => import("@/pages/Order"));
const Account = lazy(() => import("@/pages/Account"));
const Auth = lazy(() => import("@/pages/Auth"));

const seller = () => import("@/pages/seller/Seller");
const SellerShell = lazy(() => seller().then((m) => ({ default: m.SellerShell })));
const SellerOverview = lazy(() => seller().then((m) => ({ default: m.SellerOverview })));
const SellerOrders = lazy(() => seller().then((m) => ({ default: m.SellerOrders })));
const SellerOffers = lazy(() => seller().then((m) => ({ default: m.SellerOffers })));

const admin = () => import("@/pages/admin/Admin");
const AdminShell = lazy(() => admin().then((m) => ({ default: m.AdminShell })));
const AdminOverview = lazy(() => admin().then((m) => ({ default: m.AdminOverview })));
const AdminSellers = lazy(() => admin().then((m) => ({ default: m.AdminSellers })));
const AdminPrices = lazy(() => admin().then((m) => ({ default: m.AdminPrices })));

function Fallback() {
  const { t } = useTranslation();
  return (
    <div className="container-page grid min-h-[50vh] place-items-center">
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-brand-600" role="status" aria-label={t("a11y.loading")} />
    </div>
  );
}

const s = (el: ReactNode) => <Suspense fallback={<Fallback />}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/shop", element: s(<Shop />) },
      { path: "/shop/:category", element: s(<Shop />) },
      { path: "/product/:slug", element: s(<Product />) },
      { path: "/recipes", element: s(<Recipes />) },
      { path: "/recipes/:slug", element: s(<Recipe />) },
      { path: "/favorites", element: s(<Favorites />) },
      { path: "/kits", element: s(<Kits />) },
      { path: "/chefs", element: s(<Chefs />) },
      { path: "/chefs/:slug", element: s(<ChefProfile />) },
      { path: "/sellers/:slug", element: s(<SellerProfile />) },
      { path: "/help/:page", element: s(<Info />) },
      { path: "/planner", element: s(<Planner />) },
      { path: "/planner/setup", element: s(<PlannerSetup />) },
      { path: "/cook", element: s(<Cook />) },
      { path: "/market", element: s(<Market />) },
      { path: "/pantry", element: s(<Pantry />) },
      { path: "/cart", element: s(<Cart />) },
      { path: "/checkout", element: s(<Checkout />) },
      { path: "/pay/:orderId", element: s(<Pay />) },
      { path: "/orders/:orderId", element: s(<Order />) },
      { path: "/account", element: s(<Account />) },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: s(<Auth mode="login" />) },
  { path: "/register", element: s(<Auth mode="register" />) },
  { path: "/reset-password", element: s(<Auth mode="reset" />) },
  {
    path: "/seller",
    element: s(<SellerShell />),
    children: [
      { index: true, element: s(<SellerOverview />) },
      { path: "orders", element: s(<SellerOrders />) },
      { path: "offers", element: s(<SellerOffers />) },
    ],
  },
  {
    path: "/admin",
    element: s(<AdminShell />),
    children: [
      { index: true, element: s(<AdminOverview />) },
      { path: "sellers", element: s(<AdminSellers />) },
      { path: "prices", element: s(<AdminPrices />) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
