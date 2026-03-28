import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateReferralDto } from "./dto/create-referral.dto";

@Controller("referrals")
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReferralDto) {
    return this.referralsService.create(user.id, dto.productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Get("mine")
  mine(@CurrentUser() user: AuthUser) {
    return this.referralsService.listMine(user.id);
  }

  @Get(":code/resolve")
  resolve(@Param("code") code: string) {
    return this.referralsService.resolve(code);
  }
}
