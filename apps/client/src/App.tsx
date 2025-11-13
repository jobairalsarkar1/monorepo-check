import React, { useState } from "react";
import { trpc } from "./trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

function AppContent() {
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  // Queries
  const health = trpc.health.useQuery();
  const users = trpc.userList.useQuery();
  const posts = trpc.postList.useQuery();

  // Mutations
  const createUser = trpc.userCreate.useMutation({
    onSuccess: () => {
      users.refetch();
      setNewUserName("");
      setNewUserEmail("");
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName && newUserEmail) {
      createUser.mutate({ name: newUserName, email: newUserEmail });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl text-gray-100">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">
        Nothing Ground Breaking: <span className="text-green-500">Just Learning </span>
      </h1>

      {/* Health Status */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Health Status</h2>
        {health.data ? (
          <p className="text-green-600 font-medium tracking-wide">
            Status:{" "}
            <span className="font-semibold uppercase">
              {health.data.status}
            </span>
            {/* - {health.data.timestamp} */}
          </p>
        ) : (
          <p className="text-gray-600">Loading health status...</p>
        )}
      </section>

      {/* Create User Form */}
      <section className="mb-8 p-6 border border-green-500 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form onSubmit={handleCreateUser} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="px-4 py-2 border border-green-400 rounded-md focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="px-4 py-2 border border-green-400 rounded-md focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-500/80 font-semibold tracking-wide text-white/90 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-gren-500 cursor-pointer"
          >
            Create User
          </button>
        </form>
        {createUser.isPending && (
          <p className="mt-2 text-green-600 text-center font-semibold">Creating user...</p>
        )}
      </section>

      {/* Users List */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        {users.isLoading ? (
          <p className="mt-2 text-green-600 text-center font-semibold">Loading users...</p>
        ) : (
          <div className="grid gap-4">
            {users.data?.map((user: any) => (
              <div
                key={user.id}
                className="p-4 border border-gray-500 rounded-lg shadow-sm"
              >
                <strong className="text-lg text-white/80">{user.name}</strong>
                <span className="text-gray-500 ml-2">- {user.email}</span>
                <span className="text-sm text-gray-500 ml-2">
                  (ID: {user.id})
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Posts List */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {posts.isLoading ? (
          <p className="mt-2 text-green-600 text-center font-semibold">Loading posts...</p>
        ) : (
          <div className="grid gap-4">
            {posts.data?.map((post: any) => (
              <div
                key={post.id}
                className="p-4 border border-gray-500 rounded-lg shadow-sm"
              >
                <h3 className="text-lg font-semibold text-white/80">
                  {post.title}
                </h3>
                <p className="text-gray-400 mt-2">{post.content}</p>
                <small className="text-gray-500">By: {post.user?.name}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "http://localhost:3000/trpc",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
