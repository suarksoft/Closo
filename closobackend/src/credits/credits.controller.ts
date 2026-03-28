import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CreditsService } from "./credits.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { PurchaseCreditsDto } from "./dto/purchase-credits.dto";

@Controller("credits")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("seller", "admin")
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get("me")
  getMyCredits(@CurrentUser() user: AuthUser) {
    return this.creditsService.getBalance(user.id);
  }

  @Get("tools")
  listTools() {
    return this.creditsService.listTools();
  }

  @Post("purchase")
  purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseCreditsDto) {
    return this.creditsService.purchase(user.id, dto.monAmount, dto.txHash);
  }
}
