import { IsString } from "class-validator";

export class SalesMessageDto {
  @IsString()
  companyName!: string;

  @IsString()
  productName!: string;

  @IsString()
  productDescription!: string;

  @IsString()
  channel!: string;
}
