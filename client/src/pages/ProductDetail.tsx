import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ArrowLeft, Shield, Truck, RotateCcw } from "lucide-react";
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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const productId = parseInt(params.id ?? "0");
  const product = trpc.products.byId.useQuery({ id: productId }, { enabled: !!productId });

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
    addToCart.mutate({ productId, quantity, selectedVariants });
  };

  if (product.isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
          <p className="text-gray-500">Product not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/catalog")}>
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  const p = product.data;
  const isOutOfStock = p.inventory === 0;
  const hasDiscount = p.compareAtPrice && parseFloat(p.compareAtPrice) > parseFloat(p.price);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="container py-10">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/catalog")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl overflow-hidden">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-200" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
                Hemp Derived · ≤0.3% Δ9THC
              </p>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">{p.name}</h1>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">${parseFloat(p.price).toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">${parseFloat(p.compareAtPrice!).toFixed(2)}</span>
                )}
              </div>

              {/* Stock indicator */}
              <div className="flex items-center gap-2 mt-3">
                <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-400" : "bg-green-400"}`} />
                <span className={`text-sm font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                  {isOutOfStock ? "Out of Stock" : `In Stock (${p.inventory} available)`}
                </span>
              </div>
            </div>

            {p.description && (
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">{p.description}</p>
            )}

            {/* Product details */}
            {(p.thcContent || p.cbdContent || p.weight) && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-4">
                {p.thcContent && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">THC Content</p>
                    <p className="text-sm font-semibold text-gray-800">{p.thcContent}</p>
                  </div>
                )}
                {p.cbdContent && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">CBD Content</p>
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

            {/* Variants */}
            {p.variants && p.variants.length > 0 && (
              <div className="space-y-4 mb-6">
                {p.variants.map((variant) => (
                  <div key={variant.label}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{variant.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedVariants((prev) => ({ ...prev, [variant.label]: option }))}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            selectedVariants[variant.label] === option
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(p.inventory, q + 1))}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                >
                  +
                </button>
              </div>

              <Button
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addToCart.isPending}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: "Lab Tested" },
                { icon: Truck, label: "Free Shipping $50+" },
                { icon: RotateCcw, label: "30-Day Returns" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-3 text-center">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
