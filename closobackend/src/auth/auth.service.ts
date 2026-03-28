import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { getAddress, verifyMessage } from "ethers";
import { DatabaseService } from "../database/database.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthUser } from "./auth.types";
import { WalletChallengeDto } from "./dto/wallet-challenge.dto";
import { WalletVerifyDto } from "./dto/wallet-verify.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  private sign(user: AuthUser) {
    return this.jwtService.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      { secret: process.env.JWT_SECRET ?? "dev-secret" },
    );
  }

  private normalizeAddress(walletAddress: string) {
    try {
      return getAddress(walletAddress);
    } catch {
      throw new UnauthorizedException("Invalid wallet address");
    }
  }

  private buildWalletMessage(walletAddress: string, nonce: string) {
    const domain = process.env.AUTH_DOMAIN ?? "localhost";
    const uri = process.env.AUTH_URI ?? "http://localhost:3000";
    return [
      "Closo wants you to sign in with your Ethereum account:",
      walletAddress,
      "",
      "Sign this message to authenticate and continue.",
      "",
      `URI: ${uri}`,
      "Version: 1",
      `Chain ID: ${process.env.MONAD_CHAIN_ID ?? "10143"}`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
      `Domain: ${domain}`,
    ].join("\n");
  }

  async walletChallenge(dto: WalletChallengeDto) {
    const walletAddress = this.normalizeAddress(dto.walletAddress);
    const nonce = randomUUID().replaceAll("-", "");
    const message = this.buildWalletMessage(walletAddress, nonce);
    await this.db.query(
      `INSERT INTO auth_wallet_challenges (wallet_address, nonce, message, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [walletAddress, nonce, message],
    );
    return {
      nonce,
      message,
      expiresAtMinutes: 10,
    };
  }

  async walletVerify(dto: WalletVerifyDto) {
    const walletAddress = this.normalizeAddress(dto.walletAddress);
    const challengeRes = await this.db.query<{ id: string; message: string }>(
      `SELECT id, message
       FROM auth_wallet_challenges
       WHERE wallet_address = $1
         AND message = $2
         AND used_at IS NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [walletAddress, dto.message],
    );
    const challenge = challengeRes.rows[0];
    if (!challenge) {
      throw new UnauthorizedException("Challenge is invalid or expired");
    }

    let recovered = "";
    try {
      recovered = getAddress(verifyMessage(dto.message, dto.signature));
    } catch {
      throw new UnauthorizedException("Invalid signature");
    }
    if (recovered !== walletAddress) {
      throw new UnauthorizedException("Signature does not match wallet");
    }

    await this.db.query("UPDATE auth_wallet_challenges SET used_at = NOW() WHERE id = $1", [challenge.id]);

    const existingUserRes = await this.db.query<AuthUser>(
      `SELECT id, role, email, name, wallet_address AS "walletAddress"
       FROM users
       WHERE wallet_address = $1
       LIMIT 1`,
      [walletAddress],
    );
    let user = existingUserRes.rows[0];

    if (!user) {
      if (!dto.role || !dto.name || !dto.email) {
        throw new UnauthorizedException("New wallet requires role, name and email");
      }
      const duplicateEmail = await this.db.query<{ id: string }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [
        dto.email.toLowerCase(),
      ]);
      if (duplicateEmail.rows[0]) {
        throw new ConflictException("Email already exists");
      }

      const tempPassword = await hash(randomUUID(), 10);
      const created = await this.db.query<AuthUser>(
        `INSERT INTO users (name, email, password_hash, role, wallet_address, company_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, role, email, name, wallet_address AS "walletAddress"`,
        [dto.name, dto.email.toLowerCase(), tempPassword, dto.role, walletAddress, dto.companyName ?? null],
      );
      user = created.rows[0];
    }

    return {
      user,
      accessToken: this.sign(user),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.db.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [dto.email]);
    if (existing.rows.length) {
      throw new ConflictException("Email already exists");
    }

    const passwordHash = await hash(dto.password, 10);
    const created = await this.db.query<AuthUser>(
      `INSERT INTO users (name, email, password_hash, role, wallet_address, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, role, email, name, wallet_address AS "walletAddress"`,
      [dto.name, dto.email.toLowerCase(), passwordHash, dto.role, dto.walletAddress ?? null, dto.companyName ?? null],
    );
    const user = created.rows[0];

    return {
      user,
      accessToken: this.sign(user),
    };
  }

  async login(dto: LoginDto) {
    const result = await this.db.query<
      AuthUser & {
        password_hash: string;
      }
    >(
      `SELECT id, role, email, name, wallet_address AS "walletAddress", password_hash
       FROM users
       WHERE email = $1`,
      [dto.email.toLowerCase()],
    );
    const user = result.rows[0];
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await compare(dto.password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
      },
      accessToken: this.sign(user),
    };
  }

  async connectWallet(userId: string, walletAddress: string) {
    const normalized = this.normalizeAddress(walletAddress);
    const result = await this.db.query<AuthUser>(
      `UPDATE users
       SET wallet_address = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, role, email, name, wallet_address AS "walletAddress"`,
      [userId, normalized],
    );
    return result.rows[0];
  }
}
