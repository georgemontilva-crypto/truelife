import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Search, FlaskConical, Upload, Link2, X } from "lucide-react";

type NewReport = {
  productId: number | "";
  variantId: number | "";
  reportName: string;
  batchNumber: string;
  testedAt: string;
  externalUrl: string;
};

const EMPTY_FORM: NewReport = {
  productId: "", variantId: "", reportName: "",
  batchNumber: "", testedAt: "", externalUrl: "",
};

export default function AdminLabReports() {
  const utils = trpc.useUtils();
  const { data: allReports = [], isLoading } = trpc.labReports.listAll.useQuery();
  const { data: allProducts = [] } = trpc.products.listAdmin.useQuery();

  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState<number | "">("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewReport>({ ...EMPTY_FORM });
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: formVariants = [] } = trpc.productVariants.list.useQuery(
    { productId: form.productId as number },
    { enabled: typeof form.productId === "number" && form.productId > 0 }
  );

  const invalidate = () => utils.labReports.listAll.invalidate();

  const uploadMut = trpc.labReports.uploadAndCreate.useMutation({
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ ...EMPTY_FORM }); setUploading(false); toast.success("Report uploaded"); },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  const urlMut = trpc.labReports.createWithUrl.useMutation({
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ ...EMPTY_FORM }); toast.success("Report saved"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.labReports.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success("Report deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.reportName || !form.productId) { toast.error("Fill in product and report name first"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]!;
      const selectedVariant = formVariants.find((v) => v.id === form.variantId);
      uploadMut.mutate({
        productId: form.productId as number,
        variantId: form.variantId || undefined,
        variantName: selectedVariant?.name,
        reportName: form.reportName,
        batchNumber: form.batchNumber || undefined,
        testedAt: form.testedAt || undefined,
        filename: file.name,
        contentType: file.type || "application/pdf",
        base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUrl = () => {
    if (!form.reportName || !form.productId) { toast.error("Product and report name are required"); return; }
    if (!form.externalUrl) { toast.error("URL is required"); return; }
    const selectedVariant = formVariants.find((v) => v.id === form.variantId);
    urlMut.mutate({
      productId: form.productId as number,
      variantId: form.variantId || undefined,
      variantName: selectedVariant?.name,
      reportName: form.reportName,
      externalUrl: form.externalUrl,
      batchNumber: form.batchNumber || undefined,
      testedAt: form.testedAt || undefined,
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allReports.filter((r) => {
      if (filterProduct !== "" && r.productId !== filterProduct) return false;
      if (q && !r.reportName.toLowerCase().includes(q) && !(r.productName ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allReports, search, filterProduct]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage COAs and test certificates across all products</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setMode("upload"); }}
          className="bg-gray-900 hover:bg-black text-white rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Add Report
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900">New Lab Report</p>
            <button type="button" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }} className="text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Product + Variant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Product *</Label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value === "" ? "" : Number(e.target.value), variantId: "" }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white h-9"
                >
                  <option value="">Select product…</option>
                  {allProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Variant (optional)</Label>
                <select
                  value={form.variantId}
                  onChange={(e) => setForm((f) => ({ ...f, variantId: e.target.value === "" ? "" : Number(e.target.value) }))}
                  disabled={!form.productId}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white h-9 disabled:opacity-50"
                >
                  <option value="">Whole product</option>
                  {formVariants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {/* Name + Batch + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <Label className="text-xs text-gray-500 mb-1.5 block">Report Name *</Label>
                <Input value={form.reportName} onChange={(e) => setForm((f) => ({ ...f, reportName: e.target.value }))} placeholder="COA - Batch 001" className="rounded-xl text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Batch Number</Label>
                <Input value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} placeholder="BATCH-2024-001" className="rounded-xl text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Test Date</Label>
                <Input type="date" value={form.testedAt} onChange={(e) => setForm((f) => ({ ...f, testedAt: e.target.value }))} className="rounded-xl text-sm h-9" />
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("upload")} className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl border transition-colors ${mode === "upload" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
              <button type="button" onClick={() => setMode("url")} className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl border transition-colors ${mode === "url" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Link2 className="w-3.5 h-3.5" /> External URL
              </button>
            </div>

            {mode === "upload" ? (
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || !form.reportName || !form.productId}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Choose PDF or Image"}
                </button>
                {(!form.reportName || !form.productId) && <p className="text-xs text-amber-600 mt-1">Select a product and enter a report name first</p>}
                <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="flex gap-3">
                <Input
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  placeholder="https://lab-results.example.com/..."
                  className="rounded-xl text-sm h-9 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSaveUrl}
                  disabled={urlMut.isPending || !form.reportName || !form.productId || !form.externalUrl}
                  className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm shrink-0"
                >
                  {urlMut.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="pl-9 rounded-xl bg-white border-gray-200 h-9" />
        </div>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value === "" ? "" : Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 h-9 min-w-[180px]"
        >
          <option value="">All Products</option>
          {allProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 flex flex-col items-center text-center">
          <FlaskConical className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No lab reports found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first report with the button above</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product", "Report", "Variant", "Batch", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const viewUrl = r.fileUrl ?? r.externalUrl ?? null;
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0 flex items-center justify-center">
                          {r.productImageUrl
                            ? <img src={r.productImageUrl} alt="" className="w-full h-full object-cover" />
                            : <FlaskConical className="w-3.5 h-3.5 text-gray-300" />
                          }
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[140px]">{r.productName ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{r.reportName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.variantName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{r.batchNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {r.testedAt ? new Date(r.testedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {viewUrl && (
                          <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => { if (confirm(`Delete "${r.reportName}"?`)) deleteMut.mutate({ id: r.id }); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} {filtered.length === 1 ? "report" : "reports"}
          </div>
        </div>
      )}
    </div>
  );
}
