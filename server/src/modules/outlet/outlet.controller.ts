import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OutletService } from "./outlet.service";
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard";
import { CreateOutletDto, UpdateOutletDto } from "@spotly/types";

@ApiTags("Outlet")
@Controller("outlet")
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Get(":id")
  @ApiOperation({ summary: "Get outlet details with menu categories" })
  async getById(@Param("id") id: string) {
    return this.outletService.findById(id);
  }

  @Get("merchant/:merchantId")
  @ApiOperation({ summary: "List all outlets for a merchant" })
  async getByMerchant(@Param("merchantId") merchantId: string) {
    return this.outletService.findByMerchant(merchantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new outlet" })
  async create(@Body() dto: CreateOutletDto) {
    return this.outletService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update outlet details" })
  async update(@Param("id") id: string, @Body() dto: UpdateOutletDto) {
    return this.outletService.update(id, dto);
  }

  @Patch(":id/active")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle outlet active/inactive status" })
  async toggleActive(@Param("id") id: string, @Query("active") active: string) {
    const isActive = active === "true";
    return this.outletService.toggleActive(id, isActive);
  }
}
