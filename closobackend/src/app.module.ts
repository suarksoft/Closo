import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { ProductsModule } from "./products/products.module";
import { LeadsModule } from "./leads/leads.module";
import { SalesModule } from "./sales/sales.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AiModule } from "./ai/ai.module";
import { PayoutsModule } from "./payouts/payouts.module";
import { CreditsModule } from "./credits/credits.module";
import { ReferralsModule } from "./referrals/referrals.module";
import { SearchConsoleModule } from "./search-console/search-console.module";
import { SalesWorkspacesModule } from "./sales-workspaces/sales-workspaces.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    LeadsModule,
    SalesModule,
    DashboardModule,
    AiModule,
    PayoutsModule,
    CreditsModule,
    ReferralsModule,
    SearchConsoleModule,
    SalesWorkspacesModule,
  ],
})
export class AppModule {}
