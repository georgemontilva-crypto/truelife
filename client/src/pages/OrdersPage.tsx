import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import { getLoginUrl } from "@/const";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const orders = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-gray-600 mb-4">Sign in to view your orders</p>
          <a href={getLoginUrl()}><Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Sign In</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Order History</h1>

        {orders.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.data && orders.data.length > 0 ? (
          <div className="space-y-4">
            {orders.data.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/order-confirmation/${order.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  <p className="font-bold text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate("/catalog")}>
              Start Shopping
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
