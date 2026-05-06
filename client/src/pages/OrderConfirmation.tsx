import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderConfirmation() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const orderId = parseInt(params.id ?? "0");
  const order = trpc.orders.byId.useQuery({ id: orderId }, { enabled: !!orderId });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-16 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-500 mt-2">Thank you for your purchase. We'll process your order shortly.</p>
          {order.data && (
            <p className="text-sm text-gray-400 mt-1">Order #{order.data.id}</p>
          )}
        </div>

        {order.data && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Order Details</h2>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.data.status] ?? "bg-gray-100 text-gray-600"}`}>
                {order.data.status}
              </span>
            </div>
            <div className="space-y-3">
              {order.data.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                  <span className="font-medium text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${parseFloat(order.data.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{parseFloat(order.data.shippingCost) === 0 ? "Free" : `$${parseFloat(order.data.shippingCost).toFixed(2)}`}</span></div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span>${parseFloat(order.data.total).toFixed(2)}</span></div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={() => navigate("/orders")}>
            View All Orders
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate("/catalog")}>
            Continue Shopping <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
