import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { FlaskConical, Search, FileText, ExternalLink, Calendar, Package } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded w-full" />
      <div className="h-8 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default function LabResultsPage() {
  const { data: allReports = [], isLoading } = trpc.labReports.listAll.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [productId, setProductId] = useState<number | "">("");

  const products = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    allReports.forEach((r) => {
      if (r.productId && r.productName) map.set(r.productId, { id: r.productId, name: r.productName });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allReports]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allReports.filter((r) => {
      if (q && !r.reportName.toLowerCase().includes(q) && !(r.productName ?? "").toLowerCase().includes(q)) return false;
      if (categoryId !== "" && r.productCategoryId !== categoryId) return false;
      if (productId !== "" && r.productId !== productId) return false;
      return true;
    });
  }, [allReports, search, categoryId, productId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-white border-b border-gray-100">
          <div className="container py-12 md:py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <FlaskConical className="w-3.5 h-3.5" />
              Third-Party Tested
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">Lab Results</h1>
            <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Every product is tested by independent laboratories for purity, potency, and compliance.
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                className="pl-9 rounded-xl bg-white border-gray-200 h-10"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value === "" ? "" : Number(e.target.value)); setProductId(""); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 h-10 min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 h-10 min-w-[180px]"
            >
              <option value="">All Products</option>
              {products
                .filter((p) => categoryId === "" || allReports.some((r) => r.productId === p.id && (categoryId === "" || r.productCategoryId === categoryId)))
                .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Count */}
          {!isLoading && (
            <p className="text-sm text-gray-400 mb-5">
              {filtered.length} {filtered.length === 1 ? "report" : "reports"}
              {(search || categoryId !== "" || productId !== "") && " found"}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-1">No lab reports found</p>
              <p className="text-gray-400 text-sm">
                {search || categoryId !== "" || productId !== ""
                  ? "Try adjusting your search or filters"
                  : "No lab reports available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r) => {
                const viewUrl = r.fileUrl ?? r.externalUrl ?? null;
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    {/* Product info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 flex items-center justify-center">
                        {r.productImageUrl
                          ? <img src={r.productImageUrl} alt={r.productName ?? ""} className="w-full h-full object-cover" />
                          : <Package className="w-5 h-5 text-gray-300" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">{r.productName ?? "—"}</p>
                        {r.variantName && (
                          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-0.5">{r.variantName}</span>
                        )}
                      </div>
                    </div>

                    {/* Report name */}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{r.reportName}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        {r.batchNumber && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <FlaskConical className="w-3 h-3" /> {r.batchNumber}
                          </span>
                        )}
                        {r.testedAt && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.testedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    {viewUrl ? (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Report
                      </a>
                    ) : (
                      <div className="mt-auto py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm text-center">
                        Not available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
