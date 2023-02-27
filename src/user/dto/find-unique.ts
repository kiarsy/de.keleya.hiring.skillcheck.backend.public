import { User } from '@prisma/client';

export class FindUniqueDto {
  constructor(readonly data: Partial<User>) {}
}
