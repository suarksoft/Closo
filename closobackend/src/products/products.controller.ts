import { Body, Controller, Get, Param, Post, UseGuards, UseInterceptors } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateProductDto } from "./dto/create-product.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listAll() {
    const data = await this.productsService.listAll();
    return data.rows;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("business", "admin")
  @Get("mine")
  async listMine(@CurrentUser() user: AuthUser) {
    const data = await this.productsService.listMine(user.id);
    return data.rows;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Get("selected/mine")
  async listSelectedMine(@CurrentUser() user: AuthUser) {
    const data = await this.productsService.listSelectedBySeller(user.id);
    return data.rows;
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.productsService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("business", "admin")
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Post(":id/select")
  select(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.productsService.selectForSeller(user.id, id);
  }
}
