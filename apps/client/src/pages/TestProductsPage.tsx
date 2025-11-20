import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, Star } from "lucide-react";

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

// constant
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
  const skip = (page - 1) * ITEMS_PER_PAGE;

  let url = `https://dummyjson.com/products?limit=${ITEMS_PER_PAGE}&skip=${skip}`;

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

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "title",
    header: "Product",
    cell: ({ row }) => (
      <div className="max-w-xs">
        <div
          className="font-medium text-gray-100 truncate"
          title={row.getValue("title")}
        >
          {row.getValue("title")}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <div className="max-w-[120px]">
        <Badge
          variant="secondary"
          className="bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-800/40 truncate w-full"
          title={row.getValue("category")}
        >
          {row.getValue("category")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center text-gray-200 hover:text-gray-100"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

      return <div className="font-medium text-gray-100">{formatted}</div>;
    },
  },
  {
    accessorKey: "rating.rate",
    header: ({ column }) => {
      return (
        <div
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer flex items-center text-gray-200 hover:text-gray-100"
        >
          Rating
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      );
    },
    cell: ({ row }) => {
      const rating = row.original.rating;
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-500" />
            </span>
            <span className="text-gray-100">{rating.rate.toFixed(1)}</span>
          </div>
          <span className="text-gray-400 text-sm">({rating.count})</span>
        </div>
      );
    },
  },
];

function TestProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // initial states from url
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";

  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
  // const totalProducts = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  // React Table instance
  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedSearch,
      columnVisibility,
      rowSelection,
    },
    enableGlobalFilter: true,
    manualPagination: true,
    pageCount: totalPages,
  });

  // url syncing with search & pagination
  useEffect(() => {
    const newParams = new URLSearchParams();

    // incase of search change reset to page 1
    const pageToSet =
      debouncedSearch !== initialSearch ? "1" : initialPage.toString();
    newParams.set("page", pageToSet);

    // search params to url if exists
    if (debouncedSearch) {
      newParams.set("search", debouncedSearch);
    } else {
      newParams.delete("search");
    }

    // update if something actually changed
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

  // incase of search change reset to page 1
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

  // page numbers for pagination
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
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-gray-800 hover:bg-gray-800 border-gray-700"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-gray-200 font-semibold py-4"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
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
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-800/50 border-gray-700 transition-colors h-16"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-400 py-8"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
          {/* <div className="text-gray-400 text-sm">
            Page {initialPage} of {totalPages}
          </div> */}

          <Pagination>
            <PaginationContent>
              {/* previous */}
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

              {/* page numbers */}
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

              {/* next */}
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
