import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const categories = trpc.categories.list.useQuery();

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      {/* Announcement bar */}
      <div className="bg-blue-600 text-white text-xs text-center py-2 px-3 font-medium tracking-wide leading-relaxed">
        FREE SHIPPING on orders over $50 · 30-Day Returns · Secure Checkout
      </div>

      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
              Chronic<span className="text-blue-600">Hemp</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/catalog"
              className={`text-sm font-medium transition-colors no-underline ${location === "/catalog" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              All Products
            </Link>
            {categories.data?.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className={`text-sm font-medium transition-colors no-underline ${location === `/catalog/${cat.slug}` ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="hidden md:flex text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="ghost" size="sm" className="text-sm text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </a>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-gray-900"
              onClick={openCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-blue-600 text-white border-0">
                  {itemCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container py-4 space-y-3">
            <Link href="/catalog" className="block text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setMobileOpen(false)}>
              All Products
            </Link>
            {categories.data?.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className="block text-sm text-gray-600 py-2 no-underline"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="block text-sm font-medium text-blue-600 py-2 no-underline" onClick={() => setMobileOpen(false)}>
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
