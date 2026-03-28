import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateReferralSaleDto {
  @IsString()
  referralCode!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  customerWallet?: string;

  @IsOptional()
  @IsBoolean()
  triggerPayout?: boolean;

  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @IsOptional()
  @IsString()
  verificationReference?: string;

  @IsOptional()
  @IsString()
  verificationNote?: string;
}
