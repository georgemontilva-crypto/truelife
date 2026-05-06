import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical, Leaf, Star, Shield, Award, Users, ChevronLeft, ChevronRight } from "lucide-react";
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
    Autoplay({ delay: 5500, stopOnInteraction: false }),
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

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (isLoading) {
    return <div className="w-full h-[480px] md:h-[600px] bg-gray-900 animate-pulse" />;
  }

  // Fallback static hero if no banners
  if (!banners || banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gray-950 min-h-[480px] md:min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/manus-storage/banner1-cannabis-bud_b82f9e57.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/30" />
        <div className="relative container py-16 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5" />
              Lab-Tested · ≤0.3% Δ9THC · FDA Compliant
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
              Premium Hemp
              <span className="block text-gray-400">Products</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
              Pharmaceutical-grade hemp-derived products. Every batch lab-tested for purity, potency, and compliance.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/catalog">
                <Button className="h-12 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-base">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/catalog">
                <Button variant="ghost" className="h-12 px-6 text-white hover:text-white hover:bg-white/10 font-medium text-base">
                  View Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Floating badges */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3">
          {[
            { icon: FlaskConical, label: "Lab Tested", sub: "Every batch" },
            { icon: Leaf, label: "Hemp Derived", sub: "≤0.3% THC" },
            { icon: Star, label: "5-Star Rated", sub: "500+ reviews" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative flex-none w-full h-[480px] md:h-[600px] lg:h-[680px]"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title ?? "Banner"}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
              <div className="relative h-full flex items-center">
                <div className="container">
                  <div className="max-w-2xl text-white">
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
                      <Shield className="w-3.5 h-3.5" />
                      Lab-Tested · ≤0.3% Δ9THC · FDA Compliant
                    </div>
                    {banner.title && (
                      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-5">
                        {banner.title}
                      </h1>
                    )}
                    {banner.subtitle && (
                      <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.linkUrl && (
                      <div className="flex flex-wrap gap-3">
                        <Link href={banner.linkUrl}>
                          <Button className="h-12 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-base">
                            {banner.linkText || "Shop Now"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev/Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {scrollSnaps.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? "w-7 h-2.5 bg-white"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
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
      <div className="bg-white px-4 md:px-6 pt-4 pb-0">
        <div className="rounded-3xl overflow-hidden">
          <HeroBannerSlider />
        </div>
      </div>

      {/* Categories */}
      <section className="container py-16 md:py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 mt-1">Find exactly what you're looking for</p>
          </div>
          <Link href="/catalog">
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900 font-medium">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        {categories.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {(categories.data ?? []).map((cat) => (
              <Link key={cat.id} href={`/catalog/${cat.slug}`}>
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4] md:aspect-[3/4]">
                  {cat.imageUrl ? (
                    <>
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm font-bold text-white">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gray-50 border border-gray-100 flex flex-col items-center justify-center p-4 hover:border-gray-300 hover:shadow-md transition-all">
                      <div className="text-3xl mb-3">{CATEGORY_ICONS[cat.slug] ?? "🌿"}</div>
                      <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-gray-950 py-16 md:py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white">Featured Products</h2>
              <p className="text-gray-400 mt-1">Our most popular selections</p>
            </div>
            <Link href="/catalog">
              <Button variant="ghost" className="text-gray-300 hover:text-white font-medium">
                See all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {featured.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : featured.data && featured.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {featured.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No featured products yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* About Us */}
      <section className="py-20 md:py-28 bg-white" id="about">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
                <img
                  src="/manus-storage/banner2-cannabis-dark_1f0b32b8.jpg"
                  alt="About Chronic Hemp"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -right-4 md:-right-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-6 py-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-950 rounded-xl flex items-center justify-center shrink-0">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-xs text-gray-500">Lab Verified</p>
                </div>
              </div>
            </div>
            {/* Text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-gray-200">
                <Leaf className="w-3.5 h-3.5" />
                Our Story
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Expect the Best.<br />
                <span className="text-gray-400">Always.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5 text-base">
                At Chronic Hemp Co., we believe that quality is non-negotiable. Founded with a passion for clean, effective hemp wellness, we set out to create products that meet the highest pharmaceutical standards — because you deserve nothing less.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8 text-base">
                Every product in our lineup is crafted from federally compliant, farm-bill-approved hemp. We partner with certified labs to verify potency and purity on every single batch, so you can shop with complete confidence.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { value: "500+", label: "Happy Customers" },
                  { value: "100%", label: "Lab Verified" },
                  { value: "≤0.3%", label: "Δ9THC" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: FlaskConical, title: "Pharmaceutical Grade", desc: "GMP-compliant manufacturing." },
                  { icon: Shield, title: "Federally Compliant", desc: "2018 Farm Bill approved." },
                  { icon: Award, title: "Third-Party Tested", desc: "COAs available for every batch." },
                  { icon: Users, title: "Customer First", desc: "30-day returns & free shipping." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/catalog">
                <Button className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold">
                  Explore Our Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Hear From Our Clients</h2>
            <p className="text-gray-500 mt-2">See what our satisfied customers have to say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Walter Avendaño", text: "I can't believe how well this delta 8 CBD product works! I've been dealing with constant joint pains for years, and after trying so many things without success, I finally found something that has truly helped." },
              { name: "Juan Pinzon", text: "After a long day at work, I needed something to unwind and disconnect. I decided to try out the delta 8 THC product from this store, and it didn't disappoint at all." },
              { name: "Ivan Ramirez", text: "I've tried various CBD and delta 8 products in the past, but none of them compare to the flavor of the products from this store. I was amazed by how delicious it was." },
            ].map(({ name, text }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{name[0]}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-t border-gray-100 py-14 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { img: "/manus-storage/free-shipping_df5d544c.svg", title: "Free Shipping", sub: "On all orders over $50" },
              { img: "/manus-storage/risk-money-1_4186a7dd.svg", title: "Easy Returns", sub: "30-day return policy" },
              { img: "/manus-storage/natural-1_162ff9c5.svg", title: "100% Natural", sub: "Hemp-derived ingredients" },
              { img: "/manus-storage/labtested-1_7cf4af18.svg", title: "Lab Tested", sub: "Every batch verified" },
            ].map(({ img, title, sub }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <img src={img} alt={title} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
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
