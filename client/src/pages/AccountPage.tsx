import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User, ShoppingBag, Heart, Settings, LogOut, Package,
  ChevronRight, Loader2, Eye, EyeOff, MapPin, Clock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Tab = "orders" | "wishlist" | "profile" | "security";

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function AccountPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("orders");
  const utils = trpc.useUtils();

  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery(undefined, { enabled: tab === "orders" });
  const { data: wishlist, isLoading: wishlistLoading } = trpc.wishlist.list.useQuery(undefined, { enabled: tab === "wishlist" });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      navigate("/");
      toast.success("Signed out");
    },
  });

  const removeWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => utils.wishlist.list.invalidate(),
  });

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", phone: (user as any)?.phone || "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPassForm({ currentPassword: "", newPassword: "", confirm: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    navigate("/login?returnTo=/account");
    return null;
  }

  const tabs = [
    { id: "orders" as Tab, label: "My Orders", icon: ShoppingBag },
    { id: "wishlist" as Tab, label: "Wishlist", icon: Heart },
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "security" as Tab, label: "Security", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container py-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                      tab === t.id
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {tab === "orders" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">My Orders</h2>
                {ordersLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : !orders?.length ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No orders yet</p>
                    <p className="text-gray-400 text-sm mt-1 mb-6">Your orders will appear here once you make a purchase.</p>
                    <Link href="/shop">
                      <Button className="bg-gray-900 hover:bg-black text-white rounded-xl">Shop Now</Button>
                    </Link>
                  </div>
                ) : (
                  orders.map((order: any) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">Order #{order.id}</span>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            {order.shippingAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {order.shippingAddress.city}, {order.shippingAddress.state}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
                      </div>
                      {order.items?.length > 0 && (
                        <div className="space-y-2 border-t border-gray-50 pt-4">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{item.productName} {item.variantName && `· ${item.variantName}`}</span>
                              <span className="text-gray-500">x{item.quantity} · ${Number(item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {tab === "wishlist" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Wishlist</h2>
                {wishlistLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : !wishlist?.length ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Your wishlist is empty</p>
                    <p className="text-gray-400 text-sm mt-1 mb-6">Save products you love to find them easily later.</p>
                    <Link href="/shop">
                      <Button className="bg-gray-900 hover:bg-black text-white rounded-xl">Browse Products</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((item: any) => {
                      const p = item.product;
                      if (!p) return null;
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
                          <Link href={`/products/${p.slug || p.id}`}>
                            <div className="aspect-square bg-gray-50 overflow-hidden">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                              )}
                            </div>
                          </Link>
                          <div className="p-4">
                            <Link href={`/products/${p.slug || p.id}`}>
                              <h3 className="font-semibold text-gray-900 hover:underline text-sm mb-1">{p.name}</h3>
                            </Link>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">${Number(p.price).toFixed(2)}</span>
                              <button
                                onClick={() => removeWishlist.mutate({ productId: p.id })}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {tab === "profile" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateProfile.mutate(profileForm);
                  }}
                  className="space-y-5"
                >
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
                    <Input value={user.email || ""} disabled className="h-11 rounded-xl bg-gray-50 text-gray-400" />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-gray-900 hover:bg-black text-white rounded-xl h-11 px-8"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {tab === "security" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Change Password</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (passForm.newPassword !== passForm.confirm) {
                      toast.error("Passwords do not match");
                      return;
                    }
                    changePassword.mutate({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
                  }}
                  className="space-y-5 max-w-sm"
                >
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        value={passForm.currentPassword}
                        onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))}
                        className="h-11 rounded-xl pr-10"
                        required
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">New Password</Label>
                    <Input
                      type="password"
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm((f) => ({ ...f, newPassword: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passForm.confirm}
                      onChange={(e) => setPassForm((f) => ({ ...f, confirm: e.target.value }))}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-gray-900 hover:bg-black text-white rounded-xl h-11 px-8"
                    disabled={changePassword.isPending}
                  >
                    {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
