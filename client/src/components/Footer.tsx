import { Link } from "wouter";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-20">
      {/* As Seen In */}
      <div className="border-b border-gray-100">
        <div className="container py-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">As Seen In</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {["Leafly", "MJBizDaily", "Herb", "OC Weekly", "Forbes"].map((name) => (
              <span
                key={name}
                className="text-sm font-bold text-gray-300 tracking-wider hover:text-gray-500 transition-colors cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-gray-900">CHRONIC</span>
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
