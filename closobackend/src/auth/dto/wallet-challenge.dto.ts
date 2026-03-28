import { IsEthereumAddress, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../auth.types";

export class WalletChallengeDto {
  @IsEthereumAddress()
  walletAddress!: string;

  @IsOptional()
  @IsIn(["seller", "business", "admin"])
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  companyName?: string;
}
