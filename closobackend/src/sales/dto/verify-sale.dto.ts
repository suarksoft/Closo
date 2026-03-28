import { IsBoolean, IsOptional, IsString } from "class-validator";

export class VerifySaleDto {
  @IsString()
  saleId!: string;

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
