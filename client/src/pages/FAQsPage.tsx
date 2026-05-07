import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQS = [
  {
    q: "When do I receive my order?",
    a: "Your order is typically shipped the next business day and received within (5) business days.",
  },
  {
    q: "What are cannabinoids?",
    a: "Cannabinoids are natural chemical compounds that interact with the body's cannabinoid receptors in your endocannabinoid system. These compounds are very effective in regulating your bodily systems and balancing your state of mind.",
  },
  {
    q: "What are Terpenes?",
    a: "Terpenes are organic compounds that attribute to the scent and taste of cannabis. When paired with other cannabinoids, such as THC and CBD, terpenes enhance your experience and hold numerous medical benefits. Terpenes and cannabinoids work synergistically to induce what's known as the 'entourage effect'.",
  },
  {
    q: "Where are cannabinoids and terpenes found?",
    a: "Cannabinoids and terpenes can be found in plants in the Cannabis Sativa L. species which includes both cannabis and hemp. Terpenoids/terpenes are also commonly found in many other plants including spices, herbs, trees and fruits. A cannabis terpene such as myrcene, is also found in mangoes, lemongrass, and basil.",
  },
  {
    q: "What is the entourage effect?",
    a: "Each cannabinoid and terpene has a specific biochemical effect on the body. When the many compounds within the cannabis plant interact with the human body, a synergistic effect results to produce a stronger influence known as the entourage effect. At Chronic Hemp, we focus on this notion with our blends by optimally combining cannabinoids and terpenes to provide sensational effects.",
  },
  {
    q: "How are your products made?",
    a: "We source clean pesticide-free hemp-derived cannabinoid oils from our manufacturing partners throughout the country. Our cannabinoid blends are formed by combining specific amounts of various hemp-derived cannabinoids, which we then infuse our proprietary terpene profiles to provide the desired effects.",
  },
  {
    q: "Are your products legal?",
    a: "Yes! In 2018, the Farm Bill was signed into law. This legislation states that all derivatives of hemp are completely legal in the United States as long as they do not contain more than .3% Delta 9 THC. All of our products are hemp-derived and are rigorously tested via third-party labs to ensure compliance. Note: Certain states have legislation that has banned hemp-derived THC products including Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Kentucky, Idaho, Iowa, Mississippi, Montana, New York, Nevada, Rhode Island, Utah, Vermont, Washington, Michigan, and North Dakota.",
  },
  {
    q: "Are your products third party tested?",
    a: "Yes. Each batch of our products is rigorously tested by independent third-party laboratories to verify potency, purity, and compliance with federal regulations. You can view our Certificates of Analysis (COA) in the Lab Results section of our website.",
  },
  {
    q: "How do you flavor your products?",
    a: "The unique and complex flavors of our products come from naturally-occurring compounds. Our blends use a wide range of botanically-inspired components to create bolder, fruitier, and tastier flavors.",
  },
  {
    q: "Do you use any fillers like PG/VG or MCT coconut oil?",
    a: "No. We are proud to offer a terpene formulation created specifically for our vaporizers. This formulation improves upon commonly used diluents for cannabis vapor applications by extending stability, enhancing performance, and improving inhalation safety, delivering a consistent and safe end-product.",
  },
  {
    q: "Where can I buy your products?",
    a: "Chronic Hemp products are located in distributors throughout the USA and placed in retail Smoke Shops. You can also purchase directly through our website.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-gray-600 leading-relaxed pr-8">{a}</p>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gray-900 text-white py-14 px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Everything you need to know about our hemp products.
          </p>
        </div>

        <div className="container max-w-2xl mx-auto py-14 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 divide-y divide-gray-100">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Still have questions?{" "}
              <a href="/contact" className="text-gray-900 font-medium underline underline-offset-2">
                Contact our team
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
