import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

// ─── Theme Injector ───────────────────────────────────────────────────────────
const THEME_KEYS = ["theme_dark_bg", "theme_primary", "theme_accent", "theme_navbar_bg"] as const;

function ThemeInjector() {
  const { data: settings } = trpc.settings.getMany.useQuery({ keys: [...THEME_KEYS] }, { retry: false, staleTime: 60_000 });

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.theme_dark_bg)    root.style.setProperty("--theme-dark-bg",   settings.theme_dark_bg);
    if (settings.theme_primary)    root.style.setProperty("--theme-primary",   settings.theme_primary);
    if (settings.theme_accent)     root.style.setProperty("--theme-accent",    settings.theme_accent);
    if (settings.theme_navbar_bg)  root.style.setProperty("--theme-navbar-bg", settings.theme_navbar_bg);
    // Also override Tailwind/shadcn gray-900 and primary so hardcoded buttons pick it up
    if (settings.theme_primary) {
      root.style.setProperty("--color-gray-900", settings.theme_primary);
      root.style.setProperty("--color-gray-950", settings.theme_primary);
      root.style.setProperty("--primary", settings.theme_primary);
    }
    if (settings.theme_dark_bg) {
      root.style.setProperty("--color-gray-950", settings.theme_dark_bg);
    }
  }, [settings]);

  return null;
}
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { AgeGateProvider } from "./contexts/AgeGateContext";
import AgeGate from "./components/AgeGate";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import AccountPage from "./pages/AccountPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminLabReports from "./pages/admin/AdminLabReports";
import AdminSiteEditor from "./pages/admin/AdminSiteEditor";
import LabResultsPage from "./pages/LabResultsPage";
import ContactPage from "./pages/ContactPage";
import FAQsPage from "./pages/FAQsPage";
import AboutPage from "./pages/AboutPage";

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/catalog/:categorySlug" component={Catalog} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/lab-results" component={LabResultsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/faqs" component={FAQsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/products" component={() => <AdminLayout><AdminProducts /></AdminLayout>} />
      <Route path="/admin/categories" component={() => <AdminLayout><AdminCategories /></AdminLayout>} />
      <Route path="/admin/banners" component={() => <AdminLayout><AdminBanners /></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><AdminOrders /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/lab-reports" component={() => <AdminLayout><AdminLabReports /></AdminLayout>} />
      <Route path="/admin/site-editor" component={() => <AdminLayout><AdminSiteEditor /></AdminLayout>} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AgeGateProvider>
          <CartProvider>
            <TooltipProvider>
              <ThemeInjector />
              <Toaster position="top-right" />
              <AgeGate />
              <div className="min-h-screen overflow-x-hidden">
                <Router />
              </div>
            </TooltipProvider>
          </CartProvider>
        </AgeGateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
