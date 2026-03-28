export type UserRole = "seller" | "business" | "admin";

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  walletAddress: string | null;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
}
