import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input"; // replace if needed
import { Badge } from "@/components/ui/badge"; // replace if needed

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: { name: string };
  address: { city: string };
};

/** Simple paginated fetch (dummy API). Returns { users, nextPage } */
async function fetchUsersPage(page = 1, pageSize = 25) {
  const res = await fetch(
    `https://randomuser.me/api/?page=${page}&results=${pageSize}&seed=virtualize-demo`
  );
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  const users: User[] = json.results.map((r: any) => ({
    id: r.login.uuid,
    name: `${r.name.first} ${r.name.last}`,
    email: r.email,
    phone: r.phone,
    website: `${r.login.username}.example.com`,
    company: { name: r.location.timezone.description || r.login.username },
    address: { city: r.location.city || "" },
  }));
  // randomuser doesn't tell you "end" — simulate finite data by stopping at page 10
  const MAX_PAGE = 10;
  return { users, nextPage: page < MAX_PAGE ? page + 1 : undefined };
}

/**
 * UsersPage
 * - fixed rowHeight for stable virtualization
 * - sentinel observer to load next page
 * - only renders visible rows (virtualRows)
 * - no loader when no more pages
 */
export default function UsersPage() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const ROW_HEIGHT = 64; // fixed, predictable height
  const PAGE_SIZE = 25;

  const [emailQuery, setEmailQuery] = useState("");

  // infinite query (v5 object signature) with initialPageParam
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery<
    { users: User[]; nextPage?: number }, // TData
    Error, // TError
    { users: User[]; nextPage?: number } // TQueryFnData
  >({
    queryKey: ["users", "virtual"],
    queryFn: async ({ pageParam = 1 }) =>
      fetchUsersPage(pageParam as number, PAGE_SIZE),
    getNextPageParam: (last) => last.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  // flatten loaded pages to array of loaded users
  const loadedUsers = (data?.pages ?? []).flatMap((p) => p.users);

  // client-side search by email. When searching, we DO NOT auto-load more pages.
  const filtered = emailQuery
    ? loadedUsers.filter((u) =>
        u.email.toLowerCase().includes(emailQuery.toLowerCase())
      )
    : loadedUsers;

  // Virtualizer: count = number of items currently available after filter
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // IntersectionObserver sentinel: load next page when sentinel visible.
  // Only active when there's a next page AND when there is no active search.
  useEffect(() => {
    if (!sentinelRef.current || !viewportRef.current) return;
    const sentinel = sentinelRef.current;
    const root = viewportRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            hasNextPage &&
            !isFetchingNextPage &&
            !emailQuery // don't auto-load while searching
          ) {
            fetchNextPage();
          }
        }
      },
      {
        root,
        rootMargin: "400px", // trigger early for smoother UX
        threshold: 0.1,
      }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, emailQuery]);

  // smooth GPU transform hint
  const rowBaseStyle: React.CSSProperties = {
    willChange: "transform",
    transform: "translateZ(0)",
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-gray-500">
            Only viewport rows are rendered — scroll to load more.
          </p>
        </div>

        <div className="w-72">
          <Input
            placeholder="Search by email..."
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
          />
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative overflow-auto border rounded-md"
        style={{ height: "65vh", minHeight: 420 }}
      >
        {/* Header (sticky) using CSS grid to align columns */}
        <div
          className="sticky top-0 z-10 bg-white border-b"
          style={{
            display: "grid",
            gridTemplateColumns: "4rem 1.6fr 2.4fr 1.6fr 1.6fr 1fr 1.4fr",
            gap: 12,
            padding: "12px",
            alignItems: "center",
          }}
        >
          <div className="font-medium text-gray-800">#</div>
          <div className="font-medium text-gray-800">Name</div>
          <div className="font-medium text-gray-800">Email</div>
          <div className="font-medium text-gray-800">Phone</div>
          <div className="font-medium text-gray-800">Company</div>
          <div className="font-medium text-gray-800">City</div>
          <div className="font-medium text-gray-800">Website</div>
        </div>

        {/* Scrollable space sized to the total virtualized height */}
        <div style={{ height: totalSize, position: "relative" }}>
          {/* initial loading skeleton */}
          {isLoading && (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "4rem 1.6fr 2.4fr 1.6fr 1.6fr 1fr 1.4fr",
                    gap: 12,
                    padding: "12px 0",
                  }}
                >
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Render only the virtual items (visible + overscan) */}
          {virtualItems.map((vi) => {
            const user = filtered[vi.index];
            if (!user) return null;
            return (
              <div
                key={user.id}
                role="row"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vi.start}px)`,
                  height: vi.size ?? ROW_HEIGHT,
                  ...rowBaseStyle,
                }}
                className="px-3 flex items-center hover:bg-gray-50"
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "4rem 1.6fr 2.4fr 1.6fr 1.6fr 1fr 1.4fr",
                    gap: 12,
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <div className="text-sm text-gray-700">{vi.index + 1}</div>
                  <div className="font-medium text-sm truncate">
                    {user.name}
                  </div>
                  <div className="text-sm truncate">{user.email}</div>
                  <div className="text-sm truncate">{user.phone}</div>
                  <div className="text-sm">
                    <Badge className="bg-blue-100 text-blue-800">
                      {user.company.name}
                    </Badge>
                  </div>
                  <div className="text-sm truncate">{user.address.city}</div>
                  <div className="text-sm truncate">
                    <a
                      href={`http://${user.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.website}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sentinel: placed at the end of the total content; observer triggers fetchNextPage */}
          {/* If there is no next page, sentinel still exists but won't trigger fetchNextPage */}
          <div
            ref={sentinelRef}
            style={{
              position: "absolute",
              top: totalSize + 1,
              left: 0,
              width: "100%",
              height: 1,
            }}
            aria-hidden
          />

          {/* Bottom loader: realistic and only when fetching next page */}
          {isFetchingNextPage && hasNextPage && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: totalSize + 12,
                width: "100%",
              }}
              className="py-3 text-center"
            >
              <div className="inline-flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300 animate-pulse" />
                <div className="text-sm text-gray-600">Loading more...</div>
              </div>
            </div>
          )}

          {/* If there's no next page and we've loaded everything, show a small end message */}
          {!hasNextPage && loadedUsers.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: totalSize + 12,
                width: "100%",
              }}
              className="py-3 text-center text-sm text-gray-500"
            >
              End of results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
