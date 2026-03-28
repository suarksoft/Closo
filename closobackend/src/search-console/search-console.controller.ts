import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SearchConsoleService } from "./search-console.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { PerformanceQueryDto } from "./dto/performance-query.dto";

@Controller("search-console")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("business", "admin")
export class SearchConsoleController {
  constructor(private readonly searchConsoleService: SearchConsoleService) {}

  @Get("sites")
  listSites() {
    return this.searchConsoleService.listSites();
  }

  @Post("performance")
  performance(@Body() dto: PerformanceQueryDto) {
    return this.searchConsoleService.queryPerformance(dto);
  }
}
