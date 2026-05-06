import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical, Leaf, Star, Shield } from "lucide-react";
import ProductCard from "@/components/ProductCard";

const CATEGORY_ICONS: Record<string, string> = {
  devices: "🔬",
  cartridges: "💊",
  gummies: "🍬",
  disposables: "⚗️",
  "thca-flower": "🌿",
};

export default function Home() {
  const categories = trpc.categories.list.useQuery();
  const featured = trpc.products.featured.useQuery();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="container py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
              <Shield className="w-3.5 h-3.5" />
              Lab-Tested · ≤0.3% Δ9THC · FDA Compliant
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Premium Hemp
              <span className="block text-blue-600">Products</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
              Pharmaceutical-grade hemp-derived products. Every batch lab-tested for purity, potency, and compliance. Expect the best.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/catalog">
                <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-base">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/catalog">
                <Button variant="ghost" className="h-12 px-6 text-gray-600 hover:text-gray-900 font-medium">
                  View Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent hidden lg:block" />
        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
          {[
            { icon: FlaskConical, label: "Lab Tested", sub: "Every batch" },
            { icon: Leaf, label: "Hemp Derived", sub: "≤0.3% THC" },
            { icon: Star, label: "5-Star Rated", sub: "500+ reviews" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-1">Find exactly what you're looking for</p>
          </div>
          <Link href="/catalog">
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {categories.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.data?.map((cat) => (
              <Link key={cat.id} href={`/catalog/${cat.slug}`}>
                <div className="group bg-white border border-gray-100 rounded-2xl p-5 text-center hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="text-3xl mb-3">{CATEGORY_ICONS[cat.slug] ?? "🌿"}</div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50/50 py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">Our most popular selections</p>
            </div>
            <Link href="/catalog">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                See all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {featured.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : featured.data && featured.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featured.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No featured products yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Hear From Our Clients</h2>
          <p className="text-gray-500 text-sm mt-2">See what our satisfied customers have to say</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Walter Avendaño", text: "I can't believe how well this delta 8 CBD product works! I've been dealing with constant joint pains for years, and after trying so many things without success, I finally found something that has truly helped." },
            { name: "Juan Pinzon", text: "After a long day at work, I needed something to unwind and disconnect. I decided to try out the delta 8 THC product from this store, and it didn't disappoint at all." },
            { name: "Ivan Ramirez", text: "I've tried various CBD and delta 8 products in the past, but none of them compare to the flavor of the products from this store. I was amazed by how delicious it was." },
          ].map(({ name, text }) => (
            <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>
              <p className="text-sm font-semibold text-gray-800">— {name}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
