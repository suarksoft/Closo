import { Transform } from "class-transformer";
import { IsEthereumAddress, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateBusinessProfileDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsEthereumAddress()
  @IsString()
  @MaxLength(120)
  walletAddress?: string;
}
