import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MerchantService } from "./merchant.service";
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard";
import { CurrentUser } from "../../infra/auth/current-user.decorator";
import { CreateMerchantDto, UpdateMerchantDto } from "@spotly/types";

@ApiTags("Merchant")
@Controller("merchant")
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get()
  @ApiOperation({ summary: "List all merchants" })
  async getAll() {
    return this.merchantService.findAll();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get merchant details owned by current user" })
  async getMyMerchant(@CurrentUser("id") userId: string) {
    return this.merchantService.findByOwner(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get merchant by ID" })
  async getById(@Param("id") id: string) {
    return this.merchantService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new merchant profile" })
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateMerchantDto,
  ) {
    return this.merchantService.create(userId, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update merchant profile" })
  async update(@Param("id") id: string, @Body() dto: UpdateMerchantDto) {
    return this.merchantService.update(id, dto);
  }
}
