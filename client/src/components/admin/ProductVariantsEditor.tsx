import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Check, Pencil, X, Package2 } from "lucide-react";

type VariantRow = {
  id?: number;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  inventory: number;
  isActive: boolean;
  sortOrder: number;
  isNew?: boolean;
  isDirty?: boolean;
};

const EMPTY_ROW: Omit<VariantRow, "sortOrder"> = {
  name: "", sku: "", price: "", compareAtPrice: "", inventory: 0, isActive: true, isNew: true,
};

export default function ProductVariantsEditor({ productId }: { productId: number }) {
  const utils = trpc.useUtils();
  const { data: variants = [], isLoading } = trpc.productVariants.list.useQuery({ productId });
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState<Omit<VariantRow, "sortOrder">>({ ...EMPTY_ROW });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<VariantRow>>({});

  const createMut = trpc.productVariants.create.useMutation({
    onSuccess: () => {
      utils.productVariants.list.invalidate({ productId });
      setShowAdd(false);
      setNewRow({ ...EMPTY_ROW });
      toast.success("Variant added");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.productVariants.update.useMutation({
    onSuccess: () => {
      utils.productVariants.list.invalidate({ productId });
      setEditingId(null);
      toast.success("Variant updated");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.productVariants.delete.useMutation({
    onSuccess: () => {
      utils.productVariants.list.invalidate({ productId });
      toast.success("Variant deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!newRow.name || !newRow.price) { toast.error("Name and price are required"); return; }
    createMut.mutate({
      productId,
      name: newRow.name,
      sku: newRow.sku || undefined,
      price: newRow.price,
      compareAtPrice: newRow.compareAtPrice || undefined,
      inventory: newRow.inventory,
      isActive: newRow.isActive,
      sortOrder: variants.length,
    });
  };

  const handleSaveEdit = (id: number) => {
    if (!editRow.price && !editRow.name) { setEditingId(null); return; }
    updateMut.mutate({ id, ...editRow });
  };

  if (isLoading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Variants with Individual Pricing
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(true)}
          className="rounded-xl border-gray-200 text-gray-900 hover:bg-gray-50 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
        </Button>
      </div>

      {/* Existing variants */}
      {variants.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "SKU", "Price", "Compare At", "Stock", "Active", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50">
                  {editingId === v.id ? (
                    <>
                      <td className="px-2 py-2"><Input value={editRow.name ?? v.name} onChange={(e) => setEditRow((r) => ({ ...r, name: e.target.value }))} className="h-7 text-xs rounded-lg" /></td>
                      <td className="px-2 py-2"><Input value={editRow.sku ?? v.sku ?? ""} onChange={(e) => setEditRow((r) => ({ ...r, sku: e.target.value }))} className="h-7 text-xs rounded-lg" placeholder="SKU" /></td>
                      <td className="px-2 py-2"><Input value={editRow.price ?? v.price} onChange={(e) => setEditRow((r) => ({ ...r, price: e.target.value }))} className="h-7 text-xs rounded-lg" /></td>
                      <td className="px-2 py-2"><Input value={editRow.compareAtPrice ?? v.compareAtPrice ?? ""} onChange={(e) => setEditRow((r) => ({ ...r, compareAtPrice: e.target.value }))} className="h-7 text-xs rounded-lg" /></td>
                      <td className="px-2 py-2"><Input type="number" value={editRow.inventory ?? v.inventory} onChange={(e) => setEditRow((r) => ({ ...r, inventory: parseInt(e.target.value) || 0 }))} className="h-7 text-xs rounded-lg w-16" /></td>
                      <td className="px-2 py-2">
                        <input type="checkbox" checked={editRow.isActive ?? v.isActive} onChange={(e) => setEditRow((r) => ({ ...r, isActive: e.target.checked }))} className="w-3.5 h-3.5 accent-gray-900" />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleSaveEdit(v.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{v.name}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono">{v.sku ?? "—"}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">${parseFloat(v.price).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-gray-400">{v.compareAtPrice ? `$${parseFloat(v.compareAtPrice).toFixed(2)}` : "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-medium ${v.inventory === 0 ? "text-red-500" : v.inventory < 5 ? "text-yellow-500" : "text-green-600"}`}>{v.inventory}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${v.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingId(v.id); setEditRow({}); }} className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm("Delete variant?")) deleteMut.mutate({ id: v.id }); }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-4 px-3 bg-gray-50 rounded-xl text-gray-400 text-xs">
          <Package2 className="w-4 h-4" />
          No variants yet. Add variants with individual pricing (e.g. different weights or flavors).
        </div>
      )}

      {/* Add new variant form */}
      {showAdd && (
        <div className="border border-gray-200 bg-gray-50/30 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-900">New Variant</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Name *</Label>
              <Input value={newRow.name} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} placeholder="e.g. Strawberry 3.5g" className="rounded-xl text-sm h-8" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">SKU</Label>
              <Input value={newRow.sku} onChange={(e) => setNewRow((r) => ({ ...r, sku: e.target.value }))} placeholder="SKU-001" className="rounded-xl text-sm h-8" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Price *</Label>
              <Input value={newRow.price} onChange={(e) => setNewRow((r) => ({ ...r, price: e.target.value }))} placeholder="29.99" className="rounded-xl text-sm h-8" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Compare At</Label>
              <Input value={newRow.compareAtPrice} onChange={(e) => setNewRow((r) => ({ ...r, compareAtPrice: e.target.value }))} placeholder="39.99" className="rounded-xl text-sm h-8" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Stock</Label>
              <Input type="number" value={newRow.inventory} onChange={(e) => setNewRow((r) => ({ ...r, inventory: parseInt(e.target.value) || 0 }))} className="rounded-xl text-sm h-8" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-gray-900 hover:bg-black text-white rounded-xl text-xs" onClick={handleAdd} disabled={createMut.isPending}>
              <Check className="w-3.5 h-3.5 mr-1" /> Add Variant
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-xs" onClick={() => { setShowAdd(false); setNewRow({ ...EMPTY_ROW }); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
