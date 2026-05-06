import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Banner = {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  imageKey: string | null;
  linkUrl: string | null;
  linkText: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BannerForm = {
  title: string;
  subtitle: string;
  linkUrl: string;
  linkText: string;
  sortOrder: number;
  isActive: boolean;
  imageBase64: string;
  imageFilename: string;
  imageContentType: string;
  previewUrl: string;
};

const emptyForm = (): BannerForm => ({
  title: "",
  subtitle: "",
  linkUrl: "",
  linkText: "",
  sortOrder: 0,
  isActive: true,
  imageBase64: "",
  imageFilename: "",
  imageContentType: "",
  previewUrl: "",
});

export default function AdminBanners() {
  const utils = trpc.useUtils();
  const { data: banners = [], isLoading } = trpc.banners.adminList.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.banners.create.useMutation({
    onSuccess: () => {
      utils.banners.adminList.invalidate();
      utils.banners.list.invalidate();
      toast.success("Banner created successfully");
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.banners.update.useMutation({
    onSuccess: () => {
      utils.banners.adminList.invalidate();
      utils.banners.list.invalidate();
      toast.success("Banner updated successfully");
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.banners.delete.useMutation({
    onSuccess: () => {
      utils.banners.adminList.invalidate();
      utils.banners.list.invalidate();
      toast.success("Banner deleted");
      setDeleteId(null);
    },
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      linkUrl: banner.linkUrl ?? "",
      linkText: banner.linkText ?? "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      imageBase64: "",
      imageFilename: "",
      imageContentType: "",
      previewUrl: banner.imageUrl,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!editingId && !form.imageBase64) {
      toast.error("Please select an image");
      return;
    }
    if (editingId) {
      const payload: Parameters<typeof updateMutation.mutate>[0] = {
        id: editingId,
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        linkUrl: form.linkUrl || undefined,
        linkText: form.linkText || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (form.imageBase64) {
        payload.imageBase64 = form.imageBase64;
        payload.imageFilename = form.imageFilename;
        payload.imageContentType = form.imageContentType;
      }
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate({
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        linkUrl: form.linkUrl || undefined,
        linkText: form.linkText || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        imageBase64: form.imageBase64,
        imageFilename: form.imageFilename,
        imageContentType: form.imageContentType || undefined,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hero Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the hero slider images shown on the homepage.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No banners yet. Add one to get started.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Add First Banner
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Preview</TableHead>
                <TableHead>Title / Subtitle</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="w-20 text-center">Order</TableHead>
                <TableHead className="w-20 text-center">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(banners as Banner[]).map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="w-20 h-12 rounded overflow-hidden bg-muted">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title ?? "Banner"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{banner.title || <span className="text-muted-foreground italic">No title</span>}</p>
                    {banner.subtitle && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{banner.subtitle}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {banner.linkUrl ? (
                      <a
                        href={banner.linkUrl}
                        className="text-xs text-blue-600 underline truncate block max-w-xs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {banner.linkText || banner.linkUrl}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm">{banner.sortOrder}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(banner)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(banner.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Image upload */}
            <div className="space-y-2">
              <Label>Banner Image {!editingId && <span className="text-destructive">*</span>}</Label>
              {form.previewUrl && (
                <div className="w-full h-36 rounded-lg overflow-hidden bg-muted mb-2">
                  <img
                    src={form.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-foreground/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {form.imageFilename || (editingId ? "Click to replace image" : "Click to upload image")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP recommended (1920×600px)</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Premium Hemp Products"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  placeholder="e.g. Lab-tested, federally compliant"
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  placeholder="/catalog"
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="linkText">Link Text</Label>
                <Input
                  id="linkText"
                  placeholder="Shop Now"
                  value={form.linkText}
                  onChange={(e) => setForm((f) => ({ ...f, linkText: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Banner" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Banner?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The banner will be removed from the homepage slider.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
