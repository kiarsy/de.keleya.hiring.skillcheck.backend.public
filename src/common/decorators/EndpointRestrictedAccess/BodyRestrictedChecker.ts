import { RestrictedCheckerInterface } from './RestrictedCheckerInterface';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';

export class BodyRestrictedChecker implements RestrictedCheckerInterface {
  validate(request: Request, user: User, field: string, canThrow: boolean) {
    if (request.body[field] != user.id) {
      if (canThrow) throw new UnauthorizedException();
      else request.body[field] = user.id;
    }
  }
}
