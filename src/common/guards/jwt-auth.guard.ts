import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { IS_PUBLIC_ENDPOINT_KEY } from '../decorators/publicEndpoint.decorator';
import { Request } from 'express';
import { JwtTokenUser } from '../types/jwtTokenUser';
import { EmailNotActivatedException } from '../exceptions/EmailNotActivatedException';
import { IS_ENDPOINT_RESTRICTED, RestrictedAccessType } from '../decorators/RestrictedAccess.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt']) implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const getMeta = (key: string) => this.reflector.get(key, context.getHandler());
    const isPublicEndpoint = getMeta(IS_PUBLIC_ENDPOINT_KEY);
    if (isPublicEndpoint) return true;

    const canActivate = await super.canActivate(context);
    if (canActivate.valueOf() == true) {
      // get token
      const request = context.switchToHttp().getRequest<Request>();
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
      // verify token
      const tokenPayload = this.jwtService.verify<JwtTokenUser>(token, {});
      // get user based on token-id
      const user = await this.userService.findUnique({ id: tokenPayload.id });
      if (user && !user.email_confirmed) throw new EmailNotActivatedException();

      // store user to request
      request['tokenUser'] = user;

      // RESTRICTED ACCESS HANDLING
      if (!user.is_admin) {
        const IsEndpointRestricted = getMeta(IS_ENDPOINT_RESTRICTED) as RestrictedAccessType;
        if (IsEndpointRestricted) {
          IsEndpointRestricted.validator.validate(
            request,
            user,
            IsEndpointRestricted.field,
            IsEndpointRestricted.throwException,
          );
        }
      }
    }
    return canActivate.valueOf() as boolean;
  }
}
