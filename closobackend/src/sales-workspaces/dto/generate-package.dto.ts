import { IsOptional, IsString, MaxLength } from "class-validator";

export class GeneratePackageDto {
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
  targetMarket?: string;
}
