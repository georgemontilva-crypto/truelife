import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-20">
      {/* As Seen In */}
      <div className="border-b border-gray-100">
        <div className="container py-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">As Seen In</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { src: "/manus-storage/leafly-logo_8a286c57.png", alt: "Leafly" },
              { src: "/manus-storage/mjbizdaily-logo_94eacd30.png", alt: "Marijuana Business Daily" },
              { src: "/manus-storage/herb-logo_11211b3d.png", alt: "Herb" },
              { src: "/manus-storage/ocweekly-logo_96b0f9b3.png", alt: "OC Weekly" },
              { src: "/manus-storage/forbes-logo_e0f6bba3.png", alt: "Forbes" },
            ].map(({ src, alt }) => (
              <img
                key={alt}
                src={src}
                alt={alt}
                className="h-7 w-auto object-contain opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="mb-4">
              <img
                src="/manus-storage/chronic-logo_75b545c4.png"
                alt="Chronic - Expect the Best"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Premium hemp-derived products. Quality you can trust, formulated with care.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {["All Products", "Devices", "Cartridges", "Gummies", "Disposables", "THCA Flower"].map((item) => (
                <li key={item}>
                  <Link href="/catalog" className="text-xs text-gray-500 hover:text-gray-800 transition-colors no-underline">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5">
              {["FAQs", "Shipping Policy", "Return Policy", "Contact Us", "Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <span className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Legal</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Products on this site contain a value of 0.3% or less Δ9THC (or no more than 0.3% Δ9THC).
            </p>
          </div>
        </div>

        {/* FDA Disclosure */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-500">FDA Disclosure:</span> This product is not for use by or sale to persons under the age of 21 depending on the laws of your governing state or territory. This product should be used only as directed on the label. It should not be used if you are pregnant or nursing. Consult with a physician before use, especially if you have a medical condition or use prescription medications. A doctor's advice should be sought before using any of these products. All trademarks and copyrights are property of their respective owners and are not affiliated with nor do they endorse this product. These statements have not been evaluated by the FDA. These products are not intended to diagnose, treat, cure or prevent any disease. By using this site you agree to follow the Privacy Policy and all Terms &amp; Conditions printed on this site. Void Where Prohibited By Law.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Chronic Hemp Co. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
