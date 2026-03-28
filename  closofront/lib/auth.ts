export type UserRole = "seller" | "business" | "admin";

export type SessionUser = {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  walletAddress: string | null;
};

const TOKEN_KEY = "mb_token";
const USER_KEY = "mb_user";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setCookie("mb_role", user.role);
  setCookie("mb_token", token);
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie("mb_role");
  clearCookie("mb_token");
}
