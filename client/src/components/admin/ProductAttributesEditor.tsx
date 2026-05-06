import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

type AttrRow = { key: string; value: string };

// Suggested attribute keys for quick-add
const SUGGESTIONS = [
  "Active Ingredient", "Flavor", "Strain", "Weight", "THC Content",
  "CBD Content", "Terpenes", "Extraction Method", "Origin", "Format",
];

export default function ProductAttributesEditor({ productId }: { productId: number }) {
  const utils = trpc.useUtils();
  const { data: attrs = [], isLoading } = trpc.productAttributes.list.useQuery({ productId });
  const [rows, setRows] = useState<AttrRow[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRows(attrs.map((a) => ({ key: a.key, value: a.value })));
    setDirty(false);
  }, [attrs]);

  const setMut = trpc.productAttributes.set.useMutation({
    onSuccess: () => {
      utils.productAttributes.list.invalidate({ productId });
      setDirty(false);
      toast.success("Attributes saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const addRow = (key = "") => {
    setRows((r) => [...r, { key, value: "" }]);
    setDirty(true);
  };

  const updateRow = (i: number, field: "key" | "value", val: string) => {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
    setDirty(true);
  };

  const removeRow = (i: number) => {
    setRows((r) => r.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const handleSave = () => {
    const valid = rows.filter((r) => r.key.trim() && r.value.trim());
    setMut.mutate({ productId, attrs: valid.map((r, i) => ({ key: r.key.trim(), value: r.value.trim(), sortOrder: i })) });
  };

  if (isLoading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Product Characteristics
        </Label>
        {dirty && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs" onClick={handleSave} disabled={setMut.isPending}>
            <Save className="w-3.5 h-3.5 mr-1" /> Save
          </Button>
        )}
      </div>

      {/* Quick-add suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addRow(s)}
            className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
              <Input
                value={row.key}
                onChange={(e) => updateRow(i, "key", e.target.value)}
                placeholder="Attribute name"
                className="rounded-xl text-sm h-8 flex-1 min-w-0"
              />
              <span className="text-gray-400 text-sm shrink-0">:</span>
              <Input
                value={row.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                placeholder="Value"
                className="rounded-xl text-sm h-8 flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 py-2">No characteristics yet. Click a suggestion above or add manually.</p>
      )}

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => addRow()} className="rounded-xl border-gray-200 text-gray-600 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom
        </Button>
        {dirty && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs" onClick={handleSave} disabled={setMut.isPending}>
            <Save className="w-3.5 h-3.5 mr-1" /> Save Attributes
          </Button>
        )}
      </div>
    </div>
  );
}
