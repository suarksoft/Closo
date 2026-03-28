import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class WebhookVerifySaleDto {
  @IsString()
  businessId!: string;

  @IsString()
  productId!: string;

  @IsString()
  externalReference!: string;

  @IsIn(["verified", "rejected"])
  status!: "verified" | "rejected";

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
