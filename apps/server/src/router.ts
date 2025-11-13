import { z } from 'zod';
import { router, publicProcedure } from './trpc';

// Mock database
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
];

const posts = [
  { id: '1', title: 'First Post', content: 'This is the first post', userId: '1' },
  { id: '2', title: 'Second Post', content: 'This is the second post', userId: '2' },
  { id: '3', title: 'Third Post', content: 'This is the third post', userId: '1' },
];

export const appRouter = router({
  // User procedures
  userList: publicProcedure
    .query(async () => {
      return users;
    }),

  userById: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      const { input } = opts;
      return users.find((user) => user.id === input);
    }),

  userCreate: publicProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async (opts) => {
      const { input } = opts;
      const newUser = {
        id: String(users.length + 1),
        name: input.name,
        email: input.email,
      };
      users.push(newUser);
      return newUser;
    }),

  // Post procedures
  postList: publicProcedure
    .query(async () => {
      return posts.map(post => ({
        ...post,
        user: users.find(user => user.id === post.userId)
      }));
    }),

  postsByUser: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      const { input } = opts;
      return posts
        .filter(post => post.userId === input)
        .map(post => ({
          ...post,
          user: users.find(user => user.id === post.userId)
        }));
    }),

  // Health check
  health: publicProcedure
    .query(() => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    }),
});

export type AppRouter = typeof appRouter;