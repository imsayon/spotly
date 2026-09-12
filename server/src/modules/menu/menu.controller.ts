import { CurrentUser } from "../../infra/auth/current-user.decorator";
import { CreateMenuCategoryDtoSchema, CreateMenuItemDtoSchema, UpdateMenuItemDtoSchema } from "@spotly/types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { Controller, ParseBoolPipe, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MenuService } from "./menu.service";
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard";
import { CreateMenuCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from "@spotly/types";

@ApiTags("Menu")
@Controller("menu")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get("outlet/:outletId")
  @ApiOperation({ summary: "Get digital menu for an outlet" })
  async getOutletMenu(@Param("outletId") outletId: string) {
    return this.menuService.getOutletMenu(outletId);
  }

  @Post("category")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create menu category" })
  async createCategory(@CurrentUser("id") userId: string, @Body(new ZodValidationPipe(CreateMenuCategoryDtoSchema)) dto: CreateMenuCategoryDto) {
    return this.menuService.createCategory(dto, userId);
  }

  @Post("item")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create menu item" })
  async createItem(@CurrentUser("id") userId: string, @Body(new ZodValidationPipe(CreateMenuItemDtoSchema)) dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto, userId);
  }

  @Patch("item/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit a menu item" })
  async updateItem(@CurrentUser("id") userId: string, @Param("id") itemId: string, @Body(new ZodValidationPipe(UpdateMenuItemDtoSchema)) dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(itemId, dto, userId);
  }

  @Patch("item/:id/availability")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle menu item availability" })
  async toggleAvailability(
    @CurrentUser("id") userId: string,
    @Param("id") itemId: string,
    @Query("available", ParseBoolPipe) available: boolean,
  ) {
    const isAvailable = available;
    return this.menuService.toggleItemAvailability(itemId, isAvailable, userId);
  }

  @Delete("item/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete menu item" })
  async deleteItem(@CurrentUser("id") userId: string, @Param("id") itemId: string) {
    return this.menuService.deleteItem(itemId, userId);
  }
}
