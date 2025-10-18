import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // تأكد إن DATABASE_URL موجود في .env.local
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;