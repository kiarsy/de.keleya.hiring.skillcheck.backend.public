import { RestrictedCheckerInterface } from './RestrictedCheckerInterface';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';

export class ParamRestrictedChecker implements RestrictedCheckerInterface {
  validate(request: Request, user: User, field: string, canThrow: boolean) {
    if (request.params[field] != String(user.id)) {
      if (canThrow) throw new UnauthorizedException();
      else request.params[field] = String(user.id);
    }
  }
}
