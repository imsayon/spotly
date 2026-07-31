import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../infra/prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Check service health and DB readiness" })
  async check() {
    let dbStatus = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "unreachable";
    }

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
