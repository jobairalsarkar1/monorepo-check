import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";

// will return users and next page number if available
async function fetchUsersPage(page = 1, pageSize = 25) {
  const res = await fetch(
    `https://randomuser.me/api/?page=${page}&results=${pageSize}&seed=virtualize-demo`
  );
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();

  // api data mapping with user type
  const users: User[] = json.results.map((r: any) => ({
    id: r.login.uuid,
    name: `${r.name.first} ${r.name.last}`,
    email: r.email,
    phone: r.phone,
    website: `${r.login.username}.example.com`,
    company: { name: r.location.timezone?.description || "Unknown Company" },
    address: { city: r.location.city || "Unknown City" },
  }));

  // Simulate finite data by stopping at page 10
  const MAX_PAGE = 10;
  return { users, nextPage: page < MAX_PAGE ? page + 1 : undefined };
}

export default function UsersPage() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const ROW_HEIGHT = 64;
  const PAGE_SIZE = 25;

  const [emailQuery, setEmailQuery] = useState("");

  // Infinite query with proper typing
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["users", "virtual"],
    queryFn: ({ pageParam = 1 }) =>
      fetchUsersPage(pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
  });

  // flattened list of loaded users
  const loadedUsers = data?.pages?.flatMap((page) => page.users) || [];

  // filtered users based on email query
  const filteredUsers = emailQuery
    ? loadedUsers.filter((user) =>
        user.email.toLowerCase().includes(emailQuery.toLowerCase())
      )
    : loadedUsers;

  // virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !viewportRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !emailQuery // when searching auto load is disabled
        ) {
          fetchNextPage();
        }
      },
      {
        root: viewportRef.current,
        rootMargin: "100px", // Load when 100px from viewport
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, emailQuery]);

  if (isError) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center text-xl text-red-500 p-4">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Users</h1>
          <p className="text-gray-300 mt-1 text-lg">
            Virtualized infinite scroll with email search
          </p>
        </div>
        {/* <div className="text-sm text-gray-300">
          {filteredUsers.length} users loaded
          {emailQuery && ` (filtered by email)`}
        </div> */}
        <a
          href="/"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Back Home
        </a>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-md">
        <Input
          placeholder="Search users by email..."
          value={emailQuery}
          onChange={(e) => setEmailQuery(e.target.value)}
          className="border-gray-400 bg-black text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Virtualized Table Container */}
      <div
        ref={viewportRef}
        className="overflow-auto rounded-md text-white bg-black"
        style={{ height: "calc(100vh - 200px)", minHeight: "400px" }}
      >
        {/* Table Header */}
        <div className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold text-gray-900">
            <div className="col-span-1">ID</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">City</div>
          </div>
        </div>

        {/* Virtualized Content */}
        <div style={{ height: totalSize, position: "relative" }}>
          {/* Initial Loading Skeleton */}
          {isLoading && loadedUsers.length === 0 && (
            <div className="absolute inset-0 p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 py-3 animate-pulse"
                >
                  <div className="col-span-1 h-8 bg-gray-200 rounded"></div>
                  <div className="col-span-2 h-8 bg-gray-200 rounded"></div>
                  <div className="col-span-3 h-8 bg-gray-200 rounded"></div>
                  <div className="col-span-2 h-8 bg-gray-200 rounded"></div>
                  <div className="col-span-2 h-8 bg-gray-200 rounded"></div>
                  <div className="col-span-2 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Virtual Rows */}
          {virtualRows.map((virtualRow) => {
            const user = filteredUsers[virtualRow.index];
            if (!user) return null;

            return (
              <div
                key={user.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-4 border-b border-gray-100 hover:bg-gray-200/20"
              >
                <div className="grid grid-cols-12 gap-4 h-full items-center text-sm">
                  <div className="col-span-1 text-gray-50">
                    {virtualRow.index + 1}
                  </div>
                  <div className="col-span-2 font-medium text-gray-100 truncate">
                    {user.name}
                  </div>
                  <div className="col-span-3 text-gray-50 truncate">
                    {user.email}
                  </div>
                  <div className="col-span-2 text-gray-50 truncate">
                    {user.phone}
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {user.company.name}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-gray-100 truncate">
                    {user.address.city}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sentinel for Infinite Scroll */}
          <div
            ref={sentinelRef}
            style={{
              position: "absolute",
              top: totalSize,
              left: 0,
              width: "100%",
              height: "1px",
            }}
          />

          {/* loading more indicator */}
          {isFetchingNextPage && (
            <div
              style={{
                position: "absolute",
                top: totalSize + 10,
                left: 0,
                width: "100%",
              }}
              className="flex justify-center items-center py-4"
            >
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-base">Loading more users...</span>
              </div>
            </div>
          )}

          {/* end of results */}
          {!hasNextPage && loadedUsers.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: totalSize + 10,
                left: 0,
                width: "100%",
              }}
              className="flex justify-center py-4"
            >
              <span className="text-base font-medium tracking-wide text-gray-100">
                {/* All users loaded ({loadedUsers.length} total) */}
                You are all caught up!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* No Results State */}
      {!isLoading && filteredUsers.length === 0 && emailQuery && (
        <div className="text-center py-8 text-gray-500">
          No users found with email containing "{emailQuery}"
        </div>
      )}
    </div>
  );
}
