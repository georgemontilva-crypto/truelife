import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Upload, X, Save, ChevronDown, ChevronUp, Palette, Layout, Star, Shield, Package, Layers } from "lucide-react";
import { toast } from "sonner";

// ─── SlotCard ─────────────────────────────────────────────────────────────────

function SlotCard({ slot, label, desc, currentUrl, isPending, onUpload, onClear }: {
  slot: string; label: string; desc?: string;
  currentUrl?: string; isPending: boolean;
  onUpload: (file: File) => void; onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {currentUrl ? (
        <div className="relative group rounded-lg overflow-hidden bg-white border h-24">
          <img src={currentUrl} alt={label} className="w-full h-full object-contain p-2" />
          <button onClick={onClear} disabled={isPending}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed bg-white h-24 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-5 h-5 mb-1" />
          <p className="text-xs">No image</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" disabled={isPending} onClick={() => fileRef.current?.click()}>
          <Upload className="w-3 h-3" />{currentUrl ? "Replace" : "Upload"}
        </Button>
        {currentUrl && (
          <Button size="sm" variant="ghost" className="text-destructive text-xs" disabled={isPending} onClick={onClear}>Clear</Button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function Section({ icon: Icon, title, badge, children, defaultOpen = false }: {
  icon: React.ElementType; title: string; badge?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-gray-700" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 border-t border-gray-50">{children}</div>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useImageMutations() {
  const utils = trpc.useUtils();
  const upsert = trpc.banners.upsertSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Image updated"); },
    onError: (e) => toast.error(e.message),
  });
  const clear = trpc.banners.clearSiteImage.useMutation({
    onSuccess: () => { utils.banners.siteImages.invalidate(); toast.success("Image cleared"); },
    onError: (e) => toast.error(e.message),
  });
  const upload = (slot: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      upsert.mutate({ slot, imageBase64: result.split(",")[1], imageFilename: file.name, imageContentType: file.type });
    };
    reader.readAsDataURL(file);
  };
  return { upload, clear: (slot: string) => clear.mutate({ slot }), isPending: upsert.isPending || clear.isPending };
}

function useTextSettings(keys: readonly string[]) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.settings.getMany.useQuery({ keys: [...keys] }, { retry: false });
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const setMutation = trpc.settings.set.useMutation();

  useEffect(() => {
    if (data) {
      const init: Record<string, string> = {};
      keys.forEach((k) => { init[k] = (data as Record<string, string | null>)[k] ?? ""; });
      setForm(init);
    }
  }, [data]);

  const set = (key: string, value: string) => { setForm((f) => ({ ...f, [key]: value })); setDirty(true); };

  const save = async () => {
    try {
      await Promise.all(Object.entries(form).map(([k, v]) => setMutation.mutateAsync({ key: k, value: v })));
      utils.settings.getMany.invalidate();
      toast.success("Saved");
      setDirty(false);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return { form, set, save, dirty, isLoading, isSaving: setMutation.isPending };
}

function SaveBar({ onSave, dirty, isSaving }: { onSave: () => void; dirty: boolean; isSaving: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
      <Button onClick={onSave} disabled={isSaving || !dirty} className="gap-2">
        <Save className="w-4 h-4" />
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

// ─── 1. Logos & Branding ──────────────────────────────────────────────────────

function LogosSection({ imgs, imgOps }: { imgs: Record<string, string>; imgOps: ReturnType<typeof useImageMutations> }) {
  const logoKeys = ["logo_navbar_size", "logo_footer_size"] as const;
  const { form, set, save, dirty, isSaving } = useTextSettings(logoKeys);
  const navbarSize = parseInt(form.logo_navbar_size || "32") || 32;
  const footerSize = parseInt(form.logo_footer_size || "28") || 28;

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SlotCard slot="logo_main" label="Navbar Logo" desc="Logo shown in the header" currentUrl={imgs.logo_main} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload("logo_main", f)} onClear={() => imgOps.clear("logo_main")} />
        <SlotCard slot="logo_footer" label="Footer Logo" desc="Logo shown in the footer" currentUrl={imgs.logo_footer} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload("logo_footer", f)} onClear={() => imgOps.clear("logo_footer")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Navbar Logo Size</Label>
            <span className="text-xs font-mono bg-white border rounded px-2 py-0.5">{navbarSize}px</span>
          </div>
          <input type="range" min={16} max={80} step={2} value={navbarSize}
            onChange={(e) => set("logo_navbar_size", e.target.value)}
            className="w-full accent-gray-900" />
          <div className="flex justify-between text-xs text-gray-400"><span>16px</span><span>80px</span></div>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Footer Logo Size</Label>
            <span className="text-xs font-mono bg-white border rounded px-2 py-0.5">{footerSize}px</span>
          </div>
          <input type="range" min={16} max={80} step={2} value={footerSize}
            onChange={(e) => set("logo_footer_size", e.target.value)}
            className="w-full accent-gray-900" />
          <div className="flex justify-between text-xs text-gray-400"><span>16px</span><span>80px</span></div>
        </div>
      </div>
      <SaveBar onSave={save} dirty={dirty} isSaving={isSaving} />
    </div>
  );
}

// ─── 2. Theme Colors ──────────────────────────────────────────────────────────

const THEME_DEFS = [
  { key: "theme_dark_bg",    label: "Featured Products BG",  desc: "Dark background behind the featured products carousel", default: "#030712" },
  { key: "theme_navbar_bg",  label: "Navbar Top Bar",        desc: "Background of the announcement bar at top",             default: "#111827" },
  { key: "theme_primary",    label: "Primary (Buttons)",     desc: "Main CTA buttons across the site",                     default: "#111827" },
  { key: "theme_accent",     label: "Accent (Highlights)",   desc: "Icons, highlights and accent elements",                 default: "#059669" },
] as const;

function ThemeSection() {
  const keys = THEME_DEFS.map((d) => d.key) as string[];
  const { form, set, save, dirty, isSaving } = useTextSettings(keys as readonly string[]);

  const handleSave = async () => {
    await save();
    const root = document.documentElement;
    THEME_DEFS.forEach(({ key }) => {
      if (form[key]) root.style.setProperty(`--${key.replace(/_/g, "-")}`, form[key]);
    });
    if (form.theme_primary) {
      root.style.setProperty("--color-gray-900", form.theme_primary);
      root.style.setProperty("--color-gray-950", form.theme_primary);
    }
    if (form.theme_dark_bg) root.style.setProperty("--color-gray-950", form.theme_dark_bg);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {THEME_DEFS.map(({ key, label, desc, default: def }) => (
          <div key={key} className="bg-gray-50 border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{label}</Label>
              <button type="button" onClick={() => set(key, def)} className="text-xs text-gray-400 hover:text-gray-700 underline">Reset</button>
            </div>
            <p className="text-xs text-gray-500">{desc}</p>
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-200 shrink-0 cursor-pointer">
                <input type="color" value={form[key] || def} onChange={(e) => set(key, e.target.value)}
                  className="absolute inset-0 w-[150%] h-[150%] -top-2 -left-2 opacity-0 cursor-pointer" />
                <div className="w-full h-full rounded-lg" style={{ backgroundColor: form[key] || def }} />
              </div>
              <Input value={form[key] || ""} onChange={(e) => set(key, e.target.value)} placeholder={def} className="font-mono text-sm h-9 flex-1" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button type="button" onClick={() => THEME_DEFS.forEach(({ key, default: def }) => set(key, def))} className="text-sm text-gray-400 hover:text-gray-700 underline">Reset all to defaults</button>
        <Button onClick={handleSave} disabled={isSaving || !dirty} className="gap-2">
          <Save className="w-4 h-4" />{isSaving ? "Saving..." : "Save & Apply"}
        </Button>
      </div>
    </div>
  );
}

// ─── 3. Product Range Section ─────────────────────────────────────────────────

const PR_KEYS = ["pr_1", "pr_2", "pr_3", "pr_4"] as const;
const PR_DEFAULTS = {
  pr_1: { title: "Flower and Pre-rolls", desc: "Carefully selected and prepared for an optimal experience." },
  pr_2: { title: "Trim", desc: "Ideal for those who want to make the most of the plant in extractions or customized preparations." },
  pr_3: { title: "Gummies", desc: "Edibles infused with precise doses, perfect for discreet and long-lasting consumption." },
  pr_4: { title: "Cartridges (Carts) and Disposables", desc: "Convenient, ready-to-use vaping solutions that combine ease of use with potent effects." },
};
const PR_TEXT_KEYS = ["pr_section_title", "pr_section_subtitle", ...PR_KEYS.flatMap((k) => [`${k}_title`, `${k}_desc`])] as const;

function ProductRangeSection({ imgs, imgOps }: { imgs: Record<string, string>; imgOps: ReturnType<typeof useImageMutations> }) {
  const { form, set, save, dirty, isSaving } = useTextSettings(PR_TEXT_KEYS);
  return (
    <div className="space-y-5 pt-4">
      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section Header</p>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input placeholder="Our Product Range" value={form.pr_section_title || ""} onChange={(e) => set("pr_section_title", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Subtitle</Label>
          <Textarea rows={2} className="resize-none" placeholder="Premium THCa, THCp..." value={form.pr_section_subtitle || ""} onChange={(e) => set("pr_section_subtitle", e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Cards</p>
        {PR_KEYS.map((key, i) => (
          <div key={key} className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Product {i + 1}</p>
            <div className="flex gap-4">
              <div className="shrink-0 w-32">
                <SlotCard slot={`${key}_icon`} label="Icon" currentUrl={imgs[`${key}_icon`]} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload(`${key}_icon`, f)} onClear={() => imgOps.clear(`${key}_icon`)} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input placeholder={PR_DEFAULTS[key].title} value={form[`${key}_title`] || ""} onChange={(e) => set(`${key}_title`, e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea rows={2} className="resize-none" placeholder={PR_DEFAULTS[key].desc} value={form[`${key}_desc`] || ""} onChange={(e) => set(`${key}_desc`, e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section Image (optional)</p>
        <div className="max-w-xs">
          <SlotCard slot="about_us" label="Left Side Photo" desc="Photo shown next to the text (4:3)" currentUrl={imgs.about_us} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload("about_us", f)} onClear={() => imgOps.clear("about_us")} />
        </div>
      </div>

      <SaveBar onSave={save} dirty={dirty} isSaving={isSaving} />
    </div>
  );
}

// ─── 4. Services Section ──────────────────────────────────────────────────────

const SVC_KEYS = ["service_1", "service_2", "service_3", "service_4", "service_5", "service_6"] as const;
const SVC_DEFAULTS = {
  service_1: { title: "Elevated Therapeutics", desc: "Explore our premium cannabis-based medical solutions, designed for optimal effectiveness and well-being, backed by rigorous lab testing.", link: "/catalog" },
  service_2: { title: "Essence of the Leaf", desc: "Experience the purity of our handpicked cannabis leaves, preserving natural properties for a safe and enriching experience.", link: "/catalog" },
  service_3: { title: "Pure & Natural Edibles", desc: "Our edibles, made with 100% natural ingredients, offer a pure and enjoyable experience, from chocolates to infusions.", link: "/catalog" },
  service_4: { title: "Premium Buds", desc: "Our sustainably grown, pesticide-free cannabis flowers deliver rich aromas, unique flavors, and consistent potency.", link: "/catalog" },
  service_5: { title: "Nature's Apothecary", desc: "Discover our extracts and apothecary formulas, crafted to enhance cannabis compounds for relaxation, pain relief, and well-being.", link: "/catalog" },
  service_6: { title: "Your Safety, Our Priority", desc: "We ensure legal compliance and product safety through rigorous quality control at every stage, providing you with a trusted experience.", link: "/catalog" },
};
const SVC_TEXT_KEYS = [
  "services_section_title", "services_section_subtitle",
  ...SVC_KEYS.flatMap((k) => [`${k}_title`, `${k}_desc`, `${k}_link`]),
] as const;

function ServicesSection({ imgs, imgOps }: { imgs: Record<string, string>; imgOps: ReturnType<typeof useImageMutations> }) {
  const { form, set, save, dirty, isSaving } = useTextSettings(SVC_TEXT_KEYS);
  return (
    <div className="space-y-5 pt-4">
      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section Header</p>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input placeholder="Our Best Services" value={form.services_section_title || ""} onChange={(e) => set("services_section_title", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Subtitle</Label>
          <Textarea rows={2} className="resize-none" value={form.services_section_subtitle || ""} onChange={(e) => set("services_section_subtitle", e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Cards</p>
        {SVC_KEYS.map((key, i) => (
          <div key={key} className="border rounded-xl p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-3">Service {i + 1}</p>
            <div className="flex gap-4">
              <div className="shrink-0 w-32">
                <SlotCard slot={`${key}_icon`} label="Icon" currentUrl={imgs[`${key}_icon`]} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload(`${key}_icon`, f)} onClear={() => imgOps.clear(`${key}_icon`)} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input placeholder={SVC_DEFAULTS[key].title} value={form[`${key}_title`] || ""} onChange={(e) => set(`${key}_title`, e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea rows={2} className="resize-none" placeholder={SVC_DEFAULTS[key].desc} value={form[`${key}_desc`] || ""} onChange={(e) => set(`${key}_desc`, e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Link URL</Label>
                  <Input placeholder="/catalog" value={form[`${key}_link`] || ""} onChange={(e) => set(`${key}_link`, e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <SaveBar onSave={save} dirty={dirty} isSaving={isSaving} />
    </div>
  );
}

// ─── 5. Trust Badges ──────────────────────────────────────────────────────────

const TRUST_SLOTS = [
  { slot: "trust_shipping", label: "Free Shipping Icon", desc: "Square icon" },
  { slot: "trust_returns",  label: "Easy Returns Icon",  desc: "Square icon" },
  { slot: "trust_natural",  label: "100% Natural Icon",  desc: "Square icon" },
  { slot: "trust_lab",      label: "Lab Tested Icon",    desc: "Square icon" },
];

function TrustBadgesSection({ imgs, imgOps }: { imgs: Record<string, string>; imgOps: ReturnType<typeof useImageMutations> }) {
  return (
    <div className="pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {TRUST_SLOTS.map(({ slot, label, desc }) => (
          <SlotCard key={slot} slot={slot} label={label} desc={desc} currentUrl={imgs[slot]} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload(slot, f)} onClear={() => imgOps.clear(slot)} />
        ))}
      </div>
    </div>
  );
}

// ─── 6. Press Logos ───────────────────────────────────────────────────────────

const PRESS_SLOTS = [
  { slot: "press_leafly",          label: "Leafly" },
  { slot: "press_forbes",          label: "Forbes" },
  { slot: "press_herb",            label: "Herb" },
  { slot: "press_oc_weekly",       label: "OC Weekly" },
  { slot: "press_marijuana_daily", label: "MJBizDaily" },
];

function PressSection({ imgs, imgOps }: { imgs: Record<string, string>; imgOps: ReturnType<typeof useImageMutations> }) {
  return (
    <div className="pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {PRESS_SLOTS.map(({ slot, label }) => (
          <SlotCard key={slot} slot={slot} label={label} currentUrl={imgs[slot]} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload(slot, f)} onClear={() => imgOps.clear(slot)} />
        ))}
      </div>
    </div>
  );
}

// ─── 7. About Page ────────────────────────────────────────────────────────────

const ABOUT_IMG_SLOTS = [
  { slot: "about_hero_bg",     label: "Hero Background",  desc: "Full-width hero image (16:9)" },
  { slot: "about_story_image", label: "Our Story Image",  desc: "Left column image (4:3)" },
];
const ABOUT_TEXT_KEYS = ["about_hero_title", "about_hero_subtitle", "about_story_text"] as const;

function AboutPageSection({ imgs, imgOps }: { imgs: Record<string, string>; imgOps: ReturnType<typeof useImageMutations> }) {
  const { form, set, save, dirty, isSaving } = useTextSettings(ABOUT_TEXT_KEYS);
  return (
    <div className="space-y-5 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ABOUT_IMG_SLOTS.map(({ slot, label, desc }) => (
          <SlotCard key={slot} slot={slot} label={label} desc={desc} currentUrl={imgs[slot]} isPending={imgOps.isPending} onUpload={(f) => imgOps.upload(slot, f)} onClear={() => imgOps.clear(slot)} />
        ))}
      </div>
      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Text Content</p>
        <div className="space-y-1.5">
          <Label>Hero Title</Label>
          <Input placeholder="Premium Hemp Products" value={form.about_hero_title || ""} onChange={(e) => set("about_hero_title", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Hero Subtitle</Label>
          <Input placeholder="Pharmaceutical-grade hemp from farm to shelf." value={form.about_hero_subtitle || ""} onChange={(e) => set("about_hero_subtitle", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Our Story Text</Label>
          <Textarea rows={5} className="resize-none" placeholder="Tell your brand story here..." value={form.about_story_text || ""} onChange={(e) => set("about_story_text", e.target.value)} />
        </div>
      </div>
      <SaveBar onSave={save} dirty={dirty} isSaving={isSaving} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSiteEditor() {
  const { data: siteImages = {}, isLoading } = trpc.banners.siteImages.useQuery();
  const imgs = siteImages as Record<string, string>;
  const imgOps = useImageMutations();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Site Editor</h1>
        <p className="text-sm text-gray-500 mt-1">Edit content, images, and colors for each section of the site.</p>
      </div>

      <div className="space-y-3">
        <Section icon={Palette} title="Theme & Colors" badge="Visual" defaultOpen>
          <ThemeSection />
        </Section>

        <Section icon={Layout} title="Logos & Branding">
          <LogosSection imgs={imgs} imgOps={imgOps} />
        </Section>

        <Section icon={Package} title="Product Range Section" badge="Homepage">
          <ProductRangeSection imgs={imgs} imgOps={imgOps} />
        </Section>

        <Section icon={Star} title="Services Section" badge="Homepage">
          <ServicesSection imgs={imgs} imgOps={imgOps} />
        </Section>

        <Section icon={Shield} title="Trust Badges" badge="Homepage">
          <TrustBadgesSection imgs={imgs} imgOps={imgOps} />
        </Section>

        <Section icon={Layers} title="Press Logos">
          <PressSection imgs={imgs} imgOps={imgOps} />
        </Section>

        <Section icon={Layout} title="About Page">
          <AboutPageSection imgs={imgs} imgOps={imgOps} />
        </Section>
      </div>
    </div>
  );
}
