import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL or DIRECT_URL environment variable is required");
      }
      return new PrismaPg({ connectionString });
    },
  },
});
