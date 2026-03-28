import { IsOptional, IsString } from "class-validator";

export class LeadScoreDto {
  @IsString()
  companyName!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  location?: string;
}
