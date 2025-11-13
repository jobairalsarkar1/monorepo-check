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
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Monorepo tRPC Demo
      </h1>

      {/* Health Status */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Health Status</h2>
        {health.data ? (
          <p className="text-green-600">
            Status: {health.data.status} - {health.data.timestamp}
          </p>
        ) : (
          <p className="text-gray-600">Loading health status...</p>
        )}
      </section>

      {/* Create User Form */}
      <section className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form onSubmit={handleCreateUser} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create User
          </button>
        </form>
        {createUser.isPending && (
          <p className="mt-2 text-blue-600">Creating user...</p>
        )}
      </section>

      {/* Users List */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        {users.isLoading ? (
          <p className="text-gray-600">Loading users...</p>
        ) : (
          <div className="grid gap-4">
            {users.data?.map((user: any) => (
              <div
                key={user.id}
                className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <strong className="text-lg">{user.name}</strong>
                <span className="text-gray-600 ml-2">- {user.email}</span>
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
          <p className="text-gray-600">Loading posts...</p>
        ) : (
          <div className="grid gap-4">
            {posts.data?.map((post: any) => (
              <div
                key={post.id}
                className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {post.title}
                </h3>
                <p className="text-gray-700 mt-2">{post.content}</p>
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
