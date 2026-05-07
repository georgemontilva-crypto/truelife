import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQS = [
  {
    q: "Is hemp CBD legal?",
    a: "Yes. Under the 2018 Farm Bill, hemp-derived CBD products containing less than 0.3% Delta-9 THC are federally legal in the United States. Our products comply with all federal regulations and are sourced from licensed hemp farms.",
  },
  {
    q: "Will CBD make me feel 'high'?",
    a: "No. CBD (cannabidiol) is non-intoxicating. Unlike THC, it does not produce a psychoactive high. Our full-spectrum products contain trace amounts of THC (below the legal 0.3% threshold), which is not enough to cause intoxication.",
  },
  {
    q: "How do I choose the right product for me?",
    a: "It depends on your goals. For general wellness and daily use, our CBD oils or capsules are a great starting point. For targeted relief, topicals work well. If you prefer a smoke-free option, gummies or tinctures are popular choices. When in doubt, start with a lower potency and adjust based on your experience.",
  },
  {
    q: "How are your products tested?",
    a: "All our products are third-party lab tested by accredited ISO-certified laboratories. Lab reports (Certificates of Analysis) are available on our Lab Results page and verify cannabinoid potency, terpene profiles, heavy metals, pesticides, and microbials.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping typically takes 3–5 business days. Expedited 2-day options are available at checkout. Orders over $50 ship free. We ship to all 50 US states.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a 30-day satisfaction guarantee. If you're not happy with your purchase, contact our support team within 30 days of delivery for a full refund or exchange. Products must be in original condition.",
  },
  {
    q: "Can I take CBD with other medications?",
    a: "CBD can interact with certain medications. We always recommend consulting with a licensed healthcare provider before adding CBD to your routine, especially if you're taking prescription medications. This is not medical advice.",
  },
  {
    q: "What's the difference between full-spectrum, broad-spectrum, and isolate?",
    a: "Full-spectrum contains all cannabinoids, terpenes, and trace THC (<0.3%) found naturally in hemp — the 'entourage effect' may enhance benefits. Broad-spectrum has the same compounds but with THC removed. Isolate is pure CBD with nothing else. We offer all three types across our product line.",
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
