import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, X, Check, ImageIcon } from "lucide-react";

type CatForm = {
  name: string;
  slug: string;
  description: string;
  imageBase64: string;
  imageFilename: string;
  imageContentType: string;
  previewUrl: string;
};
const EMPTY: CatForm = {
  name: "",
  slug: "",
  description: "",
  imageBase64: "",
  imageFilename: "",
  imageContentType: "",
  previewUrl: "",
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);
  const fileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const categories = trpc.categories.list.useQuery();

  const create = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setShowForm(false); setForm(EMPTY); toast.success("Category created!"); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setShowForm(false); setEditId(null); setForm(EMPTY); toast.success("Category updated!"); },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Category deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      setForm((f) => ({
        ...f,
        imageBase64: base64,
        imageFilename: file.name,
        imageContentType: file.type,
        previewUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (c: NonNullable<typeof categories.data>[number]) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      imageBase64: "",
      imageFilename: "",
      imageContentType: "",
      previewUrl: (c as any).imageUrl ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      ...(form.imageBase64 ? {
        imageBase64: form.imageBase64,
        imageFilename: form.imageFilename,
        imageContentType: form.imageContentType || undefined,
      } : {}),
    };
    if (editId) { update.mutate({ id: editId, ...payload }); }
    else { create.mutate(payload); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.data?.length ?? 0} categories</p>
        </div>
        <Button className="bg-gray-900 hover:bg-black text-white rounded-xl" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editId ? "Edit Category" : "New Category"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="Category name" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1 block">Category Image</Label>
              {form.previewUrl && (
                <div className="w-full h-28 rounded-xl overflow-hidden bg-gray-100 mb-2">
                  <img src={form.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {form.imageFilename || (editId ? "Click to replace image" : "Click to upload image")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP (600×400px recommended)</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button className="bg-gray-900 hover:bg-black text-white rounded-xl" onClick={handleSubmit} disabled={create.isPending || update.isPending}>
              <Check className="w-4 h-4 mr-2" /> {editId ? "Save Changes" : "Create Category"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {categories.isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : categories.data && categories.data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left">
                {["Image", "Name", "Slug", "Description", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {(c as any).imageUrl ? (
                        <img src={(c as any).imageUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Tag className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-4 text-gray-500 font-mono text-xs">{c.slug}</td>
                  <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{c.description ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm("Delete this category?")) remove.mutate({ id: c.id }); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No categories yet</p>
            <Button className="mt-4 bg-gray-900 hover:bg-black text-white rounded-xl" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Category
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
