import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Check, Pencil, X, Package2, ImageIcon, Upload } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantRow = {
  id: number;
  name: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  inventory: number;
  isActive: boolean;
  sortOrder: number;
  imageUrl: string | null;
  imageKey: string | null;
};

type ImageDraft = {
  base64: string;
  filename: string;
  contentType: string;
  previewUrl: string;
};

const EMPTY_NEW = {
  name: "", sku: "", price: "", compareAtPrice: "", inventory: 0, isActive: true,
  image: null as ImageDraft | null,
};

// ─── Small reusable image picker ──────────────────────────────────────────────

function ImagePicker({
  currentUrl,
  draft,
  onPick,
  onClear,
}: {
  currentUrl?: string | null;
  draft: ImageDraft | null;
  onPick: (d: ImageDraft) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = draft?.previewUrl ?? currentUrl;

  return (
    <div className="flex items-center gap-2">
      {preview ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 group">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          <ImageIcon className="w-4 h-4 text-gray-300" />
        </div>
      )}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
      >
        <Upload className="w-3 h-3" />
        {preview ? "Change" : "Image"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            onPick({ base64: result.split(",")[1], filename: file.name, contentType: file.type, previewUrl: result });
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ProductVariantsEditor({ productId }: { productId: number }) {
  const utils = trpc.useUtils();
  const { data: variants = [], isLoading } = trpc.productVariants.list.useQuery({ productId });

  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({ ...EMPTY_NEW });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<VariantRow & { imageDraft: ImageDraft | null }>>({});

  const invalidate = () => utils.productVariants.list.invalidate({ productId });

  const createMut = trpc.productVariants.create.useMutation({
    onSuccess: () => { invalidate(); setShowAdd(false); setNewRow({ ...EMPTY_NEW }); toast.success("Variant added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.productVariants.update.useMutation({
    onSuccess: () => { invalidate(); setEditingId(null); setEditRow({}); toast.success("Variant updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.productVariants.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success("Variant deleted"); },
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
      ...(newRow.image ? {
        imageBase64: newRow.image.base64,
        imageFilename: newRow.image.filename,
        imageContentType: newRow.image.contentType,
      } : {}),
    });
  };

  const handleSaveEdit = (v: VariantRow) => {
    const payload: Parameters<typeof updateMut.mutate>[0] = {
      id: v.id,
      name: editRow.name ?? v.name,
      sku: editRow.sku !== undefined ? (editRow.sku ?? undefined) : (v.sku ?? undefined),
      price: editRow.price ?? v.price,
      compareAtPrice: editRow.compareAtPrice !== undefined
        ? (editRow.compareAtPrice ?? undefined)
        : (v.compareAtPrice ?? undefined),
      inventory: editRow.inventory !== undefined ? editRow.inventory : v.inventory,
      isActive: editRow.isActive !== undefined ? editRow.isActive : v.isActive,
    };
    if (editRow.imageDraft) {
      payload.imageBase64 = editRow.imageDraft.base64;
      payload.imageFilename = editRow.imageDraft.filename;
      payload.imageContentType = editRow.imageDraft.contentType;
    }
    updateMut.mutate(payload);
  };

  if (isLoading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Variants with Individual Pricing
        </Label>
        <Button
          type="button" size="sm" variant="outline"
          onClick={() => setShowAdd(true)}
          className="rounded-xl border-gray-200 text-gray-900 hover:bg-gray-50 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
        </Button>
      </div>

      {/* Existing variants table */}
      {variants.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Image", "Name", "SKU", "Price", "Cmp At", "Stock", "On", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(variants as VariantRow[]).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 group">
                  {editingId === v.id ? (
                    <>
                      {/* Image picker */}
                      <td className="px-2 py-2">
                        <ImagePicker
                          currentUrl={v.imageUrl}
                          draft={editRow.imageDraft ?? null}
                          onPick={(d) => setEditRow((r) => ({ ...r, imageDraft: d }))}
                          onClear={() => setEditRow((r) => ({ ...r, imageDraft: null }))}
                        />
                      </td>
                      <td className="px-2 py-2"><Input value={editRow.name ?? v.name} onChange={(e) => setEditRow((r) => ({ ...r, name: e.target.value }))} className="h-7 text-xs rounded-lg min-w-[100px]" /></td>
                      <td className="px-2 py-2"><Input value={editRow.sku ?? v.sku ?? ""} onChange={(e) => setEditRow((r) => ({ ...r, sku: e.target.value }))} className="h-7 text-xs rounded-lg w-20" placeholder="SKU" /></td>
                      <td className="px-2 py-2"><Input value={editRow.price ?? v.price} onChange={(e) => setEditRow((r) => ({ ...r, price: e.target.value }))} className="h-7 text-xs rounded-lg w-20" /></td>
                      <td className="px-2 py-2"><Input value={editRow.compareAtPrice ?? v.compareAtPrice ?? ""} onChange={(e) => setEditRow((r) => ({ ...r, compareAtPrice: e.target.value }))} className="h-7 text-xs rounded-lg w-20" /></td>
                      <td className="px-2 py-2"><Input type="number" value={editRow.inventory ?? v.inventory} onChange={(e) => setEditRow((r) => ({ ...r, inventory: parseInt(e.target.value) || 0 }))} className="h-7 text-xs rounded-lg w-16" /></td>
                      <td className="px-2 py-2">
                        <input type="checkbox" checked={editRow.isActive ?? v.isActive} onChange={(e) => setEditRow((r) => ({ ...r, isActive: e.target.checked }))} className="w-3.5 h-3.5 accent-gray-900" />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleSaveEdit(v)} disabled={updateMut.isPending} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => { setEditingId(null); setEditRow({}); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Image thumbnail */}
                      <td className="px-2 py-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {v.imageUrl
                            ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                            : <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
                          }
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[140px] truncate">{v.name}</td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono">{v.sku ?? "—"}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">${parseFloat(v.price).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-gray-400">{v.compareAtPrice ? `$${parseFloat(v.compareAtPrice).toFixed(2)}` : "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-medium ${v.inventory === 0 ? "text-red-500" : v.inventory < 5 ? "text-yellow-500" : "text-green-600"}`}>
                          {v.inventory}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${v.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditingId(v.id); setEditRow({}); }} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => { if (confirm("Delete variant?")) deleteMut.mutate({ id: v.id }); }} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
            <div className="col-span-2 md:col-span-3">
              <Label className="text-xs text-gray-600 mb-1.5 block">Variant Image</Label>
              <ImagePicker
                currentUrl={null}
                draft={newRow.image}
                onPick={(d) => setNewRow((r) => ({ ...r, image: d }))}
                onClear={() => setNewRow((r) => ({ ...r, image: null }))}
              />
            </div>
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
              <Check className="w-3.5 h-3.5 mr-1" /> {createMut.isPending ? "Adding..." : "Add Variant"}
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-xs" onClick={() => { setShowAdd(false); setNewRow({ ...EMPTY_NEW }); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
