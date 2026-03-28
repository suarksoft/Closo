import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ProspectSearchDto {
  @IsString()
  @MaxLength(120)
  query!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxResults?: number;
}
