import { IsOptional, IsString } from "class-validator";

export class TriggerPayoutDto {
  @IsString()
  commissionId!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
