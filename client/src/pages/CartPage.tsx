import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, refetch } = useCart();
  const [, navigate] = useLocation();

  const updateItem = trpc.cart.update.useMutation({ onSuccess: refetch });
  const removeItem = trpc.cart.remove.useMutation({ onSuccess: refetch });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-4">Sign in to view your cart</p>
          <a href={getLoginUrl()}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium text-lg">Your cart is empty</p>
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate("/catalog")}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-5 bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {item.productImageUrl ? (
                      <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.productName}</p>
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                    <p className="text-blue-600 font-bold mt-1">${(parseFloat(item.productPrice) * item.quantity).toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateItem.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50">
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateItem.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50">
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      <button onClick={() => removeItem.mutate({ cartItemId: item.id })} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  onClick={() => navigate("/checkout")}
                >
                  Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
