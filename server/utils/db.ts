// Prisma's generated bundle is CommonJS.
// After @rollup/plugin-commonjs runs, **all** exports land on the namespace object.
// → use a namespace import, not `default`, not named.
import { PrismaClient } from '@prisma/client';

const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : // reuse the instance in dev to avoid exhausting connections
      ((globalThis as any).__prisma ??= new PrismaClient());

export default prisma;
