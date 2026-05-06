import { useState } from "react";
import { useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function Catalog() {
  const params = useParams<{ categorySlug?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  const categories = trpc.categories.list.useQuery();

  // Find category id from slug
  const activeCategory = params.categorySlug
    ? categories.data?.find((c) => c.slug === params.categorySlug)
    : undefined;

  const effectiveCategoryId = activeCategory?.id ?? selectedCategoryId;

  const products = trpc.products.list.useQuery(
    effectiveCategoryId ? { categoryId: effectiveCategoryId } : undefined
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="container py-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeCategory ? activeCategory.name : "All Products"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {activeCategory?.description ?? "Browse our complete collection of premium hemp products"}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !effectiveCategoryId
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  All Products
                </button>
                {categories.data?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      effectiveCategoryId === cat.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile category pills */}
          <div className="md:hidden w-full mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategoryId(undefined)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !effectiveCategoryId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                All
              </button>
              {categories.data?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    effectiveCategoryId === cat.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1">
            {products.isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.data && products.data.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-5">{products.data.length} products</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                  {products.data.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">No products found</p>
                <p className="text-gray-400 text-sm mt-1">Try selecting a different category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
