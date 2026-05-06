import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, FlaskConical, Upload, X, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportDraft = {
  _id: string;
  reportName: string;
  file: File | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDraft(): ReportDraft {
  return { _id: Math.random().toString(36).slice(2), reportName: "", file: null };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]!);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── DraftRow ─────────────────────────────────────────────────────────────────

function DraftRow({ draft, onChange, onRemove, canRemove }: {
  draft: ReportDraft;
  onChange: (patch: Partial<ReportDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <Input
        value={draft.reportName}
        onChange={(e) => onChange({ reportName: e.target.value })}
        placeholder="Report name  (e.g. Blue Dream COA)"
        className="rounded-xl text-sm h-9 flex-1"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={`flex items-center gap-1.5 px-3 h-9 border border-dashed rounded-xl text-xs shrink-0 transition-colors whitespace-nowrap ${
          draft.file
            ? "border-green-400 bg-green-50 text-green-700"
            : "border-gray-300 text-gray-500 hover:border-gray-500 hover:bg-gray-50"
        }`}
      >
        <Upload className="w-3.5 h-3.5 shrink-0" />
        {draft.file
          ? (draft.file.name.length > 22 ? draft.file.name.slice(0, 22) + "…" : draft.file.name)
          : "Choose PDF"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange({ file: f });
          e.target.value = "";
        }}
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminLabReports() {
  const utils = trpc.useUtils();
  const { data: allReports = [], isLoading } = trpc.labReports.listAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState("");
  const [drafts, setDrafts] = useState<ReportDraft[]>([makeDraft()]);
  const [saving, setSaving] = useState(false);
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set());

  const uploadMut = trpc.labReports.uploadAndCreate.useMutation({ onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.labReports.delete.useMutation({
    onSuccess: () => { utils.labReports.listAll.invalidate(); toast.success("Report deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const existingCategories = useMemo(
    () => [...new Set(allReports.map((r) => r.category).filter(Boolean))] as string[],
    [allReports]
  );

  const groupedReports = useMemo(() => {
    const groups = new Map<string, typeof allReports>();
    allReports.forEach((r) => {
      const key = r.category ?? "Uncategorized";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [allReports]);

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

  const closeForm = () => {
    setShowForm(false);
    setDrafts([makeDraft()]);
    setFormCategory("");
  };

  const updateDraft = (id: string, patch: Partial<ReportDraft>) =>
    setDrafts((ds) => ds.map((d) => (d._id === id ? { ...d, ...patch } : d)));

  const handleSaveAll = async () => {
    if (!formCategory.trim()) { toast.error("Enter a category"); return; }
    const valid = drafts.filter((d) => d.reportName.trim());
    if (!valid.length) { toast.error("Add at least one report name"); return; }
    for (const d of valid) {
      if (!d.file) { toast.error(`"${d.reportName}": select a PDF`); return; }
    }

    setSaving(true);
    let saved = 0;
    try {
      for (const d of valid) {
        const base64 = await fileToBase64(d.file!);
        await uploadMut.mutateAsync({
          category: formCategory.trim(),
          reportName: d.reportName.trim(),
          filename: d.file!.name,
          contentType: "application/pdf",
          base64,
        });
        saved++;
      }
      await utils.labReports.listAll.invalidate();
      toast.success(`${saved} report${saved !== 1 ? "s" : ""} saved`);
      closeForm();
    } catch {
      toast.error("Some reports failed to save");
    } finally {
      setSaving(false);
    }
  };

  const readyCount = drafts.filter((d) => d.reportName.trim() && d.file).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <p className="font-semibold text-gray-900">New Lab Reports</p>
            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Category */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Category *</Label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Prerolls, THCA Flower, Gummies…"
                list="cat-suggestions"
                className="rounded-xl text-sm h-9 max-w-xs"
                autoFocus
              />
              <datalist id="cat-suggestions">
                {existingCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Draft rows */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 block">Reports *</Label>
              {drafts.map((d) => (
                <DraftRow
                  key={d._id}
                  draft={d}
                  onChange={(patch) => updateDraft(d._id, patch)}
                  onRemove={() => setDrafts((ds) => ds.filter((x) => x._id !== d._id))}
                  canRemove={drafts.length > 1}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setDrafts((ds) => [...ds, makeDraft()])}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add another report
              </button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeForm} className="rounded-xl text-sm">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm min-w-[110px]"
                >
                  {saving ? "Saving…" : `Save${readyCount > 0 ? ` ${readyCount}` : ""} Report${readyCount !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Grouped sections ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-12 bg-gray-50 border-b border-gray-100" />
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((j) => <div key={j} className="h-10 bg-gray-50 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : groupedReports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 flex flex-col items-center text-center">
          <FlaskConical className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No lab reports yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first report with the button above</p>
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
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {/* Rows */}
                {!isClosed && (
                  <div className="divide-y divide-gray-50">
                    {reports.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 group">
                        <p className="text-sm text-gray-800 flex-1 truncate">{r.reportName}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {r.fileUrl && (
                            <a
                              href={r.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-100 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> View PDF
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => { if (confirm(`Delete "${r.reportName}"?`)) deleteMut.mutate({ id: r.id }); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
