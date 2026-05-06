import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShoppingBag, ChevronDown } from "lucide-react";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-gray-100 text-gray-900",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const orders = trpc.orders.adminList.useQuery();

  const updateStatus = trpc.orders.adminUpdateStatus.useMutation({
    onSuccess: () => { utils.orders.adminList.invalidate(); toast.success("Order status updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.data?.length ?? 0} total orders</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {orders.isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : orders.data && orders.data.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {orders.data.map((order) => (
              <div key={order.id}>
                <div
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center text-sm">
                    <span className="font-semibold text-gray-900">#{order.id}</span>
                    <span className="text-gray-600">{order.userName ?? "—"}</span>
                    <span className="text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-gray-900">${parseFloat(order.total).toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { e.stopPropagation(); updateStatus.mutate({ id: order.id, status: e.target.value as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" }); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                </div>

                {expandedId === order.id && (
                  <div className="px-5 pb-5 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                        <div className="space-y-2">
                          {order.items?.map((item) => (
                            <div key={item.id as number} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                              <span className="font-medium text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping Address</p>
                        {order.shippingAddress ? (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-800">{(order.shippingAddress as any).fullName}</p>
                            <p>{(order.shippingAddress as any).line1}</p>
                            <p>{(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} {(order.shippingAddress as any).zip}</p>
                          </div>
                        ) : <p className="text-sm text-gray-400">No address</p>}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm border-t border-gray-100 pt-3">
                      <span className="text-gray-500">Subtotal: <strong>${parseFloat(order.subtotal).toFixed(2)}</strong></span>
                      <span className="text-gray-500">Shipping: <strong>{parseFloat(order.shippingCost) === 0 ? "Free" : `$${parseFloat(order.shippingCost).toFixed(2)}`}</strong></span>
                      <span className="text-gray-900 font-bold ml-auto">Total: ${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                    {order.notes && <p className="text-xs text-gray-500 mt-2">Notes: {order.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
