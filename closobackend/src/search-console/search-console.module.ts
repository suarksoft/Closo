import { Module } from "@nestjs/common";
import { SearchConsoleController } from "./search-console.controller";
import { SearchConsoleService } from "./search-console.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SearchConsoleController],
  providers: [SearchConsoleService],
  exports: [SearchConsoleService],
})
export class SearchConsoleModule {}
