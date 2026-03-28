import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PlacesSearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxResults?: number;
}
