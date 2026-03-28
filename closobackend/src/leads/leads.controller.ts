import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { AssignLeadDto } from "./dto/assign-lead.dto";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query("limit") limit?: string) {
    const data = await this.leadsService.listAvailable(limit ? Number(limit) : 20);
    return data.rows;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Get("mine")
  async mine(@CurrentUser() user: AuthUser) {
    const data = await this.leadsService.listMine(user.id);
    return data.rows;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @Post("assign")
  assign(@CurrentUser() user: AuthUser, @Body() dto: AssignLeadDto) {
    return this.leadsService.assign(user.id, dto);
  }
}
