import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { GeneratePackageDto } from "./dto/generate-package.dto";
import { ProspectSearchDto } from "./dto/prospect-search.dto";
import { RegenerateAssetDto } from "./dto/regenerate-asset.dto";
import { SalesWorkspacesService } from "./sales-workspaces.service";

@Controller("sales-workspaces")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("seller", "admin")
export class SalesWorkspacesController {
  constructor(private readonly service: SalesWorkspacesService) {}

  @Get("metrics/me")
  metricsMe(@CurrentUser() user: AuthUser) {
    return this.service.metricsForSeller(user.id);
  }

  @Post(":productId/bootstrap")
  bootstrap(@CurrentUser() user: AuthUser, @Param("productId") productId: string) {
    return this.service.bootstrap(user.id, productId);
  }

  @Get(":productId")
  getByProduct(@CurrentUser() user: AuthUser, @Param("productId") productId: string) {
    return this.service.getWorkspaceByProduct(user.id, productId);
  }

  @Post(":workspaceId/generate-package")
  generatePackage(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: GeneratePackageDto,
  ) {
    return this.service.generatePackage(user.id, workspaceId, dto);
  }

  @Post(":workspaceId/prospects/search")
  searchProspects(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: ProspectSearchDto,
  ) {
    return this.service.searchProspects(user.id, workspaceId, dto);
  }

  @Post(":workspaceId/assets/regenerate")
  regenerateAsset(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: RegenerateAssetDto,
  ) {
    return this.service.regenerateAsset(user.id, workspaceId, dto);
  }

  @Get(":workspaceId/export")
  exportWorkspace(@CurrentUser() user: AuthUser, @Param("workspaceId") workspaceId: string) {
    return this.service.exportWorkspace(user.id, workspaceId);
  }
}
