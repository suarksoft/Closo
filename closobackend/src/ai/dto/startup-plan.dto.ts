import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class StartupPlanDto {
  @IsString()
  startupName!: string;

  @IsString()
  productName!: string;

  @IsString()
  productDescription!: string;

  @IsOptional()
  @IsString()
  targetMarket?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  commissionPercent!: number;
}
