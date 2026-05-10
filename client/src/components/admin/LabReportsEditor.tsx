import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Upload, X, ExternalLink, FlaskConical, Link2 } from "lucide-react";

type NewReport = {
  name: string;
  variantId: number | undefined;
  batchNumber: string;
  testedAt: string;
  externalUrl: string;
};

const EMPTY: NewReport = {
  name: "", variantId: undefined,
  batchNumber: "", testedAt: "", externalUrl: "",
};

export default function LabReportsEditor({ productId }: { productId: number }) {
  const utils = trpc.useUtils();
  const { data: reports = [], isLoading } = trpc.labReports.list.useQuery({ productId });
  const { data: variants = [] } = trpc.productVariants.list.useQuery({ productId });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewReport>({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => utils.labReports.list.invalidate({ productId });

  const uploadMut = trpc.labReports.uploadAndCreate.useMutation({
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ ...EMPTY }); setUploading(false); toast.success("Lab report uploaded"); },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  const urlMut = trpc.labReports.createWithUrl.useMutation({
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ ...EMPTY }); toast.success("Lab report saved"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.labReports.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success("Report deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.name) { toast.error("Enter a report name first"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]!;
      uploadMut.mutate({
        productId,
        variantId: form.variantId,
        name: form.name,
        category: "general",
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
    if (!form.name) { toast.error("Report name is required"); return; }
    if (!form.externalUrl) { toast.error("URL is required"); return; }
    urlMut.mutate({
      productId,
      variantId: form.variantId,
      name: form.name,
      externalUrl: form.externalUrl,
      batchNumber: form.batchNumber || undefined,
      testedAt: form.testedAt || undefined,
    });
  };

  const handleVariantChange = (val: string) => {
    if (val === "") {
      setForm((f) => ({ ...f, variantId: undefined }));
    } else {
      setForm((f) => ({ ...f, variantId: parseInt(val) }));
    }
  };

  if (isLoading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Lab Reports / COA
        </Label>
        <Button
          type="button" size="sm" variant="outline"
          onClick={() => { setShowForm(true); setMode("upload"); }}
          className="rounded-xl border-gray-200 text-gray-900 hover:bg-gray-50 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Report
        </Button>
      </div>

      {/* Existing reports */}
      {reports.length > 0 ? (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <FlaskConical className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {r.batchNumber && <span className="text-xs text-gray-500">Batch: {r.batchNumber}</span>}
                  {r.testedAt && <span className="text-xs text-gray-400">{new Date(r.testedAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <a
                href={(r as any).fileUrl ?? (r as any).externalUrl ?? "#"}
                target="_blank" rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => { if (confirm("Delete this report?")) deleteMut.mutate({ id: r.id }); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-4 px-3 bg-gray-50 rounded-xl text-gray-400 text-xs">
          <FileText className="w-4 h-4" />
          No lab reports yet. Upload COA (Certificate of Analysis) PDFs per variant or product.
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">New Lab Report</p>
            <button type="button" onClick={() => { setShowForm(false); setForm({ ...EMPTY }); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-4 space-y-3 bg-gray-50/30">
            {/* Name + Variant */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Report Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. COA Strawberry 3.5g"
                  className="rounded-xl text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Linked Variant</Label>
                <select
                  value={form.variantId ?? ""}
                  onChange={(e) => handleVariantChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 h-8 bg-white"
                >
                  <option value="">Whole product</option>
                  {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {/* Batch + Test Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Batch Number</Label>
                <Input
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="BATCH-2024-001"
                  className="rounded-xl text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Test Date</Label>
                <Input
                  type="date"
                  value={form.testedAt}
                  onChange={(e) => setForm((f) => ({ ...f, testedAt: e.target.value }))}
                  className="rounded-xl text-sm h-8"
                />
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors ${mode === "upload" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <Upload className="w-3 h-3" /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors ${mode === "url" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <Link2 className="w-3 h-3" /> External URL
              </button>
            </div>

            {mode === "upload" ? (
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || !form.name}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Choose PDF or Image"}
                </button>
                {!form.name && <p className="text-xs text-amber-600 mt-1">Enter a report name before uploading</p>}
                <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">External URL *</Label>
                  <Input
                    value={form.externalUrl}
                    onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                    placeholder="https://..."
                    className="rounded-xl text-sm h-8"
                  />
                </div>
                <Button
                  type="button" size="sm"
                  onClick={handleSaveUrl}
                  disabled={urlMut.isPending || !form.name || !form.externalUrl}
                  className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm w-full"
                >
                  {urlMut.isPending ? "Saving…" : "Save Report"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
