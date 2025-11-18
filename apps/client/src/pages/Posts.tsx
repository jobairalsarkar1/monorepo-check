import { useState } from "react";
import postsData from "../data/posts.json";

const ITEMS_PER_PAGE = 5;

export default function PaginationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(postsData.length / ITEMS_PER_PAGE);

  const currentPosts = postsData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dummy Posts</h1>
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
        >
          Back Home
        </a>
      </div>

      <div className="grid gap-6 mb-8">
        {currentPosts.map((post) => (
          <article
            key={post.id}
            className="p-6 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold text-green-400 hover:text-green-300 cursor-pointer">
                {post.title}
              </h2>
              <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {post.category}
              </span>
            </div>
            
            <p className="text-gray-300 mb-4">{post.content}</p>
            
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <span>By {post.author}</span>
                <span>{post.date}</span>
              </div>
              <span>{post.readTime} min read</span>
            </div>
          </article>
        ))}
      </div>

      {/* pagination*/}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-gray-700">
        <div className="text-gray-400 text-sm">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, postsData.length)} of{" "}
          {postsData.length} posts
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
          >
            <span>Prev</span>
          </button>

          {getVisiblePages().map((page, index) =>
            page === "..." ? (
              <span
                key={index}
                className="px-3 py-2 text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={index}
                onClick={() => goToPage(page as number)}
                className={`px-3 py-2 rounded-md transition-colors duration-200 ${
                  currentPage === page
                    ? "bg-green-600 text-white"
                    : "bg-gray-900 text-gray-300 hover:bg-gray-800"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
          >
            <span>Next</span>
          </button>
        </div>
      </div>
    </div>
  );
}