import { ForbiddenException } from '@nestjs/common';

export class EmailNotActivatedException extends ForbiddenException {
  constructor() {
    super(undefined, 'Your account is not Activated, Please confirm your email address.');
  }
}
