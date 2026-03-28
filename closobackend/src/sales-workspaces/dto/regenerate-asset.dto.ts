import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const ASSET_TYPES = ["email_subject", "email_body", "wa_message", "ig_dm", "call_script", "objection_reply"] as const;

export class RegenerateAssetDto {
  @IsString()
  @IsIn(ASSET_TYPES)
  assetType!: (typeof ASSET_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  persona?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;
}
