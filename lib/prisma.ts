import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    try {
      const client = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
      return client;
    } catch {
      // Return a proxy that throws on access — build time safe
      return new PrismaClient();
    }
  })();
