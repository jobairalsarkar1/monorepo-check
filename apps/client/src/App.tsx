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
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Monorepo tRPC Demo</h1>

      {/* Health Status */}
      <section>
        <h2>Health Status</h2>
        {health.data ? (
          <p>
            Status: {health.data.status} - {health.data.timestamp}
          </p>
        ) : (
          <p>Loading health status...</p>
        )}
      </section>

      {/* Create User Form */}
      <section
        style={{ margin: "20px 0", padding: "20px", border: "1px solid #ccc" }}
      >
        <h2>Create New User</h2>
        <form onSubmit={handleCreateUser}>
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            style={{ margin: "5px", padding: "8px" }}
          />
          <button type="submit" style={{ margin: "5px", padding: "8px 16px" }}>
            Create User
          </button>
        </form>
        {createUser.isPending && <p>Creating user...</p>}
      </section>

      {/* Users List */}
      <section style={{ margin: "20px 0" }}>
        <h2>Users</h2>
        {users.isLoading ? (
          <p>Loading users...</p>
        ) : (
          <ul>
            {users.data?.map((user: any) => (
              <li
                key={user.id}
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #eee",
                }}
              >
                <strong>{user.name}</strong> - {user.email} (ID: {user.id})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Posts List */}
      <section style={{ margin: "20px 0" }}>
        <h2>Posts</h2>
        {posts.isLoading ? (
          <p>Loading posts...</p>
        ) : (
          <ul>
            {posts.data?.map((post: any) => (
              <li
                key={post.id}
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #eee",
                }}
              >
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <small>By: {post.user?.name}</small>
              </li>
            ))}
          </ul>
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
