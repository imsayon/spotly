import { Injectable, OnModuleInit, OnModuleDestroy, ForbiddenException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Supabase's direct URL is the verified runtime connection. Keep DATABASE_URL
    // for pooler/migration tooling, but don't let a stale pooler tenant break the API.
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL or DIRECT_URL environment variable is required",
      );
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  async assertOutletOwner(outletId: string, userId: string) {
    const outlet = await this.outlet.findFirst({
      where: { id: outletId, merchant: { ownerId: userId } },
      select: { id: true },
    });
    if (!outlet) throw new ForbiddenException("You do not own this outlet");
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
