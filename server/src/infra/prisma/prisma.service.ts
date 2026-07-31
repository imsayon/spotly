import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DIRECT_URL environment variable is required",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  // Prisma 7: pass adapter to constructor
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DIRECT_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL or DIRECT_URL environment variable is required",
      );
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
