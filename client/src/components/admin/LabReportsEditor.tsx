import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Upload, X, ExternalLink, FlaskConical } from "lucide-react";

type NewReport = {
  reportName: string;
  variantId: number | undefined;
  variantName: string;
  batchNumber: string;
};

const EMPTY: NewReport = { reportName: "", variantId: undefined, variantName: "", batchNumber: "" };

export default function LabReportsEditor({ productId }: { productId: number }) {
  const utils = trpc.useUtils();
  const { data: reports = [], isLoading } = trpc.labReports.list.useQuery({ productId });
  const { data: variants = [] } = trpc.productVariants.list.useQuery({ productId });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewReport>({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMut = trpc.labReports.uploadAndCreate.useMutation({
    onSuccess: () => {
      utils.labReports.list.invalidate({ productId });
      setShowForm(false);
      setForm({ ...EMPTY });
      setUploading(false);
      toast.success("Lab report uploaded");
    },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  const deleteMut = trpc.labReports.delete.useMutation({
    onSuccess: () => {
      utils.labReports.list.invalidate({ productId });
      toast.success("Report deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.reportName) { toast.error("Please enter a report name first"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]!;
      uploadMut.mutate({
        productId,
        variantId: form.variantId,
        variantName: form.variantName || undefined,
        reportName: form.reportName,
        batchNumber: form.batchNumber || undefined,
        filename: file.name,
        contentType: file.type || "application/pdf",
        base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleVariantChange = (val: string) => {
    if (val === "") {
      setForm((f) => ({ ...f, variantId: undefined, variantName: "" }));
    } else {
      const id = parseInt(val);
      const v = variants.find((v) => v.id === id);
      setForm((f) => ({ ...f, variantId: id, variantName: v?.name ?? "" }));
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
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
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
              <FlaskConical className="w-4 h-4 text-white0 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.reportName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {r.variantName && (
                    <span className="text-xs text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full">{r.variantName}</span>
                  )}
                  {r.batchNumber && (
                    <span className="text-xs text-gray-500">Batch: {r.batchNumber}</span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <a
                href={r.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
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
        <div className="border border-gray-200 bg-gray-50/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-900">New Lab Report</p>
            <button onClick={() => { setShowForm(false); setForm({ ...EMPTY }); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Report Name *</Label>
              <Input
                value={form.reportName}
                onChange={(e) => setForm((f) => ({ ...f, reportName: e.target.value }))}
                placeholder="e.g. COA - Strawberry 3.5g"
                className="rounded-xl text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Linked Variant (optional)</Label>
              <select
                value={form.variantId ?? ""}
                onChange={(e) => handleVariantChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 h-8"
              >
                <option value="">Applies to whole product</option>
                {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Batch Number</Label>
              <Input
                value={form.batchNumber}
                onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                placeholder="BATCH-2024-001"
                className="rounded-xl text-sm h-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Upload PDF / Image *</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !form.reportName}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-400 rounded-xl text-sm text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Choose PDF or Image"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {!form.reportName && (
              <p className="text-xs text-amber-600 mt-1">Enter a report name before uploading</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
