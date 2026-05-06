import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  inventory: number;
  isActive: boolean;
  variants?: { label: string; options: string[] }[] | null;
  thcContent?: string | null;
  cbdContent?: string | null;
}

export default function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated } = useAuth();
  const { refetch, openCart } = useCart();

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      refetch();
      toast.success(`${product.name} added to cart`, {
        action: { label: "View Cart", onClick: openCart },
      });
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const utils = trpc.useUtils();
  const { data: wishlistData } = trpc.wishlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const isWishlisted = wishlistData?.some((w: any) => w.productId === product.id) ?? false;

  const addWishlist = trpc.wishlist.add.useMutation({
    onSuccess: () => utils.wishlist.list.invalidate(),
    onError: () => toast.error("Failed to update wishlist"),
  });
  const removeWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => utils.wishlist.list.invalidate(),
    onError: () => toast.error("Failed to update wishlist"),
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (isWishlisted) {
      removeWishlist.mutate({ productId: product.id });
    } else {
      addWishlist.mutate({ productId: product.id });
    }
  };

  const isOutOfStock = product.inventory === 0;
  const hasDiscount = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  return (
    <Link href={`/product/${product.id}`}>
      <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              -{discountPct}%
            </span>
          )}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
              isWishlisted ? "bg-red-500 text-white opacity-100" : "bg-white/90 text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 md:p-4">
          <p className="text-xs text-gray-900 font-medium mb-1 uppercase tracking-wide">
            {product.thcContent ? `THC: ${product.thcContent}` : "Hemp Derived"}
          </p>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-gray-900 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm md:text-base font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through ml-2">
                  ${parseFloat(product.compareAtPrice!).toFixed(2)}
                </span>
              )}
            </div>

            <Button
              size="icon"
              className="w-8 h-8 bg-gray-900 hover:bg-black text-white rounded-lg shrink-0"
              onClick={handleAddToCart}
              disabled={isOutOfStock || addToCart.isPending}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
