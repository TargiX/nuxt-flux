// Common-JS bundle → import its *default*, then pull the named class out.
// Rollup will inject an ESM wrapper via @rollup/plugin-commonjs.
import prismaCjs from '~/generated/prisma/client';
const { PrismaClient } = prismaCjs;

// simple singleton (keeps one connection in dev, fresh in prod)
const _prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : globalThis.__prisma ?? (globalThis.__prisma = new PrismaClient());

export default _prisma;
