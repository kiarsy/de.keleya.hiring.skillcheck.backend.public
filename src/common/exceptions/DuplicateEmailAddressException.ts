import { ConflictException } from '@nestjs/common';

export class DuplicateEmailAddressException extends ConflictException {
  constructor() {
    super(
      undefined,
      'There is an account connected to email you entered. If you forget your password Please use forget-password[;)]',
    );
  }
}
