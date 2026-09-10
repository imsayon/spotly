import { CurrentUser } from "../../infra/auth/current-user.decorator";
import { CreateOutletDtoSchema, UpdateOutletDtoSchema } from "@spotly/types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { Controller, Delete, ParseBoolPipe, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
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
  async create(@CurrentUser("id") userId: string, @Body(new ZodValidationPipe(CreateOutletDtoSchema)) dto: CreateOutletDto) {
    return this.outletService.create(dto, userId);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update outlet details" })
  async update(@CurrentUser("id") userId: string, @Param("id") id: string, @Body(new ZodValidationPipe(UpdateOutletDtoSchema)) dto: UpdateOutletDto) {
    return this.outletService.update(id, dto, userId);
  }

  @Patch(":id/active")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle outlet active/inactive status" })
  async toggleActive(@CurrentUser("id") userId: string, @Param("id") id: string, @Query("active", ParseBoolPipe) active: boolean) {
    const isActive = active;
    return this.outletService.toggleActive(id, isActive, userId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.outletService.remove(id, userId);
  }
}
