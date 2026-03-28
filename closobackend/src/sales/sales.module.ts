import { Module } from "@nestjs/common";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { PayoutsModule } from "../payouts/payouts.module";
import { AuthModule } from "../auth/auth.module";
import { ReferralsModule } from "../referrals/referrals.module";

@Module({
  imports: [PayoutsModule, AuthModule, ReferralsModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
