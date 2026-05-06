import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { User, MapPin, Plus, Trash2 } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({ fullName: "", line1: "", line2: "", city: "", state: "", zip: "", country: "US", isDefault: false });

  const addresses = trpc.addresses.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const createAddress = trpc.addresses.create.useMutation({
    onSuccess: () => {
      utils.addresses.list.invalidate();
      setShowAddAddress(false);
      setAddrForm({ fullName: "", line1: "", line2: "", city: "", state: "", zip: "", country: "US", isDefault: false });
      toast.success("Address saved!");
    },
  });

  const deleteAddress = trpc.addresses.delete.useMutation({
    onSuccess: () => { utils.addresses.list.invalidate(); toast.success("Address removed"); },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-gray-600 mb-4">Sign in to view your profile</p>
          <a href={getLoginUrl()}><Button className="bg-gray-900 hover:bg-black text-white rounded-xl">Sign In</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* User info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name ?? "User"}</p>
              <p className="text-sm text-gray-500">{user?.email ?? ""}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
              {user?.role}
            </span>
          </div>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => logout()}>
            Sign Out
          </Button>
        </div>

        {/* Addresses */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-900" /> Saved Addresses
            </h2>
            <Button size="sm" variant="outline" className="border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => setShowAddAddress(!showAddAddress)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {showAddAddress && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs text-gray-600 mb-1 block">Full Name</Label><Input value={addrForm.fullName} onChange={(e) => setAddrForm(f => ({ ...f, fullName: e.target.value }))} className="rounded-lg" /></div>
                <div className="col-span-2"><Label className="text-xs text-gray-600 mb-1 block">Address</Label><Input value={addrForm.line1} onChange={(e) => setAddrForm(f => ({ ...f, line1: e.target.value }))} className="rounded-lg" /></div>
                <div><Label className="text-xs text-gray-600 mb-1 block">City</Label><Input value={addrForm.city} onChange={(e) => setAddrForm(f => ({ ...f, city: e.target.value }))} className="rounded-lg" /></div>
                <div><Label className="text-xs text-gray-600 mb-1 block">State</Label><Input value={addrForm.state} onChange={(e) => setAddrForm(f => ({ ...f, state: e.target.value }))} className="rounded-lg" /></div>
                <div><Label className="text-xs text-gray-600 mb-1 block">ZIP</Label><Input value={addrForm.zip} onChange={(e) => setAddrForm(f => ({ ...f, zip: e.target.value }))} className="rounded-lg" /></div>
                <div><Label className="text-xs text-gray-600 mb-1 block">Country</Label><Input value={addrForm.country} onChange={(e) => setAddrForm(f => ({ ...f, country: e.target.value }))} className="rounded-lg" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-gray-900 hover:bg-black text-white rounded-lg" onClick={() => createAddress.mutate(addrForm)} disabled={createAddress.isPending}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddAddress(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {addresses.data && addresses.data.length > 0 ? (
            <div className="space-y-3">
              {addresses.data.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{addr.fullName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p className="text-xs text-gray-500">{addr.city}, {addr.state} {addr.zip}</p>
                  </div>
                  <button onClick={() => deleteAddress.mutate({ id: addr.id })} className="text-gray-400 hover:text-red-500 transition-colors ml-4">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No saved addresses yet</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
