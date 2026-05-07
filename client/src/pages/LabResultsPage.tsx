import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { FlaskConical, Search, FileText, ExternalLink } from "lucide-react";

export default function LabResultsPage() {
  const { data: allReports = [], isLoading } = trpc.labReports.listAll.useQuery();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return allReports;
    return allReports.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.productName ?? "").toLowerCase().includes(q) ||
      (r.category ?? "").toLowerCase().includes(q)
    );
  }, [allReports, search]);

  // Group by the report's own category field; uncategorized → "General"
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const key = r.category?.trim() || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    // Alphabetical, "General" always last
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "General") return 1;
      if (b === "General") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

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
          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                className="pl-9 rounded-xl bg-white border-gray-200 h-10"
              />
            </div>
            {search && !isLoading && (
              <p className="text-sm text-gray-400 mt-2">
                {filtered.length} {filtered.length === 1 ? "report" : "reports"} found
              </p>
            )}
          </div>

          {/* Loading skeletons */}
          {isLoading ? (
            <div className="space-y-12">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-1">No lab reports found</p>
              <p className="text-gray-400 text-sm">
                {search ? "Try adjusting your search" : "No lab reports available yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {groups.map(([category, reports]) => (
                <section key={category}>
                  {/* Category header */}
                  <div className="flex items-center gap-4 mb-5">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-widest shrink-0">
                      {category}
                    </h2>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 shrink-0">
                      {reports.length} {reports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>

                  {/* Report cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {reports.map((r) => {
                      const viewUrl = r.fileUrl ?? null;
                      return (
                        <div
                          key={r.id}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                        >
                          <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                            {r.name}
                          </p>
                          {viewUrl ? (
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-medium transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Report
                            </a>
                          ) : (
                            <div className="py-2 rounded-xl bg-gray-100 text-gray-400 text-sm text-center">
                              Not available
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
