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

import { Button } from "@/components/ui/button";
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
import useDebounce from "@/hooks/useDebounce";
import { Product } from "@/types";

// api call function
const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("https://dummyjson.com/products?limit=100");
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  const json = await response.json();
  
  // mapping dummy json to product type
  return json.products.map((product: any) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    description: product.description,
    category: product.category,
    image: product.thumbnail,
    rating: {
      rate: product.rating,
      count: product.stock
    }
  }));
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

function TestPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [globalFilter, setGlobalFilter] = React.useState(
    searchParams.get("search") || ""
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // search debouncing
  const debouncedSearch = useDebounce(globalFilter, 500);

  // tanStack Query for data fetching
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
  });

  // syncing URL with search
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      newParams.set("search", debouncedSearch);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  }, [debouncedSearch, setSearchParams, searchParams]);

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
  });

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Products</h1>
          <p className="text-gray-300 text-lg mt-1">
            Browse our collection of {products.length} products
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
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          {debouncedSearch && (
            <div className="text-sm text-gray-400">
              Showing {table.getFilteredRowModel().rows.length} of{" "}
              {products.length} products
              {debouncedSearch && ` for "${debouncedSearch}"`}
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
                Array.from({ length: 10 }).map((_, index) => (
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

        <div className="flex items-center justify-between py-4 flex-wrap gap-4">
          <div className="text-gray-400 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 bg-gray-900"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPage;