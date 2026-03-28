import { Module } from "@nestjs/common";
import { CreditsService } from "./credits.service";
import { CreditsController } from "./credits.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [CreditsService],
  controllers: [CreditsController],
  exports: [CreditsService],
})
export class CreditsModule {}
