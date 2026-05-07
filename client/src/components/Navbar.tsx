import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, X, Leaf, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  const categories = trpc.categories.list.useQuery();
  const allProducts = trpc.products.list.useQuery();
  const { data: siteImages = {} } = trpc.banners.siteImages.useQuery();

  const isAdmin = user?.role === "admin";

  // Count products per category
  const productCountByCategory = (allProducts.data ?? []).reduce<Record<number, number>>((acc, p) => {
    if (p.categoryId) acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  // Close mega menu on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
    }
    if (shopOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [shopOpen]);

  // Close mega menu on navigation
  useEffect(() => {
    setShopOpen(false);
    setMobileOpen(false);
  }, [location]);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors no-underline ${location === href ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      {/* Announcement bar */}
      <div className="bg-gray-900 text-white text-xs text-center py-2 px-3 font-medium tracking-wide">
        FREE SHIPPING on orders over $50 · 30-Day Returns · Secure Checkout
      </div>

      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            {(siteImages as Record<string, string>).logo_main ? (
              <img
                src={(siteImages as Record<string, string>).logo_main}
                alt="CHRONIC"
                className="h-8 w-auto object-contain"
              />
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-gray-900">CHRONIC</span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" ref={megaRef}>
            {/* Shop mega menu trigger */}
            <div className="relative">
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${shopOpen ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setShopOpen((v) => !v)}
                onMouseEnter={() => setShopOpen(true)}
              >
                Shop
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Mega menu panel */}
              {shopOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setShopOpen(false)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop by Category</p>
                    <Link
                      href="/catalog"
                      className="text-xs text-gray-500 hover:text-gray-900 no-underline transition-colors"
                      onClick={() => setShopOpen(false)}
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.data?.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/catalog/${cat.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors no-underline group"
                        onClick={() => setShopOpen(false)}
                      >
                        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Leaf className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {productCountByCategory[cat.id] ?? 0} products
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                  {(categories.data?.length ?? 0) === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>
                  )}
                </div>
              )}
            </div>

            {navLink("/about", "About Us")}
            {navLink("/contact", "Contact")}
            {navLink("/faqs", "FAQs")}
            {navLink("/lab-results", "Lab Results")}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="hidden md:flex text-xs border-gray-200 text-gray-900 hover:bg-gray-50">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/account">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm text-gray-600 hover:text-gray-900 hidden md:flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-sm bg-gray-900 hover:bg-black text-white rounded-lg hidden md:flex">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-gray-900"
              onClick={openCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-gray-900 text-white border-0">
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
          <div className="container py-4 space-y-1">
            {/* Shop accordion */}
            <button
              className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-700"
              onClick={() => setMobileShopOpen((v) => !v)}
            >
              <span>Shop</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileShopOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileShopOpen && (
              <div className="pl-4 space-y-1 pb-1">
                <Link href="/catalog" className="block text-sm text-gray-600 py-1.5 no-underline" onClick={() => setMobileOpen(false)}>
                  All Products
                </Link>
                {categories.data?.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalog/${cat.slug}`}
                    className="block text-sm text-gray-600 py-1.5 no-underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/about" className="block text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setMobileOpen(false)}>
              About Us
            </Link>
            <Link href="/contact" className="block text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
            <Link href="/faqs" className="block text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setMobileOpen(false)}>
              FAQs
            </Link>
            <Link href="/lab-results" className="block text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setMobileOpen(false)}>
              Lab Results
            </Link>

            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1 no-underline" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full text-sm border-gray-200">Sign In</Button>
                </Link>
                <Link href="/register" className="flex-1 no-underline" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full text-sm bg-gray-900 text-white hover:bg-black">Register</Button>
                </Link>
              </div>
            )}

            {isAdmin && (
              <Link href="/admin" className="block text-sm font-medium text-gray-900 py-2 no-underline" onClick={() => setMobileOpen(false)}>
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
