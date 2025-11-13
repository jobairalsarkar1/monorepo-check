import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../apps/server/src/router';

export const trpc = createTRPCReact<AppRouter>();