import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import {
  IS_ENDPOINT_RESTRICTED,
  IS_PUBLIC_ENDPOINT_KEY,
  RestrictedAccessMethod,
  RestrictedAccessType,
} from '../decorators/publicEndpoint.decorator';
import { Request } from 'express';
import { JwtTokenUser } from '../types/jwtTokenUser';

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
      // store user to request
      request['tokenUser'] = user;
      // add a function to check the validation access
      request['checkIDAccess'] = (id: number) => {
        if (!user.is_admin && id != user.id) {
          throw new UnauthorizedException();
        }
      };

      // RESTRICTED ACCESS HANDLING
      if (!user.is_admin) {
        const IsEndpointRestricted = getMeta(IS_ENDPOINT_RESTRICTED) as RestrictedAccessType;

        // IF enabled
        if (IsEndpointRestricted) {
          //if Throw is enabled
          let badAccess = false;
          if (!IsEndpointRestricted.replaceIfHappened) {
            switch (IsEndpointRestricted.method) {
              case RestrictedAccessMethod.body:
                badAccess = request.body[IsEndpointRestricted.field] != user.id;
                break;
              case RestrictedAccessMethod.params:
                badAccess = request.params[IsEndpointRestricted.field] != String(user.id);
                break;
              case RestrictedAccessMethod.query:
                badAccess = request.query[IsEndpointRestricted.field] != String(user.id);
                break;
            }
            if (badAccess) {
              throw new UnauthorizedException();
            }
          } else {
            // IF replace is enable
            switch (IsEndpointRestricted.method) {
              case RestrictedAccessMethod.body:
                request.body[IsEndpointRestricted.field] = user.id;
                break;
              case RestrictedAccessMethod.params:
                request.params[IsEndpointRestricted.field] = String(user.id);
                break;
              case RestrictedAccessMethod.query:
                request.query[IsEndpointRestricted.field] = String(user.id);
                break;
            }
          }
        }
      }
    }
    return canActivate.valueOf() as boolean;
  }
}
