import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Upload, X, Check, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import ProductVariantsEditor from "@/components/admin/ProductVariantsEditor";
import ProductAttributesEditor from "@/components/admin/ProductAttributesEditor";
import LabReportsEditor from "@/components/admin/LabReportsEditor";

type VariantDraft = {
  draftId: string;
  name: string;
  price: string;
  inventory: number;
  image: { base64: string; filename: string; contentType: string; previewUrl: string } | null;
};

type ProductForm = {
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  thcContent: string;
  cbdContent: string;
  weight: string;
  imageUrl: string;
  imageKey: string;
};

const EMPTY_FORM: ProductForm = {
  categoryId: 0, name: "", slug: "", description: "", price: "", compareAtPrice: "",
  inventory: 0, isActive: true, isFeatured: false, thcContent: "", cbdContent: "",
  weight: "", imageUrl: "", imageKey: "",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [variantType, setVariantType] = useState("");
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const variantImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const utils = trpc.useUtils();
  const categories = trpc.categories.list.useQuery();
  const products = trpc.products.listAdmin.useQuery();

  const createProduct = trpc.products.create.useMutation();
  const createVariant = trpc.productVariants.create.useMutation();
  const setAttributes = trpc.productAttributes.set.useMutation();
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); setShowForm(false); setEditId(null); setForm(EMPTY_FORM); toast.success("Product updated!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); toast.success("Product deleted"); },
  });
  const uploadImage = trpc.products.uploadImage.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({ ...f, imageUrl: data.url, imageKey: data.key }));
      toast.success("Image uploaded!");
      setUploading(false);
    },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]!;
      uploadImage.mutate({ filename: file.name, contentType: file.type, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (p: NonNullable<typeof products.data>[number]) => {
    setEditId(p.id);
    setForm({
      categoryId: p.categoryId, name: p.name, slug: p.slug,
      description: p.description ?? "", price: p.price, compareAtPrice: p.compareAtPrice ?? "",
      inventory: p.inventory, isActive: p.isActive, isFeatured: p.isFeatured,
      thcContent: p.thcContent ?? "", cbdContent: p.cbdContent ?? "", weight: p.weight ?? "",
      imageUrl: p.imageUrl ?? "", imageKey: p.imageKey ?? "",
    });
    setVariantType("");
    setVariantDrafts([]);
    setExpandedSection(null);
    setShowForm(true);
  };

  const addVariantDraft = () => {
    setVariantDrafts((d) => [...d, { draftId: crypto.randomUUID(), name: "", price: "", inventory: 0, image: null }]);
  };

  const updateDraft = (draftId: string, patch: Partial<VariantDraft>) => {
    setVariantDrafts((d) => d.map((v) => v.draftId === draftId ? { ...v, ...patch } : v));
  };

  const removeDraft = (draftId: string) => {
    setVariantDrafts((d) => d.filter((v) => v.draftId !== draftId));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Name, price and category are required");
      return;
    }
    const payload = {
      ...form,
      price: form.price,
      compareAtPrice: form.compareAtPrice || undefined,
      imageUrl: form.imageUrl || undefined,
      imageKey: form.imageKey || undefined,
      thcContent: form.thcContent || undefined,
      cbdContent: form.cbdContent || undefined,
      weight: form.weight || undefined,
      description: form.description || undefined,
    };
    if (editId) {
      updateProduct.mutate({ id: editId, ...payload });
      return;
    }
    try {
      const data = await createProduct.mutateAsync(payload);
      const newId = (data as any)?.id as number | undefined;
      utils.products.listAdmin.invalidate();

      if (newId) {
        // Save variant type attribute
        if (variantType.trim()) {
          await setAttributes.mutateAsync({
            productId: newId,
            attrs: [{ key: "variant_type", value: variantType.trim(), sortOrder: 0 }],
          });
        }
        // Create variant drafts
        for (let i = 0; i < variantDrafts.length; i++) {
          const d = variantDrafts[i];
          if (!d.name || !d.price) continue;
          await createVariant.mutateAsync({
            productId: newId,
            name: d.name,
            price: d.price,
            inventory: d.inventory,
            isActive: true,
            sortOrder: i,
            ...(d.image ? {
              imageBase64: d.image.base64,
              imageFilename: d.image.filename,
              imageContentType: d.image.contentType,
            } : {}),
          });
        }
        setEditId(newId);
        setVariantType("");
        setVariantDrafts([]);
        toast.success("Product created! You can now add more variants, characteristics and lab reports.");
      } else {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setVariantType("");
        setVariantDrafts([]);
        toast.success("Product created!");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create product");
    }
  };

  const toggleSection = (s: string) => setExpandedSection((p) => p === s ? null : s);
  const catMap = Object.fromEntries(categories.data?.map((c) => [c.id, c.name]) ?? []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.data?.length ?? 0} products total</p>
        </div>
        <Button className="bg-gray-900 hover:bg-black text-white rounded-xl" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setVariantType(""); setVariantDrafts([]); setExpandedSection(null); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 text-lg">{editId ? "Edit Product" : "New Product"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setVariantType(""); setVariantDrafts([]); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Category *</Label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value={0}>Select category...</option>
                {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="Product name" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="rounded-xl font-mono text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Base Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="19.99" className="rounded-xl pl-7" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Compare At Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="29.99" className="rounded-xl pl-7" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Base Inventory</Label>
              <Input type="number" value={form.inventory} onChange={(e) => setForm((f) => ({ ...f, inventory: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">THC Content</Label>
              <Input value={form.thcContent} onChange={(e) => setForm((f) => ({ ...f, thcContent: e.target.value }))} placeholder="≤0.3%" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">CBD Content</Label>
              <Input value={form.cbdContent} onChange={(e) => setForm((f) => ({ ...f, cbdContent: e.target.value }))} placeholder="500mg" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Weight / Format</Label>
              <Input value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="3.5g, 1oz, etc." className="rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Product description..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Product Image</Label>
              <div className="flex items-center gap-4">
                {form.imageUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : form.imageUrl ? "Change Image" : "Upload Image"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-gray-900" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded accent-gray-900" />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          {/* Variant Type + inline variants — only during new product creation */}
          {!editId && (
            <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Variants (Optional)</p>
                <p className="text-xs text-gray-500 mt-0.5">Add flavors, sizes or weights — each with its own price and stock</p>
              </div>
              <div className="p-5 space-y-4">
                {/* Variant type label */}
                <div className="max-w-xs">
                  <Label className="text-xs text-gray-600 mb-1 block">Variant Type</Label>
                  <Input
                    value={variantType}
                    onChange={(e) => setVariantType(e.target.value)}
                    placeholder="e.g. Flavor, Strain, Size, Type..."
                    className="rounded-xl text-sm h-8"
                  />
                </div>

                {/* Draft variant rows */}
                {variantDrafts.length > 0 && (
                  <div className="space-y-2">
                    {variantDrafts.map((d) => (
                      <div key={d.draftId} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                        {/* Image picker */}
                        <div className="shrink-0">
                          {d.image ? (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 group cursor-pointer"
                              onClick={() => updateDraft(d.draftId, { image: null })}>
                              <img src={d.image.previewUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => variantImageRefs.current[d.draftId]?.click()}
                              className="w-8 h-8 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center hover:border-gray-400 transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
                            </button>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => { variantImageRefs.current[d.draftId] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const result = ev.target?.result as string;
                                updateDraft(d.draftId, { image: { base64: result.split(",")[1], filename: file.name, contentType: file.type, previewUrl: result } });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                          />
                        </div>
                        <Input
                          value={d.name}
                          onChange={(e) => updateDraft(d.draftId, { name: e.target.value })}
                          placeholder={variantType ? `${variantType} name...` : "Variant name..."}
                          className="rounded-xl text-xs h-7 flex-1 min-w-0"
                        />
                        <div className="relative shrink-0 w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <Input
                            value={d.price}
                            onChange={(e) => updateDraft(d.draftId, { price: e.target.value })}
                            placeholder="Price"
                            className="rounded-xl text-xs h-7 pl-5"
                          />
                        </div>
                        <Input
                          type="number"
                          value={d.inventory}
                          onChange={(e) => updateDraft(d.draftId, { inventory: parseInt(e.target.value) || 0 })}
                          placeholder="Stock"
                          className="rounded-xl text-xs h-7 w-16 shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => removeDraft(d.draftId)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addVariantDraft}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variant
                </button>
              </div>
            </div>
          )}

          {/* Save basic info */}
          <div className="flex gap-3 pb-6 border-b border-gray-100">
            <Button className="bg-gray-900 hover:bg-black text-white rounded-xl" onClick={handleSubmit} disabled={createProduct.isPending || updateProduct.isPending || createVariant.isPending || setAttributes.isPending}>
              <Check className="w-4 h-4 mr-2" /> {editId ? "Save Changes" : createProduct.isPending ? "Creating..." : "Create Product"}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setVariantType(""); setVariantDrafts([]); }}>Cancel</Button>
          </div>

          {/* Advanced sections — only shown when editing an existing product */}
          {editId ? (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Advanced Product Settings</p>

              {/* Variants with pricing */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("variants")}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Variants with Individual Pricing</span>
                    <p className="text-xs text-gray-500 mt-0.5">Add flavors, weights, sizes — each with its own price and stock</p>
                  </div>
                  {expandedSection === "variants" ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {expandedSection === "variants" && (
                  <div className="p-5 border-t border-gray-100">
                    <ProductVariantsEditor productId={editId} />
                  </div>
                )}
              </div>

              {/* Characteristics / Attributes */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("attrs")}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Product Characteristics</span>
                    <p className="text-xs text-gray-500 mt-0.5">Active ingredient, flavor profile, terpenes, extraction method, etc.</p>
                  </div>
                  {expandedSection === "attrs" ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {expandedSection === "attrs" && (
                  <div className="p-5 border-t border-gray-100">
                    <ProductAttributesEditor productId={editId} />
                  </div>
                )}
              </div>

              {/* Lab Reports */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("labs")}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Lab Reports / COA</span>
                    <p className="text-xs text-gray-500 mt-0.5">Upload Certificate of Analysis per variant or for the whole product</p>
                  </div>
                  {expandedSection === "labs" ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {expandedSection === "labs" && (
                  <div className="p-5 border-t border-gray-100">
                    <LabReportsEditor productId={editId} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <strong>Tip:</strong> After creating the product, edit it to add variants with individual pricing, product characteristics and lab reports.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Products table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {products.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : products.data && products.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-left">
                  {["Product", "Category", "Price", "Inventory", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.data.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          {p.isFeatured && <span className="text-xs text-amber-600 font-medium">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{catMap[p.categoryId] ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">${parseFloat(p.price).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${p.inventory === 0 ? "text-red-600" : p.inventory < 10 ? "text-yellow-600" : "text-green-600"}`}>
                        {p.inventory}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm("Delete this product?")) deleteProduct.mutate({ id: p.id }); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No products yet</p>
            <Button className="mt-4 bg-gray-900 hover:bg-black text-white rounded-xl" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Product
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
