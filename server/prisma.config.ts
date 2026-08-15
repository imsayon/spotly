import { defineConfig } from "prisma/config";

// Prisma 7 config for the server.
// Connection URLs are supplied at runtime via environment variables in PrismaService.
export default defineConfig({
  earlyAccess: true,
  schema: "../packages/database/prisma/schema.prisma",
});
