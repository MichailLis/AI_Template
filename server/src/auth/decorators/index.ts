import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown>;
    if (!data) return user;
    return user?.[data];
  },
);

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown>;
    return user?.['sub'] as number;
  },
);
