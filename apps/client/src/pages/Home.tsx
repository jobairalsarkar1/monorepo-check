import React, { useState } from "react";
import { trpc } from "../trpc";

const navItems = [
  { name: "Posts", href: "/posts" },
  { name: "Reviews", href: "/reviews" },
  { name: "Products", href: "/products" },
  { name: "Users (Virtualization)", href: "/userspage" },
  { name: "Products (Shadcn Data Table)", href: "/productspage" },
];

function Home() {
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const health = trpc.health.useQuery();
  const users = trpc.userList.useQuery();

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
      <h1 className="text-3xl font-bold mb-6">
        Nothing Ground Breaking:{" "}
        <span className="text-green-500"> Just Learning </span>
      </h1>

      {/* navigation */}
      <nav>
        <ul className="flex space-x-4 mb-6">
          {navItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className="px-4 py-2 text-gray-100 font-medium bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* health check */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Status Check</h2>

        {health.isLoading && (
          <p className="text-gray-600">Loading health status...</p>
        )}

        {health.isError && (
          <p className="text-red-500 font-medium">
            Something went wrong.
            {/* {health.error?.message} */}
          </p>
        )}

        {health.data && (
          <p className="text-green-600 font-medium tracking-wide">
            Status:{" "}
            <span className="font-semibold uppercase">
              {health.data.status}
            </span>
          </p>
        )}
      </section>

      {/* create user */}
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
            className="px-6 py-2 bg-green-600 font-semibold tracking-wide text-white/90 rounded-md hover:bg-green-600/90 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            Create User
          </button>
        </form>

        {createUser.isPending && (
          <p className="mt-2 text-green-600 text-center font-semibold">
            Creating user...
          </p>
        )}

        {/* mutation error */}
        {createUser.isError && (
          <p className="mt-2 text-red-500 text-center font-semibold">
            {"Failed to create user. Please try again after some time."}
          </p>
        )}
      </section>

      {/* users */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Users</h2>

        {users.isLoading && (
          <p className="mt-2 text-green-600 text-center font-semibold">
            Loading users...
          </p>
        )}

        {/* users get error */}
        {users.isError && (
          <p className="mt-2 text-red-500 text-center font-semibold">
            Failed to load users.
            {/* {users.error?.message} */}
          </p>
        )}

        {!users.isLoading && users.data && (
          <div className="grid gap-4">
            {users.data.map((user: any) => (
              <div
                key={user.id}
                className="p-4 border border-gray-500 rounded-lg shadow-sm"
              >
                <strong className="text-lg text-gray-100">{user.name}</strong>
                <span className="text-gray-500 ml-2">- {user.email}</span>
                <span className="text-sm text-gray-500 ml-2">
                  (ID: {user.id})
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
