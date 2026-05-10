import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical, Leaf, Star, Shield, Award, Users, ChevronLeft, ChevronRight, Truck, RotateCcw } from "lucide-react";
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
    return (
      <div className="w-full h-[480px] md:h-[600px] bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/60 via-gray-700/40 to-gray-800/60 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 text-center px-8">
            <div className="h-8 w-48 bg-gray-700/50 rounded-full mx-auto animate-pulse" />
            <div className="h-16 w-96 max-w-full bg-gray-700/50 rounded-xl mx-auto animate-pulse" />
            <div className="h-5 w-72 max-w-full bg-gray-700/30 rounded-lg mx-auto animate-pulse" />
            <div className="h-12 w-36 bg-gray-600/50 rounded-xl mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback static hero if no banners
  if (!banners || banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gray-950 min-h-[480px] md:min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/30" />
        <div className="relative container py-16 md:py-28">
          <div className="max-w-2xl">
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
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="relative flex-none w-full h-[480px] md:h-[600px] lg:h-[680px]"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title ?? "Banner"}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding={index === 0 ? "sync" : "async"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
              <div className="relative h-full flex items-center">
                <div className="container">
                  <div className="max-w-2xl text-white">
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

// ─── Category Carousel ───────────────────────────────────────────────────────

type Category = { id: number; name: string; slug: string; description: string | null; imageUrl: string | null };

function CategoryCarousel({ categories }: { categories: Category[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); emblaApi.off("reInit", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo  = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  return (
    <div className="relative group/carousel">
      {/* Viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-3 md:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              // 2 slides on mobile, 5 on desktop — gap is 12px (gap-3) / 16px (gap-4)
              className="flex-none w-[calc(50%-6px)] md:w-[calc(20%-13px)]"
            >
              <Link href={`/catalog/${cat.slug}`}>
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4]">
                  {cat.imageUrl ? (
                    <>
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
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
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      <button
        onClick={scrollPrev}
        aria-label="Previous categories"
        className={`
          absolute left-0 top-[calc(50%-20px)] -translate-x-1/2 z-10
          w-10 h-10 rounded-full bg-white shadow-md border border-gray-100
          flex items-center justify-center text-gray-700
          hover:bg-gray-50 hover:shadow-lg active:scale-95
          transition-all duration-200
          ${canPrev ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={scrollNext}
        aria-label="Next categories"
        className={`
          absolute right-0 top-[calc(50%-20px)] translate-x-1/2 z-10
          w-10 h-10 rounded-full bg-white shadow-md border border-gray-100
          flex items-center justify-center text-gray-700
          hover:bg-gray-50 hover:shadow-lg active:scale-95
          transition-all duration-200
          ${canNext ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      {scrollSnaps.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to position ${i + 1}`}
              className={`transition-all duration-300 rounded-full bg-gray-300 hover:bg-gray-500 ${
                i === selectedIndex ? "w-6 h-2 bg-gray-800" : "w-2 h-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Featured Products Carousel ──────────────────────────────────────────────

type FeaturedProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number | null;
};

function FeaturedProductsCarousel({ products }: { products: FeaturedProduct[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: true },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
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
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); emblaApi.off("reInit", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo  = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  return (
    <div className="relative px-2">
      {/* Viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-full md:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      <button
        onClick={scrollPrev}
        aria-label="Previous products"
        className="absolute left-0 top-[calc(50%-28px)] -translate-x-1 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      {/* Right arrow */}
      <button
        onClick={scrollNext}
        aria-label="Next products"
        className="absolute right-0 top-[calc(50%-28px)] translate-x-1 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Dots */}
      {scrollSnaps.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-7">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === selectedIndex
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Services Section ─────────────────────────────────────────────────────────

const DEFAULT_SERVICES = [
  {
    key: "service_1",
    defaultTitle: "Elevated Therapeutics",
    defaultDesc: "Explore our premium cannabis-based medical solutions, designed for optimal effectiveness and well-being, backed by rigorous lab testing.",
    defaultLink: "/catalog",
  },
  {
    key: "service_2",
    defaultTitle: "Essence of the Leaf",
    defaultDesc: "Experience the purity of our handpicked cannabis leaves, preserving natural properties for a safe and enriching experience.",
    defaultLink: "/catalog",
  },
  {
    key: "service_3",
    defaultTitle: "Pure & Natural Edibles",
    defaultDesc: "Our edibles, made with 100% natural ingredients, offer a pure and enjoyable experience, from chocolates to infusions.",
    defaultLink: "/catalog",
  },
  {
    key: "service_4",
    defaultTitle: "Premium Buds",
    defaultDesc: "Our sustainably grown, pesticide-free cannabis flowers deliver rich aromas, unique flavors, and consistent potency.",
    defaultLink: "/catalog",
  },
  {
    key: "service_5",
    defaultTitle: "Nature's Apothecary",
    defaultDesc: "Discover our extracts and apothecary formulas, crafted to enhance cannabis compounds for relaxation, pain relief, and well-being.",
    defaultLink: "/catalog",
  },
  {
    key: "service_6",
    defaultTitle: "Your Safety, Our Priority",
    defaultDesc: "We ensure legal compliance and product safety through rigorous quality control at every stage, providing you with a trusted experience.",
    defaultLink: "/catalog",
  },
];

const SERVICE_TEXT_KEYS = [
  "services_section_title",
  "services_section_subtitle",
  ...DEFAULT_SERVICES.flatMap((s) => [`${s.key}_title`, `${s.key}_desc`, `${s.key}_link`]),
] as const;

function ServicesSection() {
  const { data: siteImages = {} } = trpc.banners.siteImages.useQuery();
  const { data: textSettings } = trpc.settings.getMany.useQuery(
    { keys: [...SERVICE_TEXT_KEYS] },
    { retry: false }
  );

  const t = (key: string, fallback: string) =>
    (textSettings as Record<string, string | null> | undefined)?.[key] || fallback;

  const sectionTitle = t("services_section_title", "Our Best Services");
  const sectionSubtitle = t(
    "services_section_subtitle",
    "TruLife provides expert support for your cannabis business, including guidance, testing, legal advice, strategy, marketing, and insurance."
  );

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{sectionTitle}</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-base leading-relaxed">{sectionSubtitle}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEFAULT_SERVICES.map((service, index) => {
            const imgUrl = (siteImages as Record<string, string>)[`${service.key}_icon`];
            const title = t(`${service.key}_title`, service.defaultTitle);
            const desc = t(`${service.key}_desc`, service.defaultDesc);
            const link = t(`${service.key}_link`, service.defaultLink);
            const isHighlighted = index === 2; // 3rd card highlighted like in the design

            return (
              <div
                key={service.key}
                className={`group relative rounded-2xl p-8 flex flex-col gap-4 transition-all duration-300 ${
                  isHighlighted
                    ? "bg-gray-100 border border-gray-200 shadow-md"
                    : "bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md"
                }`}
              >
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {imgUrl ? (
                    <img src={imgUrl} alt={title} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Leaf className="w-8 h-8 text-emerald-600" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>

                {/* Link */}
                <Link href={link || "/catalog"}>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-emerald-700 transition-colors">
                    Read More
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const categories = trpc.categories.list.useQuery();
  const featured = trpc.products.featured.useQuery();
  const { data: siteImages = {} } = trpc.banners.siteImages.useQuery();

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
          <div className="flex gap-3 md:gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-none w-[calc(50%-6px)] md:w-[calc(20%-13px)] aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <CategoryCarousel categories={categories.data ?? []} />
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
            <div className="flex gap-4 overflow-hidden px-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-full md:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] h-72 bg-gray-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : featured.data && featured.data.length > 0 ? (
            <FeaturedProductsCarousel products={featured.data} />
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
                {(siteImages as Record<string, string>).about_us ? (
                  <img
                    src={(siteImages as Record<string, string>).about_us}
                    alt="About Us"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-950 flex items-center justify-center">
                      <Leaf className="w-32 h-32 text-white/10" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Leaf className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-white font-bold text-2xl tracking-tight">TRUELIFE</p>
                      <p className="text-white/60 text-sm text-center">Premium Hemp Co.</p>
                    </div>
                  </>
                )}
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
                At TrueLife Co., we believe that quality is non-negotiable. Founded with a passion for clean, effective hemp wellness, we set out to create products that meet the highest pharmaceutical standards — because you deserve nothing less.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8 text-base">
                Every product in our lineup is crafted from federally compliant, farm-bill-approved hemp. We partner with certified labs to verify potency and purity on every single batch, so you can shop with complete confidence.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { value: "500+", label: "Happy Customers" },
                  { value: "100%", label: "Lab Verified" },
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

      {/* Services */}
      <ServicesSection />

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
              { slot: "trust_shipping", icon: Truck,        title: "Free Shipping", sub: "On all orders over $50" },
              { slot: "trust_returns",  icon: RotateCcw,    title: "Easy Returns",  sub: "30-day return policy" },
              { slot: "trust_natural",  icon: Leaf,         title: "100% Natural",  sub: "Hemp-derived ingredients" },
              { slot: "trust_lab",      icon: FlaskConical, title: "Lab Tested",    sub: "Every batch verified" },
            ].map(({ slot, icon: Icon, title, sub }) => {
              const imgUrl = (siteImages as Record<string, string>)[slot];
              return (
                <div key={title} className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt={title} className="w-full h-full object-contain p-2" />
                    ) : (
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}