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

  // Get initial page from URL or default to 1
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Single useEffect to handle URL-state synchronization
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

    // If URL page doesn't match current state, update state
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams, currentPage]);

  const query = useQuery({
    queryKey: ["products", currentPage],
    queryFn: () => fetchProducts(currentPage),
    staleTime: 60_000,
  });

  const data = query.data;
  const totalPages = data ? Math.ceil(data.total_products / ITEMS_PER_PAGE) : 1;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;

    // Update both state and URL simultaneously
    setCurrentPage(page);
    navigate(`?page=${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // skeleton for table rows
  const SkeletonRow = () => (
    <TableRow className="h-16">
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-8 w-full bg-gray-700/60 rounded animate-pulse"></div>
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <div className="container mx-auto max-w-6xl p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Products:{" "}
          <span className="text-green-500">PlaceAPI API & Shadcn UI</span>
        </h1>
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Back Home
        </a>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-lg">
        <Table className="bg-gray-800 text-white">
          <TableHeader>
            <TableRow className="bg-gray-950">
              <TableHead className="text-white font-semibold text-base">
                Name
              </TableHead>
              <TableHead className="text-white font-semibold text-base">
                Category
              </TableHead>
              <TableHead className="text-white font-semibold text-base">
                Price
              </TableHead>
              <TableHead className="text-white font-semibold text-base">
                Stock
              </TableHead>
              <TableHead className="text-white font-semibold text-base">
                SKU
              </TableHead>
              <TableHead className="text-white font-semibold text-base">
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
              data?.data?.map((p: any) => (
                <TableRow key={p.id} className="bg-gray-950 hover:bg-gray-700">
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>${p.price.toFixed(2)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8">
        <p className="text-gray-400 text-sm">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, data?.total_products ?? 0)} of{" "}
          {data?.total_products ?? 0} products
        </p>

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button
            variant="default"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={
                currentPage === i + 1
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-900 hover:bg-gray-800"
              }
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="default"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
