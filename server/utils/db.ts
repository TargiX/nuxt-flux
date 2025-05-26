import * as prismaNS from '~/generated/prisma/client';
const { PrismaClient } = prismaNS as typeof import('~/generated/prisma/client');

const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (globalThis.__prisma ??= new PrismaClient());

export default prisma;
