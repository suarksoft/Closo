import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "./auth.types";

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthUser => {
  const req = context.switchToHttp().getRequest<{ user: AuthUser }>();
  return req.user;
});
