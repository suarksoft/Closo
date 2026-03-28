import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PerformanceQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @IsOptional()
  @IsIn(["web", "image", "video", "news", "discover", "googleNews"])
  searchType?: "web" | "image" | "video" | "news" | "discover" | "googleNews";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  rowLimit?: number;
}
