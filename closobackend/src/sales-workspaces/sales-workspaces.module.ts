import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { CreditsModule } from "../credits/credits.module";
import { SalesWorkspacesController } from "./sales-workspaces.controller";
import { SalesWorkspacesService } from "./sales-workspaces.service";

@Module({
  imports: [AuthModule, AiModule, CreditsModule],
  controllers: [SalesWorkspacesController],
  providers: [SalesWorkspacesService],
  exports: [SalesWorkspacesService],
})
export class SalesWorkspacesModule {}
