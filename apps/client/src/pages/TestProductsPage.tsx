import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import useDebounce from "@/hooks/useDebounce";
import { Product } from "@/types";

// Constants
const ITEMS_PER_PAGE = 10;

// API function to fetch products with pagination
const fetchProducts = async (
  page: number,
  search: string = ""
): Promise<{
  products: Product[];
  total: number;
  totalPages: number;
}> => {
  // DummyJSON supports pagination with skip and limit
  const skip = (page - 1) * ITEMS_PER_PAGE;

  let url = `https://dummyjson.com/products?limit=${ITEMS_PER_PAGE}&skip=${skip}`;

  // If there's a search query, use the search endpoint
  if (search) {
    url = `https://dummyjson.com/products/search?q=${encodeURIComponent(
      search
    )}&limit=${ITEMS_PER_PAGE}&skip=${skip}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const json = await response.json();

  // Map the DummyJSON response to match our Product type
  const products = json.products.map((product: any) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    description: product.description,
    category: product.category,
    image: product.thumbnail,
    rating: {
      rate: product.rating,
      count: product.stock,
    },
  }));

  return {
    products,
    total: json.total,
    totalPages: Math.ceil(json.total / ITEMS_PER_PAGE),
  };
};

function TestProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial values from URL
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";

  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);

  // Remove unused states
  // const [sorting, setSorting] = React.useState<SortingState>([]);
  // const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  // const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  // const [rowSelection, setRowSelection] = React.useState({});

  // search debouncing
  const debouncedSearch = useDebounce(globalFilter, 500);

  // tanStack Query for data fetching with pagination
  const {
    data: response,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["products", initialPage, debouncedSearch],
    queryFn: () => fetchProducts(initialPage, debouncedSearch),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const products = response?.products || [];
  const totalProducts = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  // Sync URL with search and pagination
  useEffect(() => {
    const newParams = new URLSearchParams();

    // Always set page to 1 when search changes
    const pageToSet =
      debouncedSearch !== initialSearch ? "1" : initialPage.toString();
    newParams.set("page", pageToSet);

    // Add search to URL if exists
    if (debouncedSearch) {
      newParams.set("search", debouncedSearch);
    } else {
      newParams.delete("search");
    }

    // Only update if something actually changed
    if (newParams.toString() !== searchParams.toString()) {
      setSearchParams(newParams);
    }
  }, [
    debouncedSearch,
    initialPage,
    initialSearch,
    setSearchParams,
    searchParams,
  ]);

  // Handle search change - reset to page 1
  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);
  };

  // Handle page change
  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
          Error: {error.message}
        </div>
      </div>
    );
  }

  // Generate page numbers for pagination (simplified)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let start = Math.max(1, initialPage - 2);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Products</h1>
          <p className="text-gray-300 text-lg mt-1">
            Browse our collection of products
          </p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          Back Home
        </a>
      </div>

      <div className="w-full">
        <div className="flex items-center py-4 gap-4 flex-wrap">
          <Input
            placeholder="Search products by title or category..."
            value={globalFilter ?? ""}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="max-w-sm border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          {debouncedSearch && (
            <div className="text-sm text-gray-400">
              Searching for "{debouncedSearch}"
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-md border border-gray-700 bg-gray-900 mt-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800 border-gray-700">
                <TableHead className="text-gray-200 font-semibold py-4">
                  Product
                </TableHead>
                <TableHead className="text-gray-200 font-semibold py-4">
                  Category
                </TableHead>
                <TableHead className="text-gray-200 font-semibold py-4">
                  Price
                </TableHead>
                <TableHead className="text-gray-200 font-semibold py-4">
                  Rating
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                  <TableRow
                    key={index}
                    className="border-gray-700 hover:bg-gray-800/50 h-16"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center space-x-3 h-6">
                        <Skeleton className="h-5 w-full bg-gray-700" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-6 w-20 bg-gray-700" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-16 bg-gray-700" />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2 h-6">
                        <Skeleton className="h-5 w-12 bg-gray-700" />
                        <Skeleton className="h-4 w-8 bg-gray-700" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-gray-800/50 border-gray-700 transition-colors h-16"
                  >
                    <TableCell className="py-3">
                      <div
                        className="font-medium text-gray-100 truncate max-w-xs"
                        title={product.title}
                      >
                        {product.title}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="max-w-[120px]">
                        <Badge
                          variant="secondary"
                          className="bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-800/40 truncate w-full"
                          title={product.category}
                        >
                          {product.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-medium text-gray-100">
                        ${product.price.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">
                            <Star className="w-4 h-4 fill-yellow-500" />
                          </span>
                          <span className="text-gray-100">
                            {product.rating.rate.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          ({product.rating.count})
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-gray-400 py-8"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ShadCN Pagination Component */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
          <div className="text-gray-400 text-sm">
            Page {initialPage} of {totalPages} • Showing {products.length} of{" "}
            {totalProducts} products
            {debouncedSearch && ` for "${debouncedSearch}"`}
          </div>

          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(initialPage - 1)}
                  className={
                    initialPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900"
                  }
                />
              </PaginationItem>

              {/* Page Numbers */}
              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => goToPage(page)}
                    isActive={initialPage === page}
                    className={
                      initialPage === page
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "cursor-pointer border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900"
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => goToPage(initialPage + 1)}
                  className={
                    initialPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

export default TestProductsPage;
