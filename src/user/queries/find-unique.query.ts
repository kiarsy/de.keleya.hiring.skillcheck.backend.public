import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma.services';
import { FindUniqueDto } from '../dto/find-unique';

@QueryHandler(FindUniqueDto)
export class FindUniqueUserHandler implements IQueryHandler<FindUniqueDto> {
  constructor(private readonly prisma: PrismaService) {} // Here we would inject what is necessary to retrieve our data

  execute(query: FindUniqueDto): Promise<User> {
    const is_deleted = query.data.is_admin ? query.data.is_admin : false;
    const whereUnique: Prisma.UserWhereInput = { ...query.data, is_deleted };
    return new Promise((resolve, reject) => {
      this.prisma.user
        .findFirst({
          where: whereUnique,
        })
        .then((user) => {
          if (user) resolve(user);
          else reject(new NotFoundException(undefined, 'User Not found'));
        })
        .catch(reject);
    });
  }
}
