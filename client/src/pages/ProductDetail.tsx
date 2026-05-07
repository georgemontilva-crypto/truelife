import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Package, ArrowLeft, Shield, Truck, RotateCcw, Leaf,
  FlaskConical, FileText, ChevronDown, ChevronUp, ExternalLink, Heart,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";


export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { refetch, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedStrain, setSelectedStrain] = useState<string | null>(null);
  const [showAttrs, setShowAttrs] = useState(true);
  const [showLabs, setShowLabs] = useState(false);

  const productId = parseInt(params.id ?? "0");
  const utils = trpc.useUtils();
  const { data: wishlistData } = trpc.wishlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const isWishlisted = wishlistData?.some((w: any) => w.productId === productId) ?? false;
  const addWishlist = trpc.wishlist.add.useMutation({ onSuccess: () => { utils.wishlist.list.invalidate(); toast.success("Added to wishlist!"); } });
  const removeWishlist = trpc.wishlist.remove.useMutation({ onSuccess: () => { utils.wishlist.list.invalidate(); toast.success("Removed from wishlist"); } });
  const handleWishlist = () => {
    if (!isAuthenticated) { window.location.href = "/login"; return; }
    if (isWishlisted) removeWishlist.mutate({ productId }); else addWishlist.mutate({ productId });
  };
  const product = trpc.products.byId.useQuery({ id: productId }, { enabled: !!productId });
  const variants = trpc.productVariants.list.useQuery({ productId }, { enabled: !!productId });
  const attributes = trpc.productAttributes.list.useQuery({ productId }, { enabled: !!productId });
  const labReports = trpc.labReports.list.useQuery({ productId }, { enabled: !!productId });
  const categoryId = product.data?.categoryId;
  const related = trpc.products.list.useQuery(
    { categoryId },
    { enabled: !!categoryId, staleTime: 5 * 60 * 1000 }
  );

  // Auto-select first available variant when data loads
  useEffect(() => {
    if (!variants.data || selectedVariantId !== null) return;
    const active = variants.data.filter((v) => v.isActive);
    if (active.length > 0) {
      const first = active.find((v) => v.inventory > 0) ?? active[0];
      setSelectedVariantId(first.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants.data]);

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Added to cart!", { action: { label: "View Cart", onClick: openCart } });
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
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
  const activeVariants = (variants.data?.filter((v) => v.isActive) ?? []) as Array<{
    id: number; name: string; price: string; compareAtPrice: string | null;
    inventory: number; isActive: boolean; imageUrl: string | null;
  }>;
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null;

  // Price display logic
  const minVariantPrice = activeVariants.length > 0
    ? Math.min(...activeVariants.map((v) => parseFloat(v.price)))
    : null;
  const displayPrice = selectedVariant
    ? parseFloat(selectedVariant.price)
    : minVariantPrice ?? parseFloat(p.price);
  const showFromPrefix = !selectedVariant && activeVariants.length > 0;
  const displayCompareAt = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice)
    : p.compareAtPrice ? parseFloat(p.compareAtPrice) : null;
  const hasDiscount = !showFromPrefix && displayCompareAt !== null && displayCompareAt > displayPrice;
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

  // Two-level (Strain → Weight) detection
  const STRAIN_WEIGHT_RE = /^(.+?)\s+-\s+(.+)$/;
  const isLayered = activeVariants.length > 0 && activeVariants.every((v) => STRAIN_WEIGHT_RE.test(v.name));
  const strains = isLayered
    ? [...new Map(activeVariants.map((v) => [v.name.match(STRAIN_WEIGHT_RE)![1].trim(), v])).keys()]
    : [];
  const strainFirstVariant = selectedStrain
    ? activeVariants.find((v) => v.name.match(STRAIN_WEIGHT_RE)?.[1]?.trim() === selectedStrain) ?? null
    : null;
  const opt1Label = attributes.data?.find((a: any) => a.key === "variant_option_1")?.value as string | undefined;
  const opt2Label = attributes.data?.find((a: any) => a.key === "variant_option_2")?.value as string | undefined;

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
          {/* Image — switches to variant image when one is selected */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl overflow-hidden">
            {(() => {
              const displayImg = selectedVariant?.imageUrl ?? strainFirstVariant?.imageUrl ?? p.imageUrl;
              return displayImg ? (
                <img
                  key={displayImg}
                  src={displayImg}
                  alt={selectedVariant ? `${p.name} — ${selectedVariant.name}` : p.name}
                  loading="eager"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.onerror = null;
                    t.src = '/placeholder-product.svg';
                  }}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 md:w-20 h-16 md:h-20 text-gray-200" />
                </div>
              );
            })()}
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
                {showFromPrefix ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-medium text-gray-500">From</span>
                    <span className="text-2xl md:text-3xl font-bold text-gray-900">
                      ${displayPrice.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Stock indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isOutOfStock ? "bg-red-400" : "bg-green-400"}`} />
                <span className={`text-sm font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                  {isOutOfStock ? "Out of Stock" : displayInventory >= 999 ? "In Stock" : `In Stock (${displayInventory} available)`}
                </span>
              </div>
            </div>

            {p.description && (
              <p className="text-gray-600 leading-relaxed mb-5 text-sm whitespace-pre-line">{p.description}</p>
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

            {/* Variant selector — layered (Strain → Weight) or flat */}
            {isLayered ? (
              <div className="mb-5 space-y-4">
                {/* Level 1: Strain */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{opt1Label ? `Select ${opt1Label.charAt(0).toUpperCase()}${opt1Label.slice(1)}:` : "Select Strain:"}</p>
                  <div className="flex flex-wrap gap-2">
                    {strains.map((strain) => {
                      const strainVariants = activeVariants.filter(
                        (v) => v.name.match(STRAIN_WEIGHT_RE)?.[1]?.trim() === strain
                      );
                      const allOut = strainVariants.every((v) => v.inventory === 0);
                      const isSelected = selectedStrain === strain;
                      const thumb = strainVariants[0]?.imageUrl;
                      return (
                        <button
                          key={strain}
                          onClick={() => {
                            if (!allOut) {
                              setSelectedStrain(strain);
                              setSelectedVariantId(null);
                            }
                          }}
                          disabled={allOut}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                            isSelected
                              ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                              : allOut
                              ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {thumb && (
                            <img
                              src={thumb}
                              alt={strain}
                              className={`w-6 h-6 rounded-lg object-cover shrink-0 ${isSelected ? "ring-1 ring-white/40" : ""}`}
                            />
                          )}
                          <span>{strain}</span>
                          {allOut && <span className="text-xs opacity-60 ml-0.5">(Out)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level 2: Weight (only shown after strain selected) */}
                {selectedStrain && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{opt2Label ? `Select ${opt2Label.charAt(0).toUpperCase()}${opt2Label.slice(1)}:` : "Select Weight:"}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeVariants
                        .filter((v) => v.name.match(STRAIN_WEIGHT_RE)?.[1]?.trim() === selectedStrain)
                        .map((v) => {
                          const weight = v.name.match(STRAIN_WEIGHT_RE)![2].trim();
                          const outOfStock = v.inventory === 0;
                          const isSelected = selectedVariantId === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => !outOfStock && setSelectedVariantId(isSelected ? null : v.id)}
                              disabled={outOfStock}
                              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                isSelected
                                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                  : outOfStock
                                  ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              <span>{weight}</span>
                              <span className={`ml-1.5 text-xs ${isSelected ? "opacity-70" : "opacity-60"}`}>
                                ${parseFloat(v.price).toFixed(2)}
                              </span>
                              {outOfStock && <span className="text-xs opacity-60 ml-0.5">(Out)</span>}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : activeVariants.length > 0 ? (
              <div className="mb-5">
                {(() => {
                  const vt = attributes.data?.find((a: any) => a.key === "variant_option_1")?.value;
                  const label = vt
                    ? `Select ${vt.charAt(0).toUpperCase()}${vt.slice(1)}:`
                    : "Select Option";
                  return <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>;
                })()}
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => {
                    const outOfStock = v.inventory !== null && v.inventory === 0;
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => !outOfStock && setSelectedVariantId(v.id)}
                        disabled={outOfStock}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                          isSelected
                            ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                            : outOfStock
                            ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {v.imageUrl && (
                          <img src={v.imageUrl} alt={v.name} className={`w-6 h-6 rounded-lg object-cover shrink-0 ${isSelected ? "ring-1 ring-white/40" : ""}`} />
                        )}
                        <span>{v.name}</span>
                        <span className={`text-xs ${isSelected ? "opacity-70" : "opacity-60"}`}>
                          ${parseFloat(v.price).toFixed(2)}
                        </span>
                        {outOfStock && <span className="text-xs opacity-60">(Out)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

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
                variant="outline"
                size="icon"
                className={`h-11 w-11 rounded-xl border-gray-200 shrink-0 ${
                  isWishlisted ? "bg-red-50 border-red-200 text-red-500" : "text-gray-400 hover:text-red-500 hover:border-red-200"
                }`}
                onClick={handleWishlist}
                disabled={addWishlist.isPending || removeWishlist.isPending}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
              <Button
                className="flex-1 h-11 bg-gray-900 hover:bg-black text-white rounded-xl font-medium"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addToCart.isPending || (isLayered && !selectedVariantId)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isOutOfStock
                  ? "Out of Stock"
                  : isLayered && !selectedStrain
                  ? `Select a ${opt1Label ?? "Strain"}`
                  : isLayered && !selectedVariantId
                  ? `Select a ${opt2Label ?? "Weight"}`
                  : "Add to Cart"}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { icon: FlaskConical, label: "Lab Tested" },
                { icon: Truck, label: "Free Ship. $50+" },
                { icon: RotateCcw, label: "30-Day Returns" },
                { icon: Leaf, label: "100% Natural" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-2.5 text-center">
                  <Icon className="w-8 h-8 text-gray-700" />
                  <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Product Characteristics accordion */}
            {(() => {
              const SYSTEM_KEY = /^(gallery_\d+|variant_type|variant_option_\d+|sku)$/;
              const publicAttrs = (attributes.data ?? []).filter((a: any) => !SYSTEM_KEY.test(a.key));
              if (publicAttrs.length === 0) return null;
              return (
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
                        {publicAttrs.map((attr: any) => (
                          <div key={attr.id}>
                            <dt className="text-xs text-gray-500 mb-0.5">{attr.key}</dt>
                            <dd className="text-sm font-medium text-gray-800">{attr.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Lab Reports / COA */}
            {filteredLabReports.length > 0 ? (
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowLabs(!showLabs)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-900 hover:bg-black transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-white shrink-0" />
                    <span className="text-sm font-semibold text-white">View Lab Reports / COA</span>
                    <span className="text-xs bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full">
                      {filteredLabReports.length}
                    </span>
                  </div>
                  {showLabs
                    ? <ChevronUp className="w-4 h-4 text-white/60 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />}
                </button>
                {showLabs && (
                  <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                    {filteredLabReports.map((report) => (
                      <a
                        key={report.id}
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 truncate">
                              {report.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {report.batchNumber && (
                                <span className="text-xs text-gray-400">· Batch: {report.batchNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-900 shrink-0 ml-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Open PDF</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                <FlaskConical className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500">Lab reports coming soon for this product.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {(() => {
        const relatedProducts = (related.data ?? [])
          .filter((rp) => rp.id !== productId && rp.isActive)
          .slice(0, 4);
        if (!relatedProducts.length) return null;
        return (
          <div className="container py-10 md:py-14 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp as any} />
              ))}
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}
