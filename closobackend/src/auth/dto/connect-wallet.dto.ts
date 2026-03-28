import { IsString, MinLength } from "class-validator";

export class ConnectWalletDto {
  @IsString()
  @MinLength(6)
  walletAddress!: string;
}
