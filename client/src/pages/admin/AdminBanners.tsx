import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Pencil, Trash2, Plus, ImageIcon, Upload, X, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Site image slot definitions ─────────────────────────────────────────────

type SlotDef = { slot: string; label: string; desc: string; category: string };

const SITE_IMAGE_SLOTS: SlotDef[] = [
  { slot: "about_us",             label: "About Us (Home)",    desc: "About Us section image on homepage (4:3)", category: "Sections" },
  { slot: "service_1_icon",       label: "Service 1 Icon",     desc: "Icon for first service card (square)",  category: "Services" },
  { slot: "service_2_icon",       label: "Service 2 Icon",     desc: "Icon for second service card (square)", category: "Services" },
  { slot: "service_3_icon",       label: "Service 3 Icon",     desc: "Icon for third service card (square)",  category: "Services" },
  { slot: "service_4_icon",       label: "Service 4 Icon",     desc: "Icon for fourth service card (square)", category: "Services" },
  { slot: "service_5_icon",       label: "Service 5 Icon",     desc: "Icon for fifth service card (square)",  category: "Services" },
  { slot: "service_6_icon",       label: "Service 6 Icon",     desc: "Icon for sixth service card (square)",  category: "Services" },
  { slot: "trust_shipping",       label: "Free Shipping Icon", desc: "Trust badge icon (square)",            category: "Trust Badges" },
  { slot: "trust_returns",        label: "Easy Returns Icon",  desc: "Trust badge icon (square)",            category: "Trust Badges" },
  { slot: "trust_natural",        label: "100% Natural Icon",  desc: "Trust badge icon (square)",            category: "Trust Badges" },
  { slot: "trust_lab",            label: "Lab Tested Icon",    desc: "Trust badge icon (square)",            category: "Trust Badges" },
  { slot: "logo_main",            label: "Main Logo",          desc: "Logo shown in the navbar",             category: "Logos" },
  { slot: "logo_footer",          label: "Footer Logo",        desc: "Logo shown in the footer",             category: "Logos" },
  { slot: "press_leafly",         label: "Leafly",             desc: "Press logo — As Seen In",              category: "Press Logos" },
  { slot: "press_forbes",         label: "Forbes",             desc: "Press logo — As Seen In",              category: "Press Logos" },
  { slot: "press_herb",           label: "Herb",               desc: "Press logo — As Seen In",              category: "Press Logos" },
  { slot: "press_oc_weekly",      label: "OC Weekly",          desc: "Press logo — As Seen In",              category: "Press Logos" },
  { slot: "press_marijuana_daily",label: "Marijuana Daily",    desc: "Press logo — As Seen In",              category: "Press Logos" },
];

const ABOUT_IMAGE_SLOTS: SlotDef[] = [
  { slot: "about_hero_bg",     label: "Hero Background",  desc: "Full-width hero background image (16:9 or wider)", category: "About Page" },
  { slot: "about_story_image", label: "Our Story Image",  desc: "Left column image in the Our Story section (4:3)", category: "About Page" },
];

const CATEGORIES = ["Sections", "Services", "Trust Badges", "Logos", "Press Logos"];

// ─── Hero Banners tab ─────────────────────────────────────────────────────────

function HeroBannersTab() {
  const utils = trpc.useUtils();
  const { data: banners = [], isLoading } = trpc.banners.adminList.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    utils.banners.adminList.invalidate();
    utils.banners.list.invalidate();
  };

  const createMutation = trpc.banners.create.useMutation({
    onSuccess: () => { invalidate(); toast.success("Banner created"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.banners.update.useMutation({
    onSuccess: () => { invalidate(); toast.success("Banner updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.banners.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success("Banner deleted"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm((f) => ({
        ...f,
        imageBase64: result.split(",")[1],
        imageFilename: file.name,
        imageContentType: file.type,
        previewUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      linkUrl: banner.linkUrl ?? "",
      linkText: banner.linkText ?? "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      imageBase64: "", imageFilename: "", imageContentType: "",
      previewUrl: banner.imageUrl,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!editingId && !form.imageBase64) { toast.error("Please select an image"); return; }
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
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No banners yet.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>Add First Banner</Button>
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
                      <img src={banner.imageUrl} alt={banner.title ?? "Banner"} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{banner.title || <span className="text-muted-foreground italic">No title</span>}</p>
                    {banner.subtitle && <p className="text-xs text-muted-foreground truncate max-w-xs">{banner.subtitle}</p>}
                  </TableCell>
                  <TableCell>
                    {banner.linkUrl ? (
                      <a href={banner.linkUrl} className="text-xs text-blue-600 underline truncate block max-w-xs" target="_blank" rel="noopener noreferrer">
                        {banner.linkText || banner.linkUrl}
                      </a>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center text-sm">{banner.sortOrder}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(banner)} className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(banner.id)} className="h-8 w-8 text-destructive hover:text-destructive">
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
          <DialogHeader><DialogTitle>{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Banner Image {!editingId && <span className="text-destructive">*</span>}</Label>
              {form.previewUrl && (
                <div className="w-full h-36 rounded-lg overflow-hidden bg-muted mb-2">
                  <img src={form.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-foreground/40 transition-colors" onClick={() => fileRef.current?.click()}>
                <ImageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{form.imageFilename || (editingId ? "Click to replace image" : "Click to upload image")}</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP recommended (1920×600px)</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Title</Label>
                <Input placeholder="e.g. Premium Hemp Products" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Subtitle</Label>
                <Input placeholder="e.g. Lab-tested, federally compliant" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Link URL</Label>
                <Input placeholder="/catalog" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Link Text</Label>
                <Input placeholder="Shop Now" value={form.linkText} onChange={(e) => setForm((f) => ({ ...f, linkText: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Saving..." : editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Banner?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the banner from the homepage slider.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Site Images tab ──────────────────────────────────────────────────────────

function SiteImagesTab() {
  const utils = trpc.useUtils();
  const { data: siteImages = {}, isLoading } = trpc.banners.siteImages.useQuery();

  const upsertMutation = trpc.banners.upsertSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Image updated"); },
    onError: (e) => toast.error(e.message),
  });
  const clearMutation = trpc.banners.clearSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Image cleared"); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = (slotDef: SlotDef, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      upsertMutation.mutate({
        slot: slotDef.slot,
        imageBase64: result.split(",")[1],
        imageFilename: file.name,
        imageContentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      {CATEGORIES.map((category) => {
        const slots = SITE_IMAGE_SLOTS.filter((s) => s.category === category);
        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slotDef) => {
                const currentUrl = (siteImages as Record<string, string>)[slotDef.slot];
                const isPending = upsertMutation.isPending || clearMutation.isPending;
                return (
                  <SlotCard
                    key={slotDef.slot}
                    slotDef={slotDef}
                    currentUrl={currentUrl}
                    isPending={isPending}
                    onUpload={(file) => handleUpload(slotDef, file)}
                    onClear={() => clearMutation.mutate({ slot: slotDef.slot })}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SlotCard({
  slotDef,
  currentUrl,
  isPending,
  onUpload,
  onClear,
}: {
  slotDef: SlotDef;
  currentUrl?: string;
  isPending: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border rounded-xl p-4 bg-white space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{slotDef.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{slotDef.desc}</p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{slotDef.slot}</p>
      </div>

      {currentUrl ? (
        <div className="relative group rounded-lg overflow-hidden bg-gray-100 h-28">
          <img src={currentUrl} alt={slotDef.label} className="w-full h-full object-contain p-2" />
          <button
            onClick={onClear}
            disabled={isPending}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed bg-gray-50 h-28 flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-6 h-6 mb-1" />
          <p className="text-xs">No image uploaded</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs"
          disabled={isPending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5" />
          {currentUrl ? "Replace" : "Upload"}
        </Button>
        {currentUrl && (
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive text-xs" disabled={isPending} onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── Services Tab ─────────────────────────────────────────────────────────────

const SERVICE_KEYS = ["service_1", "service_2", "service_3", "service_4", "service_5", "service_6"] as const;
type ServiceKey = (typeof SERVICE_KEYS)[number];

const SERVICE_DEFAULTS: Record<ServiceKey, { title: string; desc: string; link: string }> = {
  service_1: { title: "Elevated Therapeutics", desc: "Explore our premium cannabis-based medical solutions, designed for optimal effectiveness and well-being, backed by rigorous lab testing.", link: "/catalog" },
  service_2: { title: "Essence of the Leaf", desc: "Experience the purity of our handpicked cannabis leaves, preserving natural properties for a safe and enriching experience.", link: "/catalog" },
  service_3: { title: "Pure & Natural Edibles", desc: "Our edibles, made with 100% natural ingredients, offer a pure and enjoyable experience, from chocolates to infusions.", link: "/catalog" },
  service_4: { title: "Premium Buds", desc: "Our sustainably grown, pesticide-free cannabis flowers deliver rich aromas, unique flavors, and consistent potency.", link: "/catalog" },
  service_5: { title: "Nature's Apothecary", desc: "Discover our extracts and apothecary formulas, crafted to enhance cannabis compounds for relaxation, pain relief, and well-being.", link: "/catalog" },
  service_6: { title: "Your Safety, Our Priority", desc: "We ensure legal compliance and product safety through rigorous quality control at every stage, providing you with a trusted experience.", link: "/catalog" },
};

const ALL_SERVICE_TEXT_KEYS = [
  "services_section_title",
  "services_section_subtitle",
  ...SERVICE_KEYS.flatMap((k) => [`${k}_title`, `${k}_desc`, `${k}_link`]),
] as const;

type ServiceTextField = (typeof ALL_SERVICE_TEXT_KEYS)[number];

function ServicesTab() {
  const utils = trpc.useUtils();
  const { data: siteImages = {}, isLoading: imagesLoading } = trpc.banners.siteImages.useQuery();
  const { data: textSettings, isLoading: textLoading } = trpc.settings.getMany.useQuery(
    { keys: [...ALL_SERVICE_TEXT_KEYS] },
    { retry: false }
  );

  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (textSettings) {
      const init: Record<string, string> = {
        services_section_title: textSettings.services_section_title ?? "",
        services_section_subtitle: textSettings.services_section_subtitle ?? "",
      };
      SERVICE_KEYS.forEach((k) => {
        init[`${k}_title`] = (textSettings as Record<string, string | null>)[`${k}_title`] ?? "";
        init[`${k}_desc`] = (textSettings as Record<string, string | null>)[`${k}_desc`] ?? "";
        init[`${k}_link`] = (textSettings as Record<string, string | null>)[`${k}_link`] ?? "";
      });
      setForm(init);
    }
  }, [textSettings]);

  const setMutation = trpc.settings.set.useMutation();
  const upsertMutation = trpc.banners.upsertSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Icon updated"); },
    onError: (e) => toast.error(e.message),
  });
  const clearMutation = trpc.banners.clearSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Icon cleared"); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = (slot: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      upsertMutation.mutate({ slot, imageBase64: result.split(",")[1], imageFilename: file.name, imageContentType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(form)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => setMutation.mutateAsync({ key: k, value: v }))
      );
      utils.settings.getMany.invalidate();
      toast.success("Services section saved");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    }
  };

  const isPending = upsertMutation.isPending || clearMutation.isPending;

  if (imagesLoading || textLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Section header texts */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Section Header</h3>
        <div className="space-y-1.5">
          <Label>Section Title</Label>
          <Input
            placeholder="Our Best Services"
            value={form.services_section_title ?? ""}
            onChange={(e) => { setForm((f) => ({ ...f, services_section_title: e.target.value })); setDirty(true); }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Section Subtitle</Label>
          <Textarea
            placeholder="TruLife provides expert support..."
            rows={2}
            className="resize-none"
            value={form.services_section_subtitle ?? ""}
            onChange={(e) => { setForm((f) => ({ ...f, services_section_subtitle: e.target.value })); setDirty(true); }}
          />
        </div>
      </div>

      {/* Individual service cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Service Cards</h3>
        {SERVICE_KEYS.map((key, index) => {
          const defaults = SERVICE_DEFAULTS[key];
          const iconSlot = `${key}_icon`;
          const currentIcon = (siteImages as Record<string, string>)[iconSlot];
          return (
            <div key={key} className="bg-white border rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                {/* Icon slot */}
                <div className="shrink-0">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Icon</p>
                  <SlotCard
                    slotDef={{ slot: iconSlot, label: `Service ${index + 1} Icon`, desc: "Square icon image", category: "Services" }}
                    currentUrl={currentIcon}
                    isPending={isPending}
                    onUpload={(file) => handleUpload(iconSlot, file)}
                    onClear={() => clearMutation.mutate({ slot: iconSlot })}
                  />
                </div>
                {/* Text fields */}
                <div className="flex-1 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Service {index + 1}</p>
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      placeholder={defaults.title}
                      value={form[`${key}_title`] ?? ""}
                      onChange={(e) => { setForm((f) => ({ ...f, [`${key}_title`]: e.target.value })); setDirty(true); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      placeholder={defaults.desc}
                      rows={2}
                      className="resize-none"
                      value={form[`${key}_desc`] ?? ""}
                      onChange={(e) => { setForm((f) => ({ ...f, [`${key}_desc`]: e.target.value })); setDirty(true); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Link URL</Label>
                    <Input
                      placeholder={defaults.link}
                      value={form[`${key}_link`] ?? ""}
                      onChange={(e) => { setForm((f) => ({ ...f, [`${key}_link`]: e.target.value })); setDirty(true); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={setMutation.isPending || !dirty} className="gap-2">
          <Save className="w-4 h-4" />
          {setMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ─── About Page Tab ───────────────────────────────────────────────────────────

const ABOUT_TEXT_KEYS = ["about_hero_title", "about_hero_subtitle", "about_story_text"] as const;
type AboutKey = (typeof ABOUT_TEXT_KEYS)[number];

function AboutPageTab() {
  const utils = trpc.useUtils();
  const { data: siteImages = {}, isLoading: imagesLoading } = trpc.banners.siteImages.useQuery();
  const { data: textSettings, isLoading: textLoading, isError: textError } = trpc.settings.getMany.useQuery(
    { keys: [...ABOUT_TEXT_KEYS] },
    { retry: false }
  );

  const [form, setForm] = useState<Record<AboutKey, string>>({
    about_hero_title: "",
    about_hero_subtitle: "",
    about_story_text: "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (textSettings) {
      setForm({
        about_hero_title: textSettings.about_hero_title ?? "",
        about_hero_subtitle: textSettings.about_hero_subtitle ?? "",
        about_story_text: textSettings.about_story_text ?? "",
      });
    }
  }, [textSettings]);

  const setMutation = trpc.settings.set.useMutation();
  const upsertMutation = trpc.banners.upsertSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Image updated"); },
    onError: (e) => toast.error(e.message),
  });
  const clearMutation = trpc.banners.clearSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Image cleared"); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = (slotDef: SlotDef, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      upsertMutation.mutate({
        slot: slotDef.slot,
        imageBase64: result.split(",")[1],
        imageFilename: file.name,
        imageContentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveText = async () => {
    try {
      await Promise.all(
        ABOUT_TEXT_KEYS.map((k) => setMutation.mutateAsync({ key: k, value: form[k] }))
      );
      utils.settings.getMany.invalidate();
      toast.success("About page text saved");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    }
  };

  const isPending = upsertMutation.isPending || clearMutation.isPending;

  if (imagesLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Images */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Images</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ABOUT_IMAGE_SLOTS.map((slotDef) => {
            const currentUrl = (siteImages as Record<string, string>)[slotDef.slot];
            return (
              <SlotCard
                key={slotDef.slot}
                slotDef={slotDef}
                currentUrl={currentUrl}
                isPending={isPending}
                onUpload={(file) => handleUpload(slotDef, file)}
                onClear={() => clearMutation.mutate({ slot: slotDef.slot })}
              />
            );
          })}
        </div>
      </div>

      {/* Text settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Text Content{textLoading && <span className="ml-2 text-xs font-normal text-gray-400 normal-case">Loading...</span>}{textError && <span className="ml-2 text-xs font-normal text-amber-500 normal-case">Could not load saved values</span>}
        </h3>
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="about_hero_title">Hero Title</Label>
            <Input
              id="about_hero_title"
              placeholder="e.g. Premium Hemp Products"
              value={form.about_hero_title}
              onChange={(e) => { setForm((f) => ({ ...f, about_hero_title: e.target.value })); setDirty(true); }}
            />
            <p className="text-xs text-muted-foreground">Large headline shown over the hero image.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about_hero_subtitle">Hero Subtitle</Label>
            <Input
              id="about_hero_subtitle"
              placeholder="e.g. Pharmaceutical-grade hemp from farm to shelf."
              value={form.about_hero_subtitle}
              onChange={(e) => { setForm((f) => ({ ...f, about_hero_subtitle: e.target.value })); setDirty(true); }}
            />
            <p className="text-xs text-muted-foreground">Short line below the hero title.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about_story_text">Our Story Text</Label>
            <Textarea
              id="about_story_text"
              placeholder="Tell your brand story here..."
              rows={6}
              className="resize-none"
              value={form.about_story_text}
              onChange={(e) => { setForm((f) => ({ ...f, about_story_text: e.target.value })); setDirty(true); }}
            />
            <p className="text-xs text-muted-foreground">Paragraph shown next to the story image. Newlines are preserved.</p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveText}
              disabled={setMutation.isPending || !dirty}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {setMutation.isPending ? "Saving..." : "Save Text"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminBanners() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Banners & Site Images</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the hero slider and static images used throughout the site.
        </p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="mb-6">
          <TabsTrigger value="hero">Hero Banners</TabsTrigger>
          <TabsTrigger value="site">Site Images</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="about">About Page</TabsTrigger>
        </TabsList>
        <TabsContent value="hero">
          <HeroBannersTab />
        </TabsContent>
        <TabsContent value="site">
          <SiteImagesTab />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="about">
          <AboutPageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
