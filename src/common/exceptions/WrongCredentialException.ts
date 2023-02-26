import { ForbiddenException } from '@nestjs/common';

export class WrongCredentialException extends ForbiddenException {
  constructor() {
    super(undefined, 'Email/Password is invalid.');
  }
}
