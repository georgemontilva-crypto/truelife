import { useState, useRef, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Package, Upload, X,
  Bold, Italic, List, ImageIcon, ArrowLeft,
} from "lucide-react";
import ProductVariantsEditor from "@/components/admin/ProductVariantsEditor";
import ProductAttributesEditor from "@/components/admin/ProductAttributesEditor";
import LabReportsEditor from "@/components/admin/LabReportsEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  imageUrl: string;
  imageKey: string;
};

type ImageDraft = {
  base64: string;
  filename: string;
  contentType: string;
  previewUrl: string;
};

type ValueInput = { id: string; text: string };

type OptionDraft = {
  id: string;
  name: string;
  valueInputs: ValueInput[];
  collapsed: boolean;
};

type VariantRow = {
  name: string;
  price: string;
  inStock: boolean;
  image: ImageDraft | null;
};

type GalleryImg = { url: string; key: string };

const EMPTY: ProductForm = {
  categoryId: 0, name: "", slug: "", description: "", price: "", compareAtPrice: "",
  inventory: 0, isActive: true, isFeatured: false, imageUrl: "", imageKey: "",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function cartesian(arrays: string[][]): string[] {
  if (!arrays.length) return [];
  return arrays
    .reduce<string[][]>((acc, arr) => acc.flatMap(c => arr.map(v => [...c, v])), [[]])
    .map(c => c.join(" - "));
}

function newOption(): OptionDraft {
  return { id: crypto.randomUUID(), name: "", valueInputs: [{ id: crypto.randomUUID(), text: "" }], collapsed: false };
}

// ─── Variant image cell ───────────────────────────────────────────────────────

function VariantImageCell({ image, onPick, onClear }: {
  image: ImageDraft | null;
  onPick: (d: ImageDraft) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative w-8 h-8 group shrink-0">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-8 h-8 rounded-lg border border-dashed border-gray-300 overflow-hidden flex items-center justify-center hover:border-gray-500 transition-colors bg-gray-50"
      >
        {image
          ? <img src={image.previewUrl} alt="" className="w-full h-full object-cover" />
          : <ImageIcon className="w-3.5 h-3.5 text-gray-300" />}
      </button>
      {image && (
        <button
          type="button"
          onClick={onClear}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-2 h-2 text-white" />
        </button>
      )}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [sku, setSku] = useState("");

  // Gallery
  const [gallery, setGallery] = useState<GalleryImg[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Variants (create mode)
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

  // Refs
  const descRef = useRef<HTMLTextAreaElement>(null);
  const mainImgRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const skuInit = useRef(false);

  // tRPC
  const utils = trpc.useUtils();
  const categories = trpc.categories.list.useQuery();
  const products = trpc.products.listAdmin.useQuery();

  const { data: allAttrs = [] } = trpc.productAttributes.list.useQuery(
    { productId: editId ?? 0 },
    { enabled: !!editId }
  );

  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); toast.success("Product saved!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); toast.success("Deleted"); },
  });
  const uploadImage = trpc.products.uploadImage.useMutation();
  const createVariant = trpc.productVariants.create.useMutation();
  const setAttrs = trpc.productAttributes.set.useMutation();

  // Derived variant names from options
  const variantNames = useMemo(() => {
    const filled = options
      .map(o => o.valueInputs.filter(v => v.text.trim()).map(v => v.text.trim()))
      .filter(vals => vals.length > 0);
    return filled.length ? cartesian(filled) : [];
  }, [options]);

  // Sync variantRows when names change — preserve prices/stock for existing rows
  const variantNamesStr = variantNames.join("|");
  useEffect(() => {
    setVariantRows(prev => {
      const prevMap = new Map(prev.map(r => [r.name, r]));
      return variantNames.map(name => prevMap.get(name) ?? { name, price: "", inStock: true, image: null });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantNamesStr]);

  // Init SKU and gallery from attrs in edit mode
  const attrsStr = allAttrs.map(a => `${a.key}=${a.value}`).join("|");
  useEffect(() => {
    if (!editId || !allAttrs.length || skuInit.current) return;
    setSku(allAttrs.find(a => a.key === "sku")?.value ?? "");
    const galleryAttrs = allAttrs
      .filter(a => /^gallery_\d+$/.test(a.key))
      .sort((a, b) => a.key.localeCompare(b.key));
    setGallery(galleryAttrs.map(a => ({ url: a.value, key: a.key })));
    skuInit.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, attrsStr]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(EMPTY); setSku(""); setGallery([]);
    setHasVariants(false); setOptions([]); setVariantRows([]);
    setEditId(null); skuInit.current = false;
  };

  const handleEdit = (p: NonNullable<typeof products.data>[number]) => {
    skuInit.current = false;
    setForm({
      categoryId: p.categoryId, name: p.name, slug: p.slug,
      description: p.description ?? "", price: p.price,
      compareAtPrice: p.compareAtPrice ?? "", inventory: p.inventory,
      isActive: p.isActive, isFeatured: p.isFeatured,
      imageUrl: p.imageUrl ?? "", imageKey: p.imageKey ?? "",
    });
    setSku(""); setGallery([]);
    setOptions([]); setVariantRows([]);
    setEditId(p.id);
    setShowForm(true);
  };

  const applyFormat = (type: "bold" | "italic" | "bullet") => {
    const ta = descRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = form.description.slice(s, e) || (type === "bullet" ? "Item" : type === "bold" ? "bold text" : "italic text");
    const rep = type === "bold" ? `**${sel}**` : type === "italic" ? `_${sel}_` : sel.split("\n").map(l => `• ${l}`).join("\n");
    const next = form.description.slice(0, s) + rep + form.description.slice(e);
    setForm(f => ({ ...f, description: next }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s, s + rep.length); }, 0);
  };

  // ── Image handlers ─────────────────────────────────────────────────────────

  const handleMainImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingMain(true);
    const reader = new FileReader();
    reader.onload = () => {
      uploadImage.mutate({ filename: file.name, contentType: file.type, base64: (reader.result as string).split(",")[1]! }, {
        onSuccess: d => { setForm(f => ({ ...f, imageUrl: d.url, imageKey: d.key })); setUploadingMain(false); },
        onError: () => setUploadingMain(false),
      });
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    setUploadingGallery(true);
    let rem = files.length;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        uploadImage.mutate({ filename: file.name, contentType: file.type, base64: (reader.result as string).split(",")[1]! }, {
          onSuccess: async d => {
            if (editId) {
              const existingNums = allAttrs.filter(a => /^gallery_\d+$/.test(a.key)).map(a => parseInt(a.key.slice(8)));
              const next = existingNums.length ? Math.max(...existingNums) + 1 : 2;
              const newAttrs = [...allAttrs, { id: 0, productId: editId, key: `gallery_${next}`, value: d.url, sortOrder: allAttrs.length, createdAt: new Date() }];
              await setAttrs.mutateAsync({ productId: editId, attrs: newAttrs.map((a, i) => ({ key: a.key, value: a.value, sortOrder: i })) });
              utils.productAttributes.list.invalidate({ productId: editId });
            } else {
              setGallery(g => [...g, { url: d.url, key: d.key }]);
            }
            if (--rem === 0) setUploadingGallery(false);
          },
          onError: () => { if (--rem === 0) setUploadingGallery(false); },
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeGalleryImg = async (galleryKey: string) => {
    if (editId) {
      const newAttrs = allAttrs.filter(a => a.key !== galleryKey).map((a, i) => ({ key: a.key, value: a.value, sortOrder: i }));
      await setAttrs.mutateAsync({ productId: editId, attrs: newAttrs });
      utils.productAttributes.list.invalidate({ productId: editId });
    } else {
      setGallery(g => g.filter(i => i.key !== galleryKey));
    }
  };

  // ── Options ────────────────────────────────────────────────────────────────

  const updateOpt = (id: string, p: Partial<OptionDraft>) =>
    setOptions(o => o.map(x => x.id === id ? { ...x, ...p } : x));

  const removeOpt = (id: string) => setOptions(o => o.filter(x => x.id !== id));

  const addValueInput = (optId: string) =>
    setOptions(o => o.map(x => x.id === optId
      ? { ...x, valueInputs: [...x.valueInputs, { id: crypto.randomUUID(), text: "" }] }
      : x));

  const updateValueInput = (optId: string, viId: string, text: string) =>
    setOptions(o => o.map(x => x.id === optId
      ? { ...x, valueInputs: x.valueInputs.map(v => v.id === viId ? { ...v, text } : v) }
      : x));

  const removeValueInput = (optId: string, viId: string) =>
    setOptions(o => o.map(x => x.id === optId
      ? { ...x, valueInputs: x.valueInputs.filter(v => v.id !== viId) }
      : x));

  const updateRow = (name: string, p: Partial<VariantRow>) =>
    setVariantRows(rows => rows.map(r => r.name === name ? { ...r, ...p } : r));

  // ── Submit ─────────────────────────────────────────────────────────────────

  const isBusy = createProduct.isPending || updateProduct.isPending || createVariant.isPending || setAttrs.isPending;

  const handleSubmit = async () => {
    if (!form.name || !form.categoryId) {
      toast.error("Name and category are required"); return;
    }
    const payload = {
      ...form,
      price: parseFloat(String(form.price).replace(',', '.')) || 0,
      compareAtPrice: form.compareAtPrice ? parseFloat(String(form.compareAtPrice).replace(',', '.')) : undefined,
      imageUrl: form.imageUrl || undefined, imageKey: form.imageKey || undefined,
      description: form.description || undefined,
    };

    if (editId) {
      updateProduct.mutate({ id: editId, ...payload });
      const currentSku = allAttrs.find(a => a.key === "sku")?.value ?? "";
      if (sku.trim() !== currentSku) {
        const base = allAttrs.filter(a => a.key !== "sku");
        const newAttrs = [...base, ...(sku.trim() ? [{ key: "sku", value: sku.trim() }] : [])]
          .map((a, i) => ({ key: (a as any).key, value: (a as any).value, sortOrder: i }));
        setAttrs.mutate({ productId: editId, attrs: newAttrs });
      }
      return;
    }

    try {
      const data = await createProduct.mutateAsync(payload);
      const newId = (data as any)?.id as number;
      if (!newId) { toast.error("No product ID returned"); return; }
      utils.products.listAdmin.invalidate();

      // Build attrs
      const attrs: { key: string; value: string; sortOrder: number }[] = [];
      if (sku.trim()) attrs.push({ key: "sku", value: sku.trim(), sortOrder: attrs.length });
      options.forEach((opt, i) => {
        const optName = opt.name.trim();
        if (optName) attrs.push({ key: `variant_option_${i + 1}`, value: optName, sortOrder: attrs.length });
      });
      gallery.forEach((img, i) => attrs.push({ key: `gallery_${i + 2}`, value: img.url, sortOrder: attrs.length }));
      if (attrs.length) await setAttrs.mutateAsync({ productId: newId, attrs });

      // Create variants
      for (let i = 0; i < variantRows.length; i++) {
        const row = variantRows[i];
        if (!row.name) continue;
        await createVariant.mutateAsync({
          productId: newId, name: row.name,
          price: row.price || form.price, inventory: row.inStock ? 999 : 0,
          isActive: true, sortOrder: i,
          ...(row.image ? {
            imageBase64: row.image.base64,
            imageFilename: row.image.filename,
            imageContentType: row.image.contentType,
          } : {}),
        });
      }

      skuInit.current = false;
      setOptions([]); setVariantRows([]); setGallery([]);
      setEditId(newId);
      toast.success("Product created!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create product");
    }
  };

  const catMap = Object.fromEntries(categories.data?.map(c => [c.id, c.name]) ?? []);

  const editGallery: GalleryImg[] = editId
    ? allAttrs.filter(a => /^gallery_\d+$/.test(a.key)).sort((a, b) => a.key.localeCompare(b.key)).map(a => ({ url: a.value, key: a.key }))
    : gallery;

  // ── Products table (when form closed) ─────────────────────────────────────

  if (!showForm) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 text-sm mt-1">{products.data?.length ?? 0} products</p>
          </div>
          <Button className="bg-gray-900 hover:bg-black text-white rounded-xl" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {products.isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : products.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr className="text-left">
                    {["Product", "Category", "Price", "Inventory", "Status", ""].map(h => (
                      <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.data.map(p => (
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
                        <span className={`text-xs font-medium ${p.inventory === 0 ? "text-red-600" : p.inventory < 10 ? "text-yellow-600" : "text-green-600"}`}>{p.inventory}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.isActive ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm("Delete product?")) deleteProduct.mutate({ id: p.id }); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
              <Button className="mt-4 bg-gray-900 hover:bg-black text-white rounded-xl" onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add First Product
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { setShowForm(false); resetForm(); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Products
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{editId ? "Edit Product" : "New Product"}</h2>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Title + Slug */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <Label className="text-xs text-gray-500 mb-1.5 block">Product Title *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
              placeholder="e.g. Blue Dream CBD Flower"
              className="rounded-xl text-base font-medium mb-3"
            />
            <Label className="text-xs text-gray-500 mb-1 block">URL Slug</Label>
            <Input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="rounded-xl font-mono text-sm text-gray-500"
            />
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <Label className="text-xs text-gray-500 mb-2 block">Description</Label>
            <div className="flex items-center gap-0.5 mb-2 border border-gray-200 rounded-lg p-1 w-fit">
              {[
                { type: "bold" as const, icon: <Bold className="w-3.5 h-3.5" />, title: "Bold (**text**)" },
                { type: "italic" as const, icon: <Italic className="w-3.5 h-3.5" />, title: "Italic (_text_)" },
                { type: "bullet" as const, icon: <List className="w-3.5 h-3.5" />, title: "Bullet list" },
              ].map(({ type, icon, title }) => (
                <button key={type} type="button" onClick={() => applyFormat(type)} title={title}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                  {icon}
                </button>
              ))}
            </div>
            <textarea
              ref={descRef}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={6}
              placeholder="Describe your product..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>

          {/* Media */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <Label className="text-xs text-gray-500 mb-3 block">Media</Label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              <button type="button" onClick={() => mainImgRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative group hover:border-gray-400 transition-colors">
                {form.imageUrl ? (
                  <>
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <span className="absolute top-1 left-1 text-[9px] bg-gray-900/80 text-white px-1.5 py-0.5 rounded font-medium">Main</span>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px]">Main</span>
                  </div>
                )}
              </button>

              {editGallery.map(img => (
                <div key={img.key} className="aspect-square rounded-xl overflow-hidden border border-gray-200 relative group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeGalleryImg(img.key)}
                    className="absolute top-1 right-1 bg-gray-900/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}

              <button type="button" onClick={() => galleryRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                {uploadingGallery ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
            <input ref={mainImgRef} type="file" accept="image/*" className="hidden" onChange={handleMainImg} />
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
            {uploadingMain && <p className="text-xs text-gray-400 mt-2 animate-pulse">Uploading main image…</p>}
          </div>

          {/* Characteristics (edit mode) */}
          {editId && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Characteristics</p>
              <ProductAttributesEditor productId={editId} />
            </div>
          )}

          {/* Lab Reports (edit mode only) */}
          {editId && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <LabReportsEditor productId={editId} />
            </div>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status</p>
            <select
              value={form.isActive ? "active" : "draft"}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "active" }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 mb-3"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Featured product</span>
            </label>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className="rounded-xl pl-7" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Compare At</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input value={form.compareAtPrice} onChange={e => setForm(f => ({ ...f, compareAtPrice: e.target.value }))} placeholder="0.00" className="rounded-xl pl-7" />
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Inventory</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">SKU</Label>
                <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="PROD-001" className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Base Stock</Label>
                <Input type="number" value={form.inventory} onChange={e => setForm(f => ({ ...f, inventory: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Product Details</p>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Category *</Label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value={0}>Select category…</option>
                {categories.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Variants</p>

            {!editId ? (
              /* Create mode — Shopify-style */
              <div className="space-y-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={e => {
                      setHasVariants(e.target.checked);
                      if (e.target.checked) {
                        setOptions([newOption()]);
                      } else {
                        setOptions([]); setVariantRows([]);
                      }
                    }}
                    className="w-4 h-4 accent-gray-900 rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">This product has variants</span>
                </label>

                {hasVariants && (
                  <div className="space-y-3">
                    {/* Option list */}
                    {options.map((opt) => (
                      <div key={opt.id}>
                        {opt.collapsed ? (
                          /* ── Collapsed option ── */
                          <div
                            onClick={() => updateOpt(opt.id, { collapsed: false })}
                            className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors select-none"
                          >
                            <span className="text-gray-300 text-base leading-none shrink-0">⠿</span>
                            <span className="text-sm font-medium text-gray-700 w-20 shrink-0 truncate">{opt.name || "Option"}</span>
                            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                              {opt.valueInputs.filter(v => v.text.trim()).map(v => (
                                <span key={v.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">{v.text}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* ── Expanded option ── */
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-4 space-y-4 bg-white">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1.5 block">Option name</Label>
                                <Input
                                  value={opt.name}
                                  onChange={e => updateOpt(opt.id, { name: e.target.value })}
                                  placeholder="e.g. Size, Strain, Flavor"
                                  className="rounded-xl h-9 text-sm"
                                />
                              </div>

                              <div>
                                <Label className="text-xs text-gray-500 mb-2 block">Option values</Label>
                                <div className="space-y-2">
                                  {opt.valueInputs.map((vi, viIdx) => (
                                    <div key={vi.id} className="flex items-center gap-2">
                                      <Input
                                        value={vi.text}
                                        onChange={e => updateValueInput(opt.id, vi.id, e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (viIdx === opt.valueInputs.length - 1 && vi.text.trim()) addValueInput(opt.id);
                                          }
                                        }}
                                        placeholder={`Value ${viIdx + 1}`}
                                        className="rounded-xl h-8 text-sm flex-1"
                                      />
                                      {opt.valueInputs.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeValueInput(opt.id, vi.id)}
                                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addValueInput(opt.id)}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2.5 transition-colors font-medium"
                                >
                                  <Plus className="w-3 h-3" /> Add another value
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => removeOpt(opt.id)}
                                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Delete option
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateOpt(opt.id, { collapsed: true })}
                                  className="text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add another option (max 2) */}
                    {options.length < 2 && (
                      <button
                        type="button"
                        onClick={() => setOptions(o => [...o, newOption()])}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium py-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add another option
                      </button>
                    )}

                    {/* Generated variants table */}
                    {variantRows.length > 0 && (
                      <div className="border border-gray-100 rounded-xl overflow-hidden mt-2">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="w-9 px-3 py-2.5"></th>
                              <th className="w-9 px-2 py-2.5"></th>
                              <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Variant</th>
                              <th className="px-2 py-2.5 text-left font-semibold text-gray-500 w-28">Price</th>
                              <th className="px-2 py-2.5 text-left font-semibold text-gray-500 w-24">In Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {variantRows.map(row => (
                              <tr key={row.name} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">
                                  <input type="checkbox" className="w-3.5 h-3.5 accent-gray-900 rounded" />
                                </td>
                                <td className="px-2 py-2">
                                  <VariantImageCell
                                    image={row.image}
                                    onPick={(d) => updateRow(row.name, { image: d })}
                                    onClear={() => updateRow(row.name, { image: null })}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-800">{row.name}</span>
                                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">New</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                    <Input
                                      value={row.price}
                                      onChange={e => updateRow(row.name, { price: e.target.value })}
                                      placeholder={form.price || "0.00"}
                                      className="h-7 pl-5 text-xs rounded-lg"
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={row.inStock}
                                      onChange={e => updateRow(row.name, { inStock: e.target.checked })}
                                      className="w-3.5 h-3.5 accent-gray-900 rounded"
                                    />
                                    <span className={`text-xs font-medium ${row.inStock ? "text-green-600" : "text-gray-400"}`}>
                                      {row.inStock ? "In Stock" : "Out"}
                                    </span>
                                  </label>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Total inventory: <span className="font-semibold text-gray-700">{variantRows.filter(r => r.inStock).length} available</span>
                          </span>
                          <span className="text-xs text-gray-400">{variantRows.length} variant{variantRows.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode: full variants editor */
              <ProductVariantsEditor productId={editId} />
            )}
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-3 z-40 shadow-lg">
        <Button variant="ghost" className="rounded-xl" onClick={() => { setShowForm(false); resetForm(); }}>
          Discard
        </Button>
        <Button onClick={handleSubmit} disabled={isBusy} className="bg-gray-900 hover:bg-black text-white rounded-xl px-8 min-w-[140px]">
          {editId
            ? (updateProduct.isPending ? "Saving…" : "Save Changes")
            : (isBusy ? "Creating…" : "Create Product")}
        </Button>
      </div>
    </div>
  );
}
