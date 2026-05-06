import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus, Trash2, ExternalLink, Search, FlaskConical,
  Upload, Link2, X, ChevronDown, ChevronUp, Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportDraft = {
  _id: string;
  title: string;
  productId: number | "";
  variantId: number | "";
  batchNumber: string;
  testedAt: string;
  mode: "upload" | "url";
  externalUrl: string;
  file: File | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDraft(): ReportDraft {
  return {
    _id: Math.random().toString(36).slice(2),
    title: "", productId: "", variantId: "",
    batchNumber: "", testedAt: "", mode: "upload", externalUrl: "", file: null,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]!);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── VariantSelect ─────────────────────────────────────────────────────────────

function VariantSelect({ productId, value, onChange }: {
  productId: number | "";
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  const { data: variants = [] } = trpc.productVariants.list.useQuery(
    { productId: productId as number },
    { enabled: typeof productId === "number" && productId > 0 }
  );
  if (!productId) return (
    <select disabled className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-400 bg-gray-50 h-8 cursor-not-allowed">
      <option>Select product first</option>
    </select>
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
      className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 h-8"
    >
      <option value="">No variant</option>
      {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
    </select>
  );
}

// ─── DraftRow ─────────────────────────────────────────────────────────────────

function DraftRow({ draft, products, onChange, onRemove, canRemove }: {
  draft: ReportDraft;
  products: Array<{ id: number; name: string }>;
  onChange: (patch: Partial<ReportDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {/* Title row */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <Input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Report title *  (e.g. Blue Dream COA)"
            className="rounded-xl text-sm h-8"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product + Variant */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Product</Label>
          <select
            value={draft.productId}
            onChange={(e) => onChange({ productId: e.target.value ? Number(e.target.value) : "", variantId: "" })}
            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 h-8"
          >
            <option value="">No product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Variant</Label>
          <VariantSelect
            productId={draft.productId}
            value={draft.variantId}
            onChange={(v) => onChange({ variantId: v })}
          />
        </div>
      </div>

      {/* Batch + Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Batch #</Label>
          <Input
            value={draft.batchNumber}
            onChange={(e) => onChange({ batchNumber: e.target.value })}
            placeholder="BATCH-001"
            className="rounded-xl text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Test Date</Label>
          <Input
            type="date"
            value={draft.testedAt}
            onChange={(e) => onChange({ testedAt: e.target.value })}
            className="rounded-xl text-xs h-8"
          />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ mode: "upload", externalUrl: "" })}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors ${draft.mode === "upload" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <Upload className="w-3 h-3" /> Upload File
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: "url", file: null })}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors ${draft.mode === "url" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <Link2 className="w-3 h-3" /> External URL
        </button>
      </div>

      {draft.mode === "upload" ? (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 py-2 border border-dashed rounded-xl text-xs transition-colors ${draft.file ? "border-green-400 bg-green-50 text-green-700" : "border-gray-300 text-gray-500 hover:border-gray-500 hover:bg-gray-50"}`}
          >
            <Upload className="w-3.5 h-3.5" />
            {draft.file ? draft.file.name : "Choose PDF or Image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ file: f }); e.target.value = ""; }}
          />
        </div>
      ) : (
        <Input
          value={draft.externalUrl}
          onChange={(e) => onChange({ externalUrl: e.target.value })}
          placeholder="https://lab-results.example.com/..."
          className="rounded-xl text-xs h-8"
        />
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminLabReports() {
  const utils = trpc.useUtils();
  const { data: allReports = [], isLoading } = trpc.labReports.listAll.useQuery();
  const { data: allProducts = [] } = trpc.products.listAdmin.useQuery();
  const { data: productCategories = [] } = trpc.categories.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState("");
  const [drafts, setDrafts] = useState<ReportDraft[]>([makeDraft()]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set());

  const uploadMut = trpc.labReports.uploadAndCreate.useMutation({ onError: (e) => toast.error(e.message) });
  const urlMut = trpc.labReports.createWithUrl.useMutation({ onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.labReports.delete.useMutation({
    onSuccess: () => { utils.labReports.listAll.invalidate(); toast.success("Report deleted"); },
    onError: (e) => toast.error(e.message),
  });

  // Category suggestions from existing lab report categories
  const existingCategories = useMemo(() => (
    [...new Set(allReports.map((r) => r.category).filter(Boolean))] as string[]
  ), [allReports]);

  // Products filtered by selected category name
  const filteredProducts = useMemo(() => {
    if (!formCategory.trim()) return allProducts;
    const match = productCategories.find(
      (c) => c.name.toLowerCase() === formCategory.trim().toLowerCase()
    );
    if (!match) return allProducts;
    return allProducts.filter((p) => p.categoryId === match.id);
  }, [allProducts, productCategories, formCategory]);

  // Filtered and grouped reports
  const groupedReports = useMemo(() => {
    const q = search.toLowerCase();
    const visible = allReports.filter((r) => {
      if (!q) return true;
      return r.reportName.toLowerCase().includes(q)
        || (r.productName ?? "").toLowerCase().includes(q)
        || (r.category ?? "").toLowerCase().includes(q);
    });
    const groups = new Map<string, typeof visible>();
    visible.forEach((r) => {
      const key = r.category ?? "Uncategorized";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [allReports, search]);

  const toggleSection = (cat: string) =>
    setClosedSections((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const openAddForm = (cat = "") => {
    setFormCategory(cat);
    setDrafts([makeDraft()]);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const updateDraft = (id: string, patch: Partial<ReportDraft>) =>
    setDrafts((ds) => ds.map((d) => (d._id === id ? { ...d, ...patch } : d)));

  const handleSaveAll = async () => {
    const valid = drafts.filter((d) => d.title.trim());
    if (!valid.length) { toast.error("Add at least one report title"); return; }
    for (const d of valid) {
      if (d.mode === "upload" && !d.file) { toast.error(`"${d.title}": select a file to upload`); return; }
      if (d.mode === "url" && !d.externalUrl.trim()) { toast.error(`"${d.title}": enter a URL`); return; }
    }

    setSaving(true);
    let saved = 0;
    try {
      for (const d of valid) {
        const base = {
          productId: d.productId || undefined,
          category: formCategory.trim() || undefined,
          variantId: d.variantId || undefined,
          reportName: d.title.trim(),
          batchNumber: d.batchNumber || undefined,
          testedAt: d.testedAt || undefined,
        };
        if (d.mode === "url") {
          await urlMut.mutateAsync({ ...base, externalUrl: d.externalUrl });
        } else if (d.file) {
          const base64 = await fileToBase64(d.file);
          await uploadMut.mutateAsync({
            ...base,
            filename: d.file.name,
            contentType: d.file.type || "application/pdf",
            base64,
          });
        }
        saved++;
      }
      await utils.labReports.listAll.invalidate();
      toast.success(`${saved} report${saved !== 1 ? "s" : ""} saved`);
      setShowForm(false);
      setDrafts([makeDraft()]);
      setFormCategory("");
    } catch {
      toast.error("Some reports failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Certificates of Analysis grouped by category</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => openAddForm()}
            className="bg-gray-900 hover:bg-black text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Add Reports
          </Button>
        )}
      </div>

      {/* ── Add form ─────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Form header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <p className="font-semibold text-gray-900">New Lab Reports</p>
            <button
              type="button"
              onClick={() => { setShowForm(false); setDrafts([makeDraft()]); setFormCategory(""); }}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Category field */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Category — reports will be grouped under this name
              </Label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Delta 8, CBD Flower, Terpenes…"
                list="cat-suggestions"
                className="rounded-xl text-sm h-9 max-w-xs"
              />
              <datalist id="cat-suggestions">
                {existingCategories.map((c) => <option key={c} value={c} />)}
                {productCategories.map((c) => <option key={`pc-${c.id}`} value={c.name} />)}
              </datalist>
              {formCategory && (
                <p className="text-xs text-gray-400 mt-1">
                  Showing{" "}
                  {filteredProducts.length < allProducts.length
                    ? `${filteredProducts.length} products in "${formCategory}"`
                    : "all products"}
                </p>
              )}
            </div>

            {/* Draft rows */}
            <div className="space-y-3">
              {drafts.map((d) => (
                <DraftRow
                  key={d._id}
                  draft={d}
                  products={filteredProducts.map((p) => ({ id: p.id, name: p.name }))}
                  onChange={(patch) => updateDraft(d._id, patch)}
                  onRemove={() => setDrafts((ds) => ds.filter((x) => x._id !== d._id))}
                  canRemove={drafts.length > 1}
                />
              ))}
            </div>

            {/* Add row + Save */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setDrafts((ds) => [...ds, makeDraft()])}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another report
              </button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowForm(false); setDrafts([makeDraft()]); setFormCategory(""); }}
                  className="rounded-xl text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm min-w-[120px]"
                >
                  {saving ? "Saving…" : `Save ${drafts.filter((d) => d.title.trim()).length || ""} Report${drafts.filter((d) => d.title.trim()).length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports, products, categories…"
          className="pl-9 rounded-xl bg-white border-gray-200 h-9"
        />
      </div>

      {/* ── Grouped sections ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-12 bg-gray-50 border-b border-gray-100" />
              <div className="p-4 space-y-2">
                {[1, 2].map((j) => <div key={j} className="h-12 bg-gray-50 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : groupedReports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 flex flex-col items-center text-center">
          <FlaskConical className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No lab reports found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? "Try adjusting your search" : "Add your first report with the button above"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedReports.map(([catName, reports]) => {
            const isClosed = closedSections.has(catName);
            return (
              <div key={catName} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => toggleSection(catName)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    <FlaskConical className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="font-semibold text-gray-800 text-sm truncate">{catName}</span>
                    <span className="text-xs text-gray-400 font-normal shrink-0">({reports.length})</span>
                    {isClosed
                      ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                      : <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddForm(catName === "Uncategorized" ? "" : catName)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-white transition-colors ml-3 shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    Add to {catName === "Uncategorized" ? "this section" : catName}
                  </button>
                </div>

                {/* Rows */}
                {!isClosed && (
                  <div className="divide-y divide-gray-50">
                    {reports.map((r) => {
                      const viewUrl = r.fileUrl ?? r.externalUrl ?? null;
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 group">
                          {/* Product thumbnail */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0 flex items-center justify-center">
                            {r.productImageUrl
                              ? <img src={r.productImageUrl} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-3.5 h-3.5 text-gray-300" />
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.reportName}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {r.productName && (
                                <span className="text-xs text-gray-500 truncate max-w-[140px]">{r.productName}</span>
                              )}
                              {r.variantName && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{r.variantName}</span>
                              )}
                              {r.batchNumber && (
                                <span className="text-xs text-gray-400 font-mono">{r.batchNumber}</span>
                              )}
                              {r.testedAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(r.testedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {viewUrl && (
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View report"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => { if (confirm(`Delete "${r.reportName}"?`)) deleteMut.mutate({ id: r.id }); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
