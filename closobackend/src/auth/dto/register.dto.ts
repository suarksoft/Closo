import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../auth.types";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(["seller", "business", "admin"])
  role!: UserRole;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;
}
