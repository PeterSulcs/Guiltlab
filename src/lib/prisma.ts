import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure the client is properly initialized
prisma.$connect()
  .then(() => {
    console.log('Prisma client connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  }); 