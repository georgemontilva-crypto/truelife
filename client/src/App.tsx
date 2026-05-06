import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
import LabResultsPage from "./pages/LabResultsPage";

function Router() {
  return (
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
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/products" component={() => <AdminLayout><AdminProducts /></AdminLayout>} />
      <Route path="/admin/categories" component={() => <AdminLayout><AdminCategories /></AdminLayout>} />
      <Route path="/admin/banners" component={() => <AdminLayout><AdminBanners /></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><AdminOrders /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/lab-reports" component={() => <AdminLayout><AdminLabReports /></AdminLayout>} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AgeGateProvider>
          <CartProvider>
            <TooltipProvider>
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
