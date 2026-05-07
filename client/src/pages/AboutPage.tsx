import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FlaskConical,
  Leaf,
  Shield,
  Award,
  Users,
  Star,
} from "lucide-react";

const SETTING_KEYS = ["about_hero_title", "about_hero_subtitle", "about_story_text"];

const DEFAULT_HERO_TITLE    = "Expect the Best. Always.";
const DEFAULT_HERO_SUBTITLE = "Pharmaceutical-grade hemp from farm to shelf. Every batch verified, every product crafted with care.";
const DEFAULT_STORY_TEXT    =
  "All Chronic Hemp items are 100% natural and made in the USA. We only use the finest quality hemp derived THC with zero chemicals, such as fertilizers, herbicides, and pesticides.";

export default function AboutPage() {
  const { data: siteImages = {} } = trpc.banners.siteImages.useQuery();
  const { data: settings } = trpc.settings.getMany.useQuery({ keys: SETTING_KEYS });

  const imgs = siteImages as Record<string, string>;
  const heroTitle    = settings?.about_hero_title    || DEFAULT_HERO_TITLE;
  const heroSubtitle = settings?.about_hero_subtitle || DEFAULT_HERO_SUBTITLE;
  const storyText    = settings?.about_story_text    || DEFAULT_STORY_TEXT;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
        {imgs.about_hero_bg ? (
          <>
            <img
              src={imgs.about_hero_bg}
              alt="About hero"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950" />
        )}

        <div className="relative container py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
              <Leaf className="w-3.5 h-3.5" />
              Our Story
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-5">
              {heroTitle}
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              {heroSubtitle}
            </p>
            <Link href="/catalog">
              <Button className="h-12 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-base">
                Shop Our Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
                {imgs.about_story_image ? (
                  <img
                    src={imgs.about_story_image}
                    alt="Our story"
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
                      <p className="text-white font-bold text-2xl tracking-tight">CHRONIC</p>
                      <p className="text-white/60 text-sm text-center">Premium Hemp Co.</p>
                    </div>
                  </>
                )}
              </div>
              {/* Floating stat */}
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
                Who We Are
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Derived From Organic<br />
                <span className="text-gray-400">and Domestic Hemp</span>
              </h2>
              <div className="text-gray-600 leading-relaxed text-base mb-8 whitespace-pre-line">
                {storyText}
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: FlaskConical, title: "Pharmaceutical Grade", desc: "GMP-compliant manufacturing." },
                  { icon: Shield,       title: "Federally Compliant",  desc: "2018 Farm Bill approved." },
                  { icon: Award,        title: "Third-Party Tested",   desc: "COAs available every batch." },
                  { icon: Users,        title: "Customer First",       desc: "30-day returns & free shipping." },
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
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-gray-950 py-16 md:py-20">
        <div className="container text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Our Values</h2>
          <p className="text-gray-400 mt-2">The principles that guide everything we do</p>
        </div>
        <div className="container grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Award, title: "Highest Quality Hemp Products on the Market", desc: "There is no beating the power and taste of Chronic Hemp products. As leaders in the industry, we are always innovating to focus on the natural health benefits for our customers and Wholesale Distributors." },
            { icon: Star,  title: "30 Day Satisfaction Guarantee",               desc: "Each of our potent products includes a 100% satisfaction guarantee. If you are not happy within 30 days of your purchase, we will gladly refund your money on any unopened product." },
            { icon: Leaf,  title: "Free Shipping",                               desc: "Pay no shipping fees on all orders. Chronic Hemp ships to all legal locations within the United States." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to Experience the Difference?</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Browse our full catalog of lab-tested hemp products, or reach out if you have questions.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/catalog">
              <Button className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold">
                Shop Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-12 px-8 rounded-xl font-semibold border-gray-200 text-gray-900 hover:bg-gray-50">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
