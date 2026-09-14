import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateOutletDto, DiscoverOutletQuery, UpdateOutletDto } from "@spotly/types";

type DiscoverRow = {
  id: string;
  merchant_id: string;
  outlet_name: string;
  outlet_address: string | null;
  outlet_lat: number | null;
  outlet_lng: number | null;
  is_active: boolean;
  open_time: string | null;
  close_time: string | null;
  merchant_name: string;
  category: string;
  description: string | null;
  verified: boolean;
  logo_url: string | null;
  distance_meters: number | null;
};

@Injectable()
export class OutletService {
  constructor(private readonly prisma: PrismaService) {}

  async discover(query: DiscoverOutletQuery) {
    const predicates: Prisma.Sql[] = [];
    const search = query.q?.trim();
    if (search) {
      const pattern = `%${search}%`;
      predicates.push(Prisma.sql`(
        m."name" ILIKE ${pattern}
        OR m."category" ILIKE ${pattern}
        OR COALESCE(m."address", '') ILIKE ${pattern}
        OR o."name" ILIKE ${pattern}
        OR COALESCE(o."address", '') ILIKE ${pattern}
      )`);
    }
    if (query.category && query.category !== "All") {
      predicates.push(Prisma.sql`m."category" ILIKE ${query.category}`);
    }

    let distanceExpression = Prisma.sql`NULL`;
    let orderBy = Prisma.sql`m."name" ASC, o."name" ASC, o."id" ASC`;
    if (query.mode === "nearby") {
      const latitude = query.lat as number;
      const longitude = query.lng as number;
      const latDelta = 10_000 / 111_320;
      const longitudeScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
      const lngDelta = 10_000 / (111_320 * longitudeScale);
      distanceExpression = Prisma.sql`(
        6371000 * acos(least(1, greatest(-1,
          sin(radians(${latitude})) * sin(radians(o."lat")) +
          cos(radians(${latitude})) * cos(radians(o."lat")) * cos(radians(o."lng") - radians(${longitude}))
        )))
      )`;
      predicates.push(
        Prisma.sql`o."lat" IS NOT NULL AND o."lng" IS NOT NULL AND o."lat" BETWEEN ${latitude - latDelta} AND ${latitude + latDelta} AND o."lng" BETWEEN ${longitude - lngDelta} AND ${longitude + lngDelta}`,
        Prisma.sql`${distanceExpression} <= 10000`,
      );
      orderBy = Prisma.sql`${distanceExpression} ASC, o."id" ASC`;
    } else if (query.mode === "viewport") {
      predicates.push(Prisma.sql`o."lat" IS NOT NULL AND o."lng" IS NOT NULL`);
      const north = query.north as number;
      const south = query.south as number;
      const east = query.east as number;
      const west = query.west as number;
      predicates.push(Prisma.sql`o."lat" BETWEEN ${south} AND ${north}`);
      predicates.push(
        west <= east
          ? Prisma.sql`o."lng" BETWEEN ${west} AND ${east}`
          : Prisma.sql`(o."lng" >= ${west} OR o."lng" <= ${east})`,
      );
    }

    const rows = await this.prisma.$queryRaw<DiscoverRow[]>(Prisma.sql`
      SELECT
        o."id",
        o."merchantId" AS merchant_id,
        o."name" AS outlet_name,
        o."address" AS outlet_address,
        o."lat" AS outlet_lat,
        o."lng" AS outlet_lng,
        o."isActive" AS is_active,
        o."openTime" AS open_time,
        o."closeTime" AS close_time,
        m."name" AS merchant_name,
        m."category",
        m."description",
        m."verified",
        m."logoUrl" AS logo_url,
        ${distanceExpression} AS distance_meters
      FROM "Outlet" o
      INNER JOIN "Merchant" m ON m."id" = o."merchantId"
      ${predicates.length ? Prisma.sql`WHERE ${Prisma.join(predicates, " AND ")}` : Prisma.empty}
      ORDER BY ${orderBy}
      LIMIT ${query.limit + 1}
      OFFSET ${query.offset}
    `);

    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit).map((row) => ({
      id: row.id,
      merchantId: row.merchant_id,
      name: row.outlet_name,
      address: row.outlet_address,
      lat: row.outlet_lat,
      lng: row.outlet_lng,
      isActive: row.is_active,
      openTime: row.open_time,
      closeTime: row.close_time,
      distanceMeters: row.distance_meters === null ? null : Number(row.distance_meters),
      merchant: {
        id: row.merchant_id,
        name: row.merchant_name,
        category: row.category,
        description: row.description,
        verified: row.verified,
        logoUrl: row.logo_url,
      },
    }));
    return { items, mode: query.mode, hasMore, nextOffset: hasMore ? query.offset + query.limit : null };
  }

  async findById(id: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id },
      select: {
        id: true,
        merchantId: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        isActive: true,
        openTime: true,
        closeTime: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            verified: true,
            logoUrl: true,
            phone: true,
            address: true,
            website: true,
            lat: true,
            lng: true,
            spotId: true,
          },
        },
        menuCategories: {
          select: {
            id: true,
            outletId: true,
            name: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                categoryId: true,
                name: true,
                description: true,
                price: true,
                image: true,
                isAvailable: true,
                order: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet ${id} not found`);
    }

    return outlet;
  }

  async findByMerchant(merchantId: string) {
    return this.prisma.outlet.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        merchantId: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        isActive: true,
        openTime: true,
        closeTime: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(dto: CreateOutletDto, userId: string) {
    const owned = await this.prisma.merchant.findFirst({ where: { id: dto.merchantId, ownerId: userId } });
    if (!owned) throw new ForbiddenException("You do not own this business");
    const existing = await this.prisma.outlet.findFirst({
      where: { merchantId: dto.merchantId, name: dto.name },
    });
    if (existing) return existing;
    return this.prisma.outlet.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateOutletDto, userId: string) {
    await this.prisma.assertOutletOwner(id, userId);
    return this.prisma.outlet.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string, isActive: boolean, userId: string) {
    await this.prisma.assertOutletOwner(id, userId);
    return this.prisma.outlet.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: string, userId: string) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const outlet = await tx.outlet.findUnique({ where: { id }, select: { id: true, isActive: true, merchant: { select: { ownerId: true } } } });
          if (!outlet) throw new NotFoundException(`Outlet ${id} not found`);
          if (outlet.merchant.ownerId !== userId) throw new ForbiddenException("You do not own this outlet");
          if (outlet.isActive) throw new ConflictException("Pause this outlet before deleting it");
          const activeEntry = await tx.queueEntry.findFirst({ where: { outletId: id, status: { in: ["PENDING_ACCEPTANCE", "WAITING", "CALLED"] } }, select: { id: true } });
          if (activeEntry) throw new ConflictException("This outlet has active queue entries. Serve or close them before deleting it.");
          return tx.outlet.delete({ where: { id } });
        }, { isolationLevel: "Serializable" });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictException("The outlet changed. Refresh and try again.");
  }
}
