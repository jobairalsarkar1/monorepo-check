import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/useDebounce";

const API_KEY = import.meta.env.VITE_PLACEAPI_KEY;
const ITEMS_PER_PAGE = 8;

const fetchProducts = async (page: number) => {
  const res = await fetch(
    `https://api.placeapi.site/api/products?limit=${ITEMS_PER_PAGE}&page=${page}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get initial values from URL
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sync state with URL when URL changes (browser back/forward)
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
    const searchFromUrl = searchParams.get("search") || "";

    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
    if (searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]); // Only depend on searchParams

  // Update URL when state changes (but avoid infinite loops)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    const newUrl = `?${params.toString()}`;

    // Only update URL if it's different from current URL
    if (window.location.search !== newUrl) {
      navigate(newUrl);
    }
  }, [currentPage, debouncedSearch, navigate]);

  const query = useQuery({
    queryKey: ["products", currentPage],
    queryFn: () => fetchProducts(currentPage),
    staleTime: 60_000,
  });

  const data = query.data;
  const allProducts = data?.data || [];
  const totalProducts = data?.total_products || 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Client-side search/filtering
  const filteredProducts = debouncedSearch
    ? allProducts.filter(
        (product: any) =>
          product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          product.category
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          product.sku.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allProducts;

  const displayedProducts = filteredProducts;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Reset to first page when starting a new search
    if (value !== searchQuery) {
      setCurrentPage(1);
    }
  };

  // Enhanced skeleton loader that matches exact data layout
  const SkeletonRow = () => (
    <TableRow className="h-16 border-b border-gray-700 hover:bg-gray-800/50">
      <TableCell className="py-3">
        <div className="flex items-center space-x-3 h-6">
          <Skeleton className="h-5 w-32 bg-gray-700" />
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="h-6 w-20 bg-gray-700" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="h-5 w-16 bg-gray-700" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="h-5 w-12 bg-gray-700" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="h-5 w-24 bg-gray-700" />
      </TableCell>
      <TableCell className="py-3">
        <Skeleton className="h-12 w-12 bg-gray-700 rounded" />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="container mx-auto max-w-6xl p-6 min-h-screen bg-black">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Products</h1>
          <p className="text-gray-300 text-lg mt-1">
            Browse products with instant search and pagination
          </p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          Back Home
        </a>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-md mb-6">
        <Input
          placeholder="Search by name, category, or SKU..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
        {debouncedSearch && (
          <div className="text-sm text-gray-400 mt-2">
            Found {displayedProducts.length} products matching "
            {debouncedSearch}"
            {displayedProducts.length === 0 && " - try different keywords"}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 hover:bg-gray-800 border-gray-700">
              <TableHead className="text-gray-200 font-semibold text-base py-4">
                Name
              </TableHead>
              <TableHead className="text-gray-200 font-semibold text-base py-4">
                Category
              </TableHead>
              <TableHead className="text-gray-200 font-semibold text-base py-4">
                Price
              </TableHead>
              <TableHead className="text-gray-200 font-semibold text-base py-4">
                Stock
              </TableHead>
              <TableHead className="text-gray-200 font-semibold text-base py-4">
                SKU
              </TableHead>
              <TableHead className="text-gray-200 font-semibold text-base py-4">
                Image
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {query.isLoading &&
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}

            {!query.isLoading &&
              displayedProducts.length > 0 &&
              displayedProducts.map((p: any) => (
                <TableRow
                  key={p.id}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors h-16"
                >
                  <TableCell className="py-3">
                    <div
                      className="font-medium text-gray-100 truncate max-w-xs"
                      title={p.name}
                    >
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="max-w-[120px]">
                      <Badge
                        variant="secondary"
                        className="bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-800/40 truncate w-full"
                        title={p.category}
                      >
                        {p.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="font-medium text-gray-100">
                      ${p.price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div
                      className={`font-medium ${
                        p.stock > 10
                          ? "text-green-400"
                          : p.stock > 0
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {p.stock}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div
                      className="text-gray-300 font-mono text-sm truncate max-w-[100px]"
                      title={p.sku}
                    >
                      {p.sku}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded border border-gray-600"
                    />
                  </TableCell>
                </TableRow>
              ))}

            {/* No results state */}
            {!query.isLoading && displayedProducts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-gray-400 py-8"
                >
                  {debouncedSearch
                    ? `No products found matching "${debouncedSearch}" in the current page`
                    : "No products available on this page"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
        <p className="text-gray-400 text-sm">
          Showing {displayedProducts.length} products on page {currentPage}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
          {!debouncedSearch &&
            ` (${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
              currentPage * ITEMS_PER_PAGE,
              totalProducts
            )} of ${totalProducts})`}
        </p>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900 disabled:opacity-50"
          >
            Previous
          </Button>

          {/* Show limited page numbers for better mobile experience */}
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }

            return (
              <Button
                key={pageNum}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className={
                  currentPage === pageNum
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900"
                }
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
