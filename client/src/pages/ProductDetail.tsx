import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Package, ArrowLeft, Shield, Truck, RotateCcw,
  FlaskConical, FileText, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { refetch, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [showAttrs, setShowAttrs] = useState(true);
  const [showLabs, setShowLabs] = useState(false);

  const productId = parseInt(params.id ?? "0");
  const product = trpc.products.byId.useQuery({ id: productId }, { enabled: !!productId });
  const variants = trpc.productVariants.list.useQuery({ productId }, { enabled: !!productId });
  const attributes = trpc.productAttributes.list.useQuery({ productId }, { enabled: !!productId });
  const labReports = trpc.labReports.list.useQuery({ productId }, { enabled: !!productId });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Added to cart!", { action: { label: "View Cart", onClick: openCart } });
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    addToCart.mutate({
      productId,
      quantity,
      selectedVariants: selectedVariantId ? { variantId: String(selectedVariantId) } : {},
    });
  };

  if (product.isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-10 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="aspect-square bg-gray-100 rounded-3xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded-xl animate-pulse w-1/2" />
              <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product.data) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-16 text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Product not found.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/catalog")}>
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  const p = product.data;
  const activeVariants = variants.data?.filter((v) => v.isActive) ?? [];
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null;

  // Price: use selected variant price if available, otherwise product base price
  const displayPrice = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(p.price);
  const displayCompareAt = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice)
    : p.compareAtPrice ? parseFloat(p.compareAtPrice) : null;
  const hasDiscount = displayCompareAt !== null && displayCompareAt > displayPrice;
  const discountPct = hasDiscount ? Math.round((1 - displayPrice / displayCompareAt!) * 100) : 0;

  // Stock: use selected variant inventory if available
  const displayInventory = selectedVariant !== null && selectedVariant.inventory !== null
    ? selectedVariant.inventory
    : p.inventory;
  const isOutOfStock = displayInventory === 0;

  // Lab reports: show all, or filter by selected variant
  const filteredLabReports = labReports.data?.filter((r) =>
    selectedVariantId ? (r.variantId === selectedVariantId || r.variantId === null) : true
  ) ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="container py-6 md:py-10">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/catalog")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 md:mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl overflow-hidden">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 md:w-20 h-16 md:h-20 text-gray-200" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-2">
                Hemp Derived · ≤0.3% Δ9THC
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">{p.name}</h1>

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-2 mb-3">
                <span className="text-2xl md:text-3xl font-bold text-gray-900">
                  ${displayPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base md:text-lg text-gray-400 line-through">
                      ${displayCompareAt!.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                      -{discountPct}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isOutOfStock ? "bg-red-400" : "bg-green-400"}`} />
                <span className={`text-sm font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                  {isOutOfStock ? "Out of Stock" : `In Stock (${displayInventory} available)`}
                </span>
              </div>
            </div>

            {p.description && (
              <p className="text-gray-600 leading-relaxed mb-5 text-sm">{p.description}</p>
            )}

            {/* Quick specs */}
            {(p.thcContent || p.cbdContent || p.weight) && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 grid grid-cols-3 gap-3">
                {p.thcContent && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">THC</p>
                    <p className="text-sm font-semibold text-gray-800">{p.thcContent}</p>
                  </div>
                )}
                {p.cbdContent && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">CBD</p>
                    <p className="text-sm font-semibold text-gray-800">{p.cbdContent}</p>
                  </div>
                )}
                {p.weight && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Weight</p>
                    <p className="text-sm font-semibold text-gray-800">{p.weight}</p>
                  </div>
                )}
              </div>
            )}

            {/* Variants with individual pricing (gramajes, sabores, etc.) */}
            {activeVariants.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Option</p>
                <div className="flex flex-wrap gap-2">
                  {/* Base product option */}
                  <button
                    onClick={() => setSelectedVariantId(null)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      selectedVariantId === null
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span>Base</span>
                    <span className="ml-1.5 text-xs opacity-80">${parseFloat(p.price).toFixed(2)}</span>
                  </button>
                  {activeVariants.map((v) => {
                    const outOfStock = v.inventory !== null && v.inventory === 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => !outOfStock && setSelectedVariantId(v.id)}
                        disabled={outOfStock}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          selectedVariantId === v.id
                            ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                            : outOfStock
                            ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <span>{v.name}</span>
                        <span className="ml-1.5 text-xs opacity-80">${parseFloat(v.price).toFixed(2)}</span>
                        {outOfStock && <span className="ml-1 text-xs">(Out)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-medium text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(displayInventory, q + 1))}
                  className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-medium text-lg"
                >
                  +
                </button>
              </div>
              <Button
                className="flex-1 h-11 bg-gray-900 hover:bg-black text-white rounded-xl font-medium"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addToCart.isPending}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { img: "/manus-storage/labtested-1_7cf4af18.svg", label: "Lab Tested" },
                { img: "/manus-storage/free-shipping_df5d544c.svg", label: "Free Ship. $50+" },
                { img: "/manus-storage/risk-money-1_4186a7dd.svg", label: "30-Day Returns" },
                { img: "/manus-storage/natural-1_162ff9c5.svg", label: "100% Natural" },
              ].map(({ img, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-2.5 text-center">
                  <img src={img} alt={label} className="w-8 h-8 object-contain" />
                  <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Product Characteristics accordion */}
            {attributes.data && attributes.data.length > 0 && (
              <div className="border border-gray-100 rounded-2xl overflow-hidden mb-3">
                <button
                  onClick={() => setShowAttrs(!showAttrs)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-gray-900 shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">Product Characteristics</span>
                  </div>
                  {showAttrs
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {showAttrs && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {attributes.data.map((attr) => (
                        <div key={attr.id}>
                          <dt className="text-xs text-gray-500 mb-0.5">{attr.key}</dt>
                          <dd className="text-sm font-medium text-gray-800">{attr.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {/* Lab Reports / COA accordion */}
            {filteredLabReports.length > 0 && (
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowLabs(!showLabs)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-900 shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">Lab Reports / COA</span>
                    <span className="text-xs bg-gray-100 text-gray-900 font-semibold px-2 py-0.5 rounded-full">
                      {filteredLabReports.length}
                    </span>
                  </div>
                  {showLabs
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {showLabs && (
                  <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                    {filteredLabReports.map((report) => (
                      <a
                        key={report.id}
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 truncate">
                            {report.reportName}
                          </p>
                          {report.variantName && (
                            <p className="text-xs text-gray-500 mt-0.5">Variant: {report.variantName}</p>
                          )}
                          {report.batchNumber && (
                            <p className="text-xs text-gray-400">Batch: {report.batchNumber}</p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
