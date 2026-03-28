import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DatabaseService } from "../database/database.service";
import { AuthUser, JwtPayload } from "./auth.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authHeader.replace("Bearer ", "");
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET ?? "dev-secret",
      });
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    const userResult = await this.db.query<AuthUser>(
      `SELECT id, role, email, name, wallet_address AS "walletAddress"
       FROM users
       WHERE id = $1`,
      [payload.sub],
    );
    const user = userResult.rows[0];
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    req.user = user;
    return true;
  }
}
