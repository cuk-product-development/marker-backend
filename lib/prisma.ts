import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Lazy singleton — only instantiated when first accessed, not at import time
export const prisma: PrismaClient =
  global.prisma ?? (global.prisma = createPrismaClient());
