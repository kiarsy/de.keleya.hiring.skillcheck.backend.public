import { User } from '@prisma/client';
import { Request } from 'express';

export interface RestrictedCheckerInterface {
  validate(request: Request, user: User, field: string, canThrow: boolean);
}
