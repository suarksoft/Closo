import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PurchaseCreditsDto {
  @IsNumber()
  @Min(0.01)
  monAmount!: number;

  @IsOptional()
  @IsString()
  txHash?: string;
}
