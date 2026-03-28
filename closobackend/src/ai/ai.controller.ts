import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AiService } from "./ai.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LeadScoreDto } from "./dto/lead-score.dto";
import { SalesMessageDto } from "./dto/sales-message.dto";
import { DatabaseService } from "../database/database.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreditsService } from "../credits/credits.service";
import { StartupPlanDto } from "./dto/startup-plan.dto";
import { PlacesSearchDto } from "./dto/places-search.dto";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly db: DatabaseService,
    private readonly creditsService: CreditsService,
  ) {}

  @Post("lead-score")
  async score(@CurrentUser() user: AuthUser, @Body() dto: LeadScoreDto) {
    await this.creditsService.consume(user.id, "lead_score", { feature: "lead-score" });
    return this.aiService.scoreLead(dto);
  }

  @Post("sales-message")
  async message(@CurrentUser() user: AuthUser, @Body() dto: SalesMessageDto) {
    await this.creditsService.consume(user.id, "sales_message", { feature: "sales-message" });
    const generated = await this.aiService.generateSalesMessage(dto);
    await this.db.query(
      `INSERT INTO ai_recommendations (seller_id, message_text, strategy_note, channel)
       VALUES ($1, $2, $3, $4)`,
      [user.id, generated.message, generated.strategy, dto.channel],
    );
    return generated;
  }

  @Post("startup-plan")
  async startupPlan(@CurrentUser() user: AuthUser, @Body() dto: StartupPlanDto) {
    await this.creditsService.consume(user.id, "startup_plan", { feature: "startup-plan" });
    return this.aiService.generateStartupPlan(dto);
  }

  @Post("places-search")
  async placesSearch(@CurrentUser() user: AuthUser, @Body() dto: PlacesSearchDto) {
    await this.creditsService.consume(user.id, "places_search", { feature: "places-search", query: dto.query });
    return this.aiService.searchPlaces(dto);
  }
}
