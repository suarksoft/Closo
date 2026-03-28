import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AuthModule } from "../auth/auth.module";
import { CreditsModule } from "../credits/credits.module";

@Module({
  imports: [AuthModule, CreditsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
