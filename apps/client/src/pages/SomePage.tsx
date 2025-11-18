import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types for our data
interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

// API function to fetch products (FakeStore API - English data)
const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("https://fakestoreapi.com/products");
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
};

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current search and filter values from URL
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "all";
  const priceRange = searchParams.get("priceRange") || "all";
  const rating = searchParams.get("rating") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  const pageSize = 10;

  // Debounced search to avoid too many re-renders
  const debouncedSearch = useDebounce(search, 300);

  // TanStack Query for data fetching
  const {
    data: products = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) => {
      // Transform data immediately after fetch
      return data.map((product) => ({
        ...product,
        category:
          product.category.charAt(0).toUpperCase() + product.category.slice(1),
      }));
    },
  });

  // Update URL parameters
  const updateSearchParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== "page") {
      newParams.set("page", "1");
    }
    setSearchParams(newParams);
  };

  // Memoized filtered products
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Search filter
      const matchesSearch =
        debouncedSearch === "" ||
        product.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        product.category.toLowerCase().includes(debouncedSearch.toLowerCase());

      // Category filter
      const matchesCategory =
        category === "all" || product.category === category;

      // Price range filter
      const matchesPriceRange =
        priceRange === "all" ||
        (priceRange === "under25" && product.price < 25) ||
        (priceRange === "25to50" &&
          product.price >= 25 &&
          product.price <= 50) ||
        (priceRange === "50to100" &&
          product.price > 50 &&
          product.price <= 100) ||
        (priceRange === "over100" && product.price > 100);

      // Rating filter
      const matchesRating =
        rating === "all" ||
        (rating === "4plus" && product.rating.rate >= 4) ||
        (rating === "3plus" && product.rating.rate >= 3) ||
        (rating === "2plus" && product.rating.rate >= 2);

      return (
        matchesSearch && matchesCategory && matchesPriceRange && matchesRating
      );
    });
  }, [products, debouncedSearch, category, priceRange, rating]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    ).sort();
    return uniqueCategories;
  }, [products]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              Error: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Browse our collection of high-quality products
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {paginatedProducts.length} of {filteredProducts.length}{" "}
          products
          {filteredProducts.length !== products.length && (
            <span> (filtered from {products.length} total)</span>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="space-y-2 lg:col-span-2">
              <label htmlFor="search" className="text-sm font-medium">
                Search Products
              </label>
              <Input
                id="search"
                placeholder="Search by title, description, or category..."
                value={search}
                onChange={(e) => updateSearchParams("search", e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label htmlFor="category-filter" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(value) => updateSearchParams("category", value)}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label htmlFor="price-filter" className="text-sm font-medium">
                Price Range
              </label>
              <Select
                value={priceRange}
                onValueChange={(value) =>
                  updateSearchParams("priceRange", value)
                }
              >
                <SelectTrigger id="price-filter">
                  <SelectValue placeholder="All prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All prices</SelectItem>
                  <SelectItem value="under25">Under $25</SelectItem>
                  <SelectItem value="25to50">$25 - $50</SelectItem>
                  <SelectItem value="50to100">$50 - $100</SelectItem>
                  <SelectItem value="over100">Over $100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label htmlFor="rating-filter" className="text-sm font-medium">
                Minimum Rating
              </label>
              <Select
                value={rating}
                onValueChange={(value) => updateSearchParams("rating", value)}
              >
                <SelectTrigger id="rating-filter">
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any rating</SelectItem>
                  <SelectItem value="4plus">4+ Stars</SelectItem>
                  <SelectItem value="3plus">3+ Stars</SelectItem>
                  <SelectItem value="2plus">2+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              {(search ||
                category !== "all" ||
                priceRange !== "all" ||
                rating !== "all") && (
                <>
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {search && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Search: "{search}"
                      <button
                        onClick={() => updateSearchParams("search", "")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {category !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Category: {category}
                      <button
                        onClick={() => updateSearchParams("category", "all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {priceRange !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Price:{" "}
                      {priceRange === "under25"
                        ? "Under $25"
                        : priceRange === "25to50"
                        ? "$25-$50"
                        : priceRange === "50to100"
                        ? "$50-$100"
                        : "Over $100"}
                      <button
                        onClick={() => updateSearchParams("priceRange", "all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {rating !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Rating:{" "}
                      {rating === "4plus"
                        ? "4+ Stars"
                        : rating === "3plus"
                        ? "3+ Stars"
                        : "2+ Stars"}
                      <button
                        onClick={() => updateSearchParams("rating", "all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </>
              )}
            </div>

            {(search ||
              category !== "all" ||
              priceRange !== "all" ||
              rating !== "all") && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead className="max-w-md">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No products found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-10 h-10 object-contain rounded"
                            />
                            <span className="max-w-xs line-clamp-2">
                              {product.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${product.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span>{product.rating.rate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.rating.count} reviews
                        </TableCell>
                        <TableCell className="max-w-md line-clamp-2 text-sm text-muted-foreground">
                          {product.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateSearchParams(
                          "page",
                          Math.max(1, page - 1).toString()
                        )
                      }
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateSearchParams(
                          "page",
                          Math.min(totalPages, page + 1).toString()
                        )
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductsPage;
