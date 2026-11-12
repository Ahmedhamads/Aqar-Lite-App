
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();

  console.log("Database connected successfully");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();

  console.log("Database disconnected successfully");
}
