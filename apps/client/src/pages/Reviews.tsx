import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ReviewsResponse } from "../types";

const API_KEY = import.meta.env.VITE_PLACEAPI_KEY;
const ITEMS_PER_PAGE = 5;

const fetchReviews = async (page: number): Promise<ReviewsResponse> => {
  const res = await fetch(
    `https://api.placeapi.site/api/reviews?limit=${ITEMS_PER_PAGE}&page=${page}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
};

export default function Reviews() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    navigate(`?page=${currentPage}`, { replace: true });
  }, [currentPage]);

  const query = useQuery({
    queryKey: ["reviews", currentPage],
    queryFn: () => fetchReviews(currentPage),
    staleTime: 60_000,
  });

  const data = query.data;

  const totalPages = data ? Math.ceil(data.total_reviews / ITEMS_PER_PAGE) : 1;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // skeleton loader
  const Skeleton = () => (
    <div className="p-6 border border-gray-700 rounded-lg bg-gray-800 animate-pulse h-32 mb-4"></div>
  );

  return (
    <div className="container mx-auto max-w-4xl p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">
          Reviews <span className="text-green-500">API</span>
        </h1>
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
        >
          Back Home
        </a>
      </div>

      {/* reviews */}
      <div className="grid gap-6">
        {query.isLoading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
              <Skeleton key={idx} />
            ))
          : data?.data.map((review) => (
              <div
                key={review.id}
                className="p-6 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-green-400">
                    {review.title || "No Title"}
                  </h2>
                  <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    {review.targetType}: {review.targetName}
                  </span>
                </div>
                <p className="text-gray-300 mb-4">{review.comment}</p>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>By {review.authorName}</span>
                  <span>{review.likes} Likes</span>
                  <span>Rating: {review.rating}/5</span>
                </div>
              </div>
            ))}
      </div>

      {/* pagination */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-700">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          Prev
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentPage === page
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
