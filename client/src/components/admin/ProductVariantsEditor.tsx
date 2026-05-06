import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Check, Pencil, X, Package2, ImageIcon, Upload, Layers } from "lucide-react";

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

const DEFAULT_WEIGHTS = ["1g", "3.5g", "7g", "14g", "28g"];

type WeightRow = { weight: string; checked: boolean; price: string; inStock: boolean };
type BulkState = { strainName: string; image: ImageDraft | null; weights: WeightRow[] };

function defaultBulk(): BulkState {
  return {
    strainName: "",
    image: null,
    weights: DEFAULT_WEIGHTS.map((w) => ({ weight: w, checked: false, price: "", inStock: true })),
  };
}

// ─── Image picker ─────────────────────────────────────────────────────────────

function ImagePicker({
  currentUrl, draft, onPick, onClear,
}: {
  currentUrl?: string | null;
  draft: ImageDraft | null;
  onPick: (d: ImageDraft) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = draft?.previewUrl ?? currentUrl;

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 flex items-center justify-center">
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-cover" />
          : <ImageIcon className="w-5 h-5 text-gray-300" />}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-3 h-3" />
          {preview ? "Change image" : "Upload image"}
        </button>
        {preview && (
          <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-red-500 transition-colors text-left">
            Remove
          </button>
        )}
      </div>
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
            onPick({ base64: result.split(",")[1]!, filename: file.name, contentType: file.type, previewUrl: result });
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Single variant card ──────────────────────────────────────────────────────

function VariantCard({
  v, isEditing, onEdit, onCancelEdit, updateMut, deleteMut,
}: {
  v: VariantRow;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  updateMut: ReturnType<typeof trpc.productVariants.update.useMutation>;
  deleteMut: ReturnType<typeof trpc.productVariants.delete.useMutation>;
}) {
  const [editRow, setEditRow] = useState<Partial<VariantRow & { imageDraft: ImageDraft | null }>>({});

  const handleEdit = () => { setEditRow({}); onEdit(); };
  const handleCancel = () => { setEditRow({}); onCancelEdit(); };

  const handleSave = () => {
    const payload: Parameters<typeof updateMut.mutate>[0] = {
      id: v.id,
      name: editRow.name ?? v.name,
      sku: editRow.sku !== undefined ? (editRow.sku || undefined) : (v.sku ?? undefined),
      price: editRow.price ?? v.price,
      compareAtPrice: editRow.compareAtPrice !== undefined
        ? (editRow.compareAtPrice || undefined)
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

  const displayPrice = `$${parseFloat(v.price).toFixed(2)}`;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0 flex items-center justify-center">
          {v.imageUrl
            ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
            : <ImageIcon className="w-4 h-4 text-gray-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-gray-700">{displayPrice}</span>
            {v.compareAtPrice && (
              <span className="text-xs text-gray-400 line-through">${parseFloat(v.compareAtPrice).toFixed(2)}</span>
            )}
            <span className="text-xs text-gray-500">Stock: <span className={`font-medium ${v.inventory === 0 ? "text-red-500" : v.inventory < 5 ? "text-yellow-500" : "text-green-600"}`}>{v.inventory}</span></span>
            {!v.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">Draft</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={handleEdit} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Edit variant">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => { if (confirm(`Delete "${v.name}"?`)) deleteMut.mutate({ id: v.id }); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete variant">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Image</Label>
            <ImagePicker
              currentUrl={v.imageUrl}
              draft={editRow.imageDraft ?? null}
              onPick={(d) => setEditRow((r) => ({ ...r, imageDraft: d }))}
              onClear={() => setEditRow((r) => ({ ...r, imageDraft: null }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Name *</Label>
              <Input value={editRow.name ?? v.name} onChange={(e) => setEditRow((r) => ({ ...r, name: e.target.value }))} className="h-8 text-sm rounded-lg" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">SKU</Label>
              <Input value={editRow.sku ?? v.sku ?? ""} onChange={(e) => setEditRow((r) => ({ ...r, sku: e.target.value }))} placeholder="SKU-001" className="h-8 text-sm rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <Input value={editRow.price ?? v.price} onChange={(e) => setEditRow((r) => ({ ...r, price: e.target.value }))} className="h-8 text-sm rounded-lg pl-6" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Compare At</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <Input value={editRow.compareAtPrice ?? v.compareAtPrice ?? ""} onChange={(e) => setEditRow((r) => ({ ...r, compareAtPrice: e.target.value }))} placeholder="0.00" className="h-8 text-sm rounded-lg pl-6" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Stock</Label>
              <Input type="number" value={editRow.inventory ?? v.inventory} onChange={(e) => setEditRow((r) => ({ ...r, inventory: parseInt(e.target.value) || 0 }))} className="h-8 text-sm rounded-lg" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Active</Label>
              <div className="flex items-center gap-2 h-8">
                <input type="checkbox" id={`active-${v.id}`} checked={editRow.isActive ?? v.isActive} onChange={(e) => setEditRow((r) => ({ ...r, isActive: e.target.checked }))} className="w-4 h-4 accent-gray-900 rounded" />
                <label htmlFor={`active-${v.id}`} className="text-sm text-gray-700 cursor-pointer">
                  {(editRow.isActive ?? v.isActive) ? "Active" : "Draft"}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" onClick={handleCancel} className="rounded-xl text-sm">Cancel</Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={updateMut.isPending} className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm min-w-[110px]">
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bulk strain panel ────────────────────────────────────────────────────────

function BulkStrainPanel({
  productId, sortOffset, onDone, onCancel,
}: {
  productId: number;
  sortOffset: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [bulk, setBulk] = useState<BulkState>(defaultBulk());
  const [saving, setSaving] = useState(false);

  const createMut = trpc.productVariants.create.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const updateWeight = (w: string, patch: Partial<WeightRow>) =>
    setBulk((b) => ({ ...b, weights: b.weights.map((r) => (r.weight === w ? { ...r, ...patch } : r)) }));

  const selectedWeights = bulk.weights.filter((r) => r.checked);

  const handleAddAll = async () => {
    if (!bulk.strainName.trim()) { toast.error("Enter a strain name"); return; }
    if (!selectedWeights.length) { toast.error("Select at least one weight"); return; }
    for (const w of selectedWeights) {
      if (!w.price) { toast.error(`Enter a price for ${w.weight}`); return; }
    }

    setSaving(true);
    try {
      for (let i = 0; i < selectedWeights.length; i++) {
        const w = selectedWeights[i];
        await createMut.mutateAsync({
          productId,
          name: `${bulk.strainName.trim()} - ${w.weight}`,
          price: w.price,
          inventory: w.inStock ? 999 : 0,
          isActive: true,
          sortOrder: sortOffset + i,
          ...(bulk.image ? {
            imageBase64: bulk.image.base64,
            imageFilename: bulk.image.filename,
            imageContentType: bulk.image.contentType,
          } : {}),
        });
      }
      toast.success(`${selectedWeights.length} variant${selectedWeights.length !== 1 ? "s" : ""} added`);
      onDone();
    } catch {
      toast.error("Some variants failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-medium text-gray-900">Add Strain + Weights</p>
        </div>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4 bg-gray-50/50">
        {/* Strain name */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Strain Name *</Label>
          <Input
            value={bulk.strainName}
            onChange={(e) => setBulk((b) => ({ ...b, strainName: e.target.value }))}
            placeholder="e.g. Blue Dream"
            className="h-8 text-sm rounded-lg max-w-xs"
            autoFocus
          />
        </div>

        {/* Strain image */}
        <div>
          <Label className="text-xs text-gray-500 mb-2 block">Strain Image <span className="text-gray-400 font-normal">(shared across all weights)</span></Label>
          <ImagePicker
            currentUrl={null}
            draft={bulk.image}
            onPick={(d) => setBulk((b) => ({ ...b, image: d }))}
            onClear={() => setBulk((b) => ({ ...b, image: null }))}
          />
        </div>

        {/* Weight + price rows */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-xs text-gray-500">Weights & Prices *</Label>
            <span className="text-xs text-gray-400">— check the weights you want to add</span>
          </div>
          <div className="space-y-2">
            {bulk.weights.map((row) => (
              <div key={row.weight} className="flex items-center gap-2">
                <label className="flex items-center gap-2 w-16 shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={row.checked}
                    onChange={(e) => updateWeight(row.weight, { checked: e.target.checked })}
                    className="w-4 h-4 accent-gray-900 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{row.weight}</span>
                </label>
                <div className={`flex items-center gap-2 flex-1 transition-opacity ${row.checked ? "" : "opacity-30 pointer-events-none"}`}>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <Input
                      value={row.price}
                      onChange={(e) => updateWeight(row.weight, { price: e.target.value })}
                      placeholder="0.00"
                      className="h-7 pl-5 text-xs rounded-lg"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none w-24 shrink-0">
                    <input
                      type="checkbox"
                      checked={row.inStock}
                      onChange={(e) => updateWeight(row.weight, { inStock: e.target.checked })}
                      className="w-4 h-4 accent-gray-900 rounded"
                    />
                    <span className={`text-xs font-medium ${row.inStock ? "text-green-600" : "text-gray-400"}`}>
                      {row.inStock ? "In Stock" : "No Stock"}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" size="sm" variant="ghost" className="rounded-xl text-sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddAll}
            disabled={saving || !selectedWeights.length}
            className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {saving
              ? "Adding…"
              : `Add ${selectedWeights.length > 0 ? selectedWeights.length : ""} Variant${selectedWeights.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ProductVariantsEditor({ productId }: { productId: number }) {
  const utils = trpc.useUtils();
  const { data: variants = [], isLoading } = trpc.productVariants.list.useQuery({ productId });

  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newRow, setNewRow] = useState({ ...EMPTY_NEW });
  const [editingId, setEditingId] = useState<number | null>(null);

  const invalidate = () => utils.productVariants.list.invalidate({ productId });

  const createMut = trpc.productVariants.create.useMutation({
    onSuccess: () => { invalidate(); setShowAdd(false); setNewRow({ ...EMPTY_NEW }); toast.success("Variant added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.productVariants.update.useMutation({
    onSuccess: () => { invalidate(); setEditingId(null); toast.success("Variant updated"); },
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

  if (isLoading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Variants with Individual Pricing
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => { setShowBulk(true); setShowAdd(false); setEditingId(null); }}
            className="rounded-xl border-gray-200 text-gray-900 hover:bg-gray-50 text-xs gap-1"
          >
            <Layers className="w-3.5 h-3.5" /> Add Strain
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => { setShowAdd(true); setShowBulk(false); setEditingId(null); }}
            className="rounded-xl border-gray-200 text-gray-900 hover:bg-gray-50 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
          </Button>
        </div>
      </div>

      {/* Variant cards */}
      {variants.length > 0 ? (
        <div className="space-y-2">
          {(variants as VariantRow[]).map((v) => (
            <VariantCard
              key={v.id}
              v={v}
              isEditing={editingId === v.id}
              onEdit={() => setEditingId(v.id)}
              onCancelEdit={() => setEditingId(null)}
              updateMut={updateMut}
              deleteMut={deleteMut}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-4 px-3 bg-gray-50 rounded-xl text-gray-400 text-xs">
          <Package2 className="w-4 h-4" />
          No variants yet. Use "Add Strain" for strain+weight combos, or "Add Variant" for a single variant.
        </div>
      )}

      {/* Bulk strain panel */}
      {showBulk && (
        <BulkStrainPanel
          productId={productId}
          sortOffset={variants.length}
          onDone={() => { invalidate(); setShowBulk(false); }}
          onCancel={() => setShowBulk(false)}
        />
      )}

      {/* Single variant form */}
      {showAdd && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">New Variant</p>
            <button type="button" onClick={() => { setShowAdd(false); setNewRow({ ...EMPTY_NEW }); }} className="p-1 text-gray-400 hover:text-gray-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-4 space-y-4 bg-gray-50/50">
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Image</Label>
              <ImagePicker
                currentUrl={null}
                draft={newRow.image}
                onPick={(d) => setNewRow((r) => ({ ...r, image: d }))}
                onClear={() => setNewRow((r) => ({ ...r, image: null }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Name *</Label>
                <Input value={newRow.name} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} placeholder="e.g. Strawberry 3.5g" className="h-8 text-sm rounded-lg" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">SKU</Label>
                <Input value={newRow.sku} onChange={(e) => setNewRow((r) => ({ ...r, sku: e.target.value }))} placeholder="SKU-001" className="h-8 text-sm rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <Input value={newRow.price} onChange={(e) => setNewRow((r) => ({ ...r, price: e.target.value }))} placeholder="29.99" className="h-8 text-sm rounded-lg pl-6" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Compare At</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <Input value={newRow.compareAtPrice} onChange={(e) => setNewRow((r) => ({ ...r, compareAtPrice: e.target.value }))} placeholder="39.99" className="h-8 text-sm rounded-lg pl-6" />
                </div>
              </div>
            </div>
            <div className="w-1/2 pr-1.5">
              <Label className="text-xs text-gray-500 mb-1 block">Stock</Label>
              <Input type="number" value={newRow.inventory} onChange={(e) => setNewRow((r) => ({ ...r, inventory: parseInt(e.target.value) || 0 }))} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" className="rounded-xl text-sm" onClick={() => { setShowAdd(false); setNewRow({ ...EMPTY_NEW }); }}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleAdd} disabled={createMut.isPending} className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm min-w-[110px]">
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {createMut.isPending ? "Adding…" : "Add Variant"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
