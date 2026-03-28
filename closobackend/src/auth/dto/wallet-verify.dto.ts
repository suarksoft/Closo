import { IsEmail, IsEthereumAddress, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../auth.types";

export class WalletVerifyDto {
  @IsEthereumAddress()
  walletAddress!: string;

  @IsString()
  @MinLength(20)
  signature!: string;

  @IsString()
  @MinLength(20)
  message!: string;

  @IsOptional()
  @IsIn(["seller", "business", "admin"])
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  companyName?: string;
}
