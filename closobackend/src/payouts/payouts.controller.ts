import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { PayoutsService } from "./payouts.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { TriggerPayoutDto } from "./dto/trigger-payout.dto";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";

@Controller("payouts")
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "business")
  @Post("trigger")
  trigger(@Body() dto: TriggerPayoutDto, @Headers("x-idempotency-key") key?: string) {
    return this.payoutsService.triggerPayout(dto.commissionId, key ?? dto.idempotencyKey);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Get("mine")
  mine(@CurrentUser() user: AuthUser) {
    return this.payoutsService.listForUser(user.id);
  }
}
