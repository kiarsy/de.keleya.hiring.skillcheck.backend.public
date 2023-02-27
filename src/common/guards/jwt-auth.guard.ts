import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_ENDPOINT_KEY } from '../decorators/publicEndpoint.decorator';
import { Request } from 'express';
import { IS_ENDPOINT_RESTRICTED, RestrictedAccessType } from '../decorators/RestrictedAccess.decorator';
import { User } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt']) implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const getMeta = (key: string) => this.reflector.get(key, context.getHandler());
    const isPublicEndpoint = getMeta(IS_PUBLIC_ENDPOINT_KEY);
    if (isPublicEndpoint) return true;

    // check token
    const canActivate = await super.canActivate(context);

    // check RESTRICTED ACCESS
    const IsEndpointRestricted = getMeta(IS_ENDPOINT_RESTRICTED) as RestrictedAccessType;
    if (canActivate.valueOf() == true && IsEndpointRestricted) {
      // get user
      const request = context.switchToHttp().getRequest<Request>();
      const user = request.user as User;
      if (!user.is_admin) {
        IsEndpointRestricted.validator.validate(
          request,
          user,
          IsEndpointRestricted.field,
          IsEndpointRestricted.throwException,
        );
      }
    }
    return canActivate.valueOf() as boolean;
  }
}
