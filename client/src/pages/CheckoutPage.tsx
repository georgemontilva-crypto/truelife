import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Package, MapPin, ShoppingBag } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, refetch } = useCart();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    fullName: "", line1: "", line2: "", city: "", state: "", zip: "", country: "US", notes: "",
  });

  const savedAddresses = trpc.addresses.list.useQuery(undefined, { enabled: isAuthenticated });

  const placeOrder = trpc.orders.place.useMutation({
    onSuccess: (order) => {
      refetch();
      navigate(`/order-confirmation/${order.id}`);
    },
    onError: (err) => toast.error(err.message || "Failed to place order"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-gray-600 mb-4">Sign in to continue with checkout</p>
          <a href={getLoginUrl()}><Button className="bg-gray-900 hover:bg-black text-white rounded-xl">Sign In</Button></a>
        </div>
      </div>
    );
  }

  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.line1 || !form.city || !form.state || !form.zip) {
      toast.error("Please fill in all required fields");
      return;
    }
    placeOrder.mutate({
      shippingAddress: {
        fullName: form.fullName, line1: form.line1, line2: form.line2 || undefined,
        city: form.city, state: form.state, zip: form.zip, country: form.country,
      },
      notes: form.notes || undefined,
    });
  };

  const fillFromSaved = (addr: typeof savedAddresses.data extends (infer T)[] | undefined ? T : never) => {
    if (!addr) return;
    setForm((f) => ({
      ...f,
      fullName: (addr as any).fullName,
      line1: (addr as any).line1,
      line2: (addr as any).line2 ?? "",
      city: (addr as any).city,
      state: (addr as any).state,
      zip: (addr as any).zip,
      country: (addr as any).country,
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Saved addresses */}
            {savedAddresses.data && savedAddresses.data.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Saved Addresses
                </p>
                <div className="space-y-2">
                  {savedAddresses.data.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => fillFromSaved(addr)}
                      className="w-full text-left bg-white rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-200 hover:border-gray-400 transition-colors"
                    >
                      <span className="font-medium">{addr.fullName}</span> — {addr.line1}, {addr.city}, {addr.state} {addr.zip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping address */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-900" /> Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Full Name *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" className="rounded-xl" required />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Address Line 1 *</Label>
                  <Input value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} placeholder="123 Main St" className="rounded-xl" required />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Address Line 2</Label>
                  <Input value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} placeholder="Apt, Suite, etc." className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">City *</Label>
                  <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="New York" className="rounded-xl" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">State *</Label>
                  <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="NY" className="rounded-xl" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">ZIP Code *</Label>
                  <Input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} placeholder="10001" className="rounded-xl" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Country</Label>
                  <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="US" className="rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Order Notes (optional)</Label>
                  <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." className="rounded-xl" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-medium text-base"
              disabled={placeOrder.isPending || items.length === 0}
            >
              {placeOrder.isPending ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
            </Button>
          </form>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-900" /> Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      {item.productImageUrl ? (
                        <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 shrink-0">
                      ${(parseFloat(item.productPrice) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
