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
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50/30 to-white">
        <div className="container py-12 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-gray-200">
              <Shield className="w-3.5 h-3.5" />
              Lab-Tested · ≤0.3% Δ9THC · FDA Compliant
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-5">
              Premium Hemp
              <span className="block text-gray-900">Products</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-7 max-w-xl">
              Pharmaceutical-grade hemp-derived products. Every batch lab-tested for purity, potency, and compliance. Expect the best.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/catalog">
                <Button className="h-11 md:h-12 px-6 md:px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-medium">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/catalog">
                <Button variant="ghost" className="h-11 md:h-12 px-5 md:px-6 text-gray-600 hover:text-gray-900 font-medium">
                  View Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-gray-50/50 to-transparent hidden lg:block pointer-events-none" />
        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
          {[
            { icon: FlaskConical, label: "Lab Tested", sub: "Every batch" },
            { icon: Leaf, label: "Hemp Derived", sub: "≤0.3% THC" },
            { icon: Star, label: "5-Star Rated", sub: "500+ reviews" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-gray-900" />
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
            <Button variant="ghost" className="text-gray-900 hover:text-gray-900 text-sm font-medium">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {categories.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {categories.data?.map((cat) => (
              <Link key={cat.id} href={`/catalog/${cat.slug}`}>
                <div className="group bg-white border border-gray-100 rounded-2xl p-5 text-center hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="text-3xl mb-3">{CATEGORY_ICONS[cat.slug] ?? "🌿"}</div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
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
              <Button variant="ghost" className="text-gray-900 hover:text-gray-900 text-sm font-medium">
                See all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {featured.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : featured.data && featured.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
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

      {/* Trust Badges */}
      <section className="border-t border-gray-100 py-12 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { img: "/manus-storage/free-shipping_df5d544c.svg", title: "Free Shipping", sub: "On all orders over $50" },
              { img: "/manus-storage/risk-money-1_4186a7dd.svg", title: "Easy Returns", sub: "30-day return policy" },
              { img: "/manus-storage/natural-1_162ff9c5.svg", title: "100% Natural", sub: "Hemp-derived ingredients" },
              { img: "/manus-storage/labtested-1_7cf4af18.svg", title: "Lab Tested", sub: "Every batch verified" },
            ].map(({ img, title, sub }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <img src={img} alt={title} className="w-20 h-20 object-contain" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
