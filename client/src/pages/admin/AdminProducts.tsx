import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Upload, X, Check } from "lucide-react";

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
  variants: { label: string; options: string[] }[];
};

const EMPTY_FORM: ProductForm = {
  categoryId: 0, name: "", slug: "", description: "", price: "", compareAtPrice: "",
  inventory: 0, isActive: true, isFeatured: false, thcContent: "", cbdContent: "",
  weight: "", imageUrl: "", imageKey: "", variants: [],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [variantLabel, setVariantLabel] = useState("");
  const [variantOptions, setVariantOptions] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const categories = trpc.categories.list.useQuery();
  const products = trpc.products.listAdmin.useQuery();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); setShowForm(false); setForm(EMPTY_FORM); toast.success("Product created!"); },
    onError: (e) => toast.error(e.message),
  });
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
      variants: (p.variants as { label: string; options: string[] }[]) ?? [],
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
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
    } else {
      createProduct.mutate(payload);
    }
  };

  const addVariant = () => {
    if (!variantLabel || !variantOptions) return;
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { label: variantLabel, options: variantOptions.split(",").map((s) => s.trim()).filter(Boolean) }],
    }));
    setVariantLabel(""); setVariantOptions("");
  };

  const catMap = Object.fromEntries(categories.data?.map((c) => [c.id, c.name]) ?? []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.data?.length ?? 0} products total</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editId ? "Edit Product" : "New Product"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Category *</Label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <Label className="text-xs text-gray-600 mb-1 block">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Price *</Label>
              <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="19.99" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Compare At Price</Label>
              <Input value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="29.99" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Inventory</Label>
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
              <Label className="text-xs text-gray-600 mb-1 block">Weight</Label>
              <Input value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="5g" className="rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Product description..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Product Image</Label>
              <div className="flex items-center gap-4">
                {form.imageUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : form.imageUrl ? "Change Image" : "Upload Image"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            {/* Variants */}
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-2 block">Variants</Label>
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{v.label}:</span>
                  <span className="text-sm text-gray-500">{v.options.join(", ")}</span>
                  <button onClick={() => setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))} className="ml-auto text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} placeholder="Label (e.g. Flavor)" className="rounded-xl flex-1" />
                <Input value={variantOptions} onChange={(e) => setVariantOptions(e.target.value)} placeholder="Options (comma separated)" className="rounded-xl flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleSubmit} disabled={createProduct.isPending || updateProduct.isPending}>
              <Check className="w-4 h-4 mr-2" /> {editId ? "Save Changes" : "Create Product"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
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
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300 m-auto mt-2.5" />}
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
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm("Delete this product?")) deleteProduct.mutate({ id: p.id }); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Product
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
