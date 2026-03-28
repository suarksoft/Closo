import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ConnectWalletDto } from "./dto/connect-wallet.dto";
import { WalletChallengeDto } from "./dto/wallet-challenge.dto";
import { WalletVerifyDto } from "./dto/wallet-verify.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { AuthUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("wallet/challenge")
  walletChallenge(@Body() dto: WalletChallengeDto) {
    return this.authService.walletChallenge(dto);
  }

  @Post("wallet/verify")
  walletVerify(@Body() dto: WalletVerifyDto) {
    return this.authService.walletVerify(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("wallet")
  connectWallet(@CurrentUser() user: AuthUser, @Body() dto: ConnectWalletDto) {
    return this.authService.connectWallet(user.id, dto.walletAddress);
  }
}
