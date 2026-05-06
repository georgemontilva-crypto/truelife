import { trpc } from "@/lib/trpc";
import { ShoppingBag, Users, Package, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const stats = trpc.admin.stats.useQuery();
  const recentOrders = trpc.orders.adminList.useQuery();

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-gray-100 text-gray-900",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statCards = [
    { label: "Total Orders", value: stats.data?.totalOrders ?? 0, icon: ShoppingBag, color: "text-gray-900", bg: "bg-gray-50" },
    { label: "Total Revenue", value: `$${parseFloat(stats.data?.totalRevenue ?? "0").toFixed(2)}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Orders", value: stats.data?.pendingOrders ?? 0, icon: TrendingUp, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total Users", value: stats.data?.totalUsers ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Products", value: stats.data?.totalProducts ?? 0, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your store performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Recent Orders</h2>
        {recentOrders.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentOrders.data && recentOrders.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.data.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">#{order.id}</td>
                    <td className="py-3 text-gray-600">{order.userName ?? "—"}</td>
                    <td className="py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-semibold text-gray-900">${parseFloat(order.total).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No orders yet</p>
        )}
      </div>
    </div>
  );
}
