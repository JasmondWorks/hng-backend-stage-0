import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { envConfig } from "../config/env.config";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function makePrismaClient() {
  const adapter = new PrismaPg(envConfig.databaseUrl);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
