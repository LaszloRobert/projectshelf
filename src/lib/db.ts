import { PrismaClient } from '@prisma/client'
import { ensureEnvFile } from './env-setup'

// Ensure .env file exists before initializing database
ensureEnvFile()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 