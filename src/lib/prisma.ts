import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use absolute path for SQLite database
  const dbPath = path.resolve(process.cwd(), "data/a_stock_data.db");
  
  console.log(`Connecting to database: ${dbPath}`);
  
  const adapterFactory = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
  });
  
  // Pass the adapter factory directly
  return new PrismaClient({ adapter: adapterFactory });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
