import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  leadAssignmentId?: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  customerWallet?: string;
}
