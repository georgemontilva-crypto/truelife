import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical, Leaf, Star, Shield, Award, Users, Zap } from "lucide-react";
import ProductCard from "@/components/ProductCard";

const CATEGORY_ICONS: Record<string, string> = {
  devices: "🔬",
  cartridges: "💊",
  gummies: "🍬",
  disposables: "⚗️",
  "thca-flower": "🌿",
};

// ─── Hero Slider ─────────────────────────────────────────────────────────────
function HeroBannerSlider() {
  const { data: banners, isLoading } = trpc.banners.list.useQuery();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  // Fallback static hero if no banners
  if (!isLoading && (!banners || banners.length === 0)) {
    return (
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
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[400px] md:h-[560px] bg-gray-100 animate-pulse" />
    );
  }

  return (
    <section className="relative overflow-hidden">
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {(banners ?? []).map((banner) => (
            <div
              key={banner.id}
              className="relative flex-none w-full h-[400px] md:h-[560px] lg:h-[640px]"
            >
              {/* Background image */}
              <img
                src={banner.imageUrl}
                alt={banner.title ?? "Banner"}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="container">
                  <div className="max-w-xl text-white">
                    {banner.title && (
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4">
                        {banner.title}
                      </h1>
                    )}
                    {banner.subtitle && (
                      <p className="text-base md:text-lg text-white/80 leading-relaxed mb-7">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.linkUrl && (
                      <Link href={banner.linkUrl}>
                        <Button className="h-11 md:h-12 px-6 md:px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold">
                          {banner.linkText || "Shop Now"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots navigation */}
      {scrollSnaps.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const categories = trpc.categories.list.useQuery();
  const featured = trpc.products.featured.useQuery();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      {/* Hero Banner Slider */}
      <HeroBannerSlider />

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
            {(categories.data ?? []).map((cat) => (
              <Link key={cat.id} href={`/catalog?category=${cat.id}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-gray-50 aspect-[4/3] flex flex-col items-center justify-center text-center p-4">
                  {/* Category image */}
                  {(cat as any).imageUrl ? (
                    <>
                      <img
                        src={(cat as any).imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                      <div className="relative z-10 text-white">
                        <p className="text-sm font-semibold">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-white/70 mt-1 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-3">{CATEGORY_ICONS[cat.slug] ?? "🌿"}</div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{cat.description}</p>
                      )}
                    </>
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

      {/* About Us */}
      <section className="py-20 bg-white" id="about">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-gray-200">
                <Leaf className="w-3.5 h-3.5" />
                Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
                Expect the Best.<br />
                <span className="text-gray-500">Always.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                At Chronic Hemp Co., we believe that quality is non-negotiable. Founded with a passion for clean, effective hemp wellness, we set out to create products that meet the highest pharmaceutical standards — because you deserve nothing less.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Every product in our lineup is crafted from federally compliant, farm-bill-approved hemp. We partner with certified labs to verify potency and purity on every single batch, so you can shop with complete confidence.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { value: "500+", label: "Happy Customers" },
                  { value: "100%", label: "Lab Verified" },
                  { value: "≤0.3%", label: "Δ9THC Compliant" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <Link href="/catalog">
                <Button className="h-11 px-7 bg-gray-900 hover:bg-black text-white rounded-xl font-medium">
                  Explore Our Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            {/* Values grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: FlaskConical,
                  title: "Pharmaceutical Grade",
                  desc: "Manufactured in GMP-compliant facilities with strict quality controls.",
                },
                {
                  icon: Shield,
                  title: "Federally Compliant",
                  desc: "All products contain ≤0.3% Δ9THC and comply with the 2018 Farm Bill.",
                },
                {
                  icon: Award,
                  title: "Third-Party Tested",
                  desc: "Independent lab reports available for every product batch.",
                },
                {
                  icon: Users,
                  title: "Customer First",
                  desc: "24/7 support, 30-day returns, and free shipping on orders over $50.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                    <Icon className="w-5 h-5 text-gray-900" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
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
