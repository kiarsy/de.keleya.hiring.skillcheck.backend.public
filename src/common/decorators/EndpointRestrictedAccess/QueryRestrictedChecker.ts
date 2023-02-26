import { RestrictedCheckerInterface } from './RestrictedCheckerInterface';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';

export class QueryRestrictedChecker implements RestrictedCheckerInterface {
  validate(request: Request, user: User, field: string, canThrow: boolean) {
    if (request.query[field] != String(user.id)) {
      if (canThrow) throw new UnauthorizedException();
      else request.query[field] = String(user.id);
    }
  }
}
