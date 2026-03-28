import { IsOptional, IsString } from "class-validator";

export class RejectSaleDto {
  @IsString()
  saleId!: string;

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
