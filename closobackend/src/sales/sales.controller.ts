import { Body, Controller, ForbiddenException, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { SalesService } from "./sales.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { VerifySaleDto } from "./dto/verify-sale.dto";
import { CreateReferralSaleDto } from "./dto/create-referral-sale.dto";
import { RejectSaleDto } from "./dto/reject-sale.dto";
import { WebhookVerifySaleDto } from "./dto/webhook-verify-sale.dto";
import { ConfigService } from "@nestjs/config";

@Controller("sales")
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly configService: ConfigService,
  ) {}

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
  @Post("reject")
  reject(@CurrentUser() user: AuthUser, @Body() dto: RejectSaleDto) {
    return this.salesService.reject(user, dto);
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

  @Post("webhook/verification")
  webhookVerify(
    @Headers("x-closo-webhook-secret") webhookSecret: string | undefined,
    @Body() dto: WebhookVerifySaleDto,
  ) {
    const expectedSecret = this.configService.get<string>("SALES_WEBHOOK_SECRET");
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      throw new ForbiddenException("Invalid webhook secret");
    }
    return this.salesService.verifyFromWebhook(dto);
  }
}
