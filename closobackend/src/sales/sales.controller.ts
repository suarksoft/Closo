import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SalesService } from "./sales.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { VerifySaleDto } from "./dto/verify-sale.dto";
import { CreateReferralSaleDto } from "./dto/create-referral-sale.dto";

@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("business", "admin")
  @Post("verify")
  verify(@CurrentUser() user: AuthUser, @Body() dto: VerifySaleDto) {
    return this.salesService.verify(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("business", "admin")
  @Post("by-referral")
  createByReferral(@CurrentUser() user: AuthUser, @Body() dto: CreateReferralSaleDto) {
    return this.salesService.createFromReferral(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  mine(@CurrentUser() user: AuthUser) {
    return this.salesService.listMine(user);
  }
}
