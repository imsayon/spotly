import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MenuService } from "./menu.service";
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard";
import { CreateMenuCategoryDto, CreateMenuItemDto } from "@spotly/types";

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
  async createCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Post("item")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create menu item" })
  async createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Patch("item/:id/availability")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle menu item availability" })
  async toggleAvailability(
    @Param("id") itemId: string,
    @Query("available") available: string,
  ) {
    const isAvailable = available === "true";
    return this.menuService.toggleItemAvailability(itemId, isAvailable);
  }

  @Delete("item/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete menu item" })
  async deleteItem(@Param("id") itemId: string) {
    return this.menuService.deleteItem(itemId);
  }
}
