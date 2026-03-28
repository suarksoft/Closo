import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsNumber()
  @Min(1)
  price!: number;

  @IsNumber()
  @Min(1)
  @Max(80)
  commissionValue!: number;

  @IsOptional()
  @IsString()
  website?: string;
}
