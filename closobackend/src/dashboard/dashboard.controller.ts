import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { UpdateBusinessProfileDto } from "./dto/update-business-profile.dto";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles("seller", "admin")
  @Get("seller")
  seller(@CurrentUser() user: AuthUser) {
    return this.dashboardService.sellerOverview(user.id);
  }

  @Roles("business", "admin")
  @Get("business")
  business(@CurrentUser() user: AuthUser) {
    return this.dashboardService.businessOverview(user.id);
  }

  @Roles("business", "admin")
  @Patch("business/profile")
  updateBusinessProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateBusinessProfileDto) {
    return this.dashboardService.updateBusinessProfile(user.id, dto);
  }
}
