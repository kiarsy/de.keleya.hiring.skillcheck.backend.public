import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma.services';
import { FindUserDto } from '../dto/find-user.dto';

@QueryHandler(FindUserDto)
export class FindUserHandler implements IQueryHandler<FindUserDto> {
  constructor(private readonly prisma: PrismaService) {} // Here we would inject what is necessary to retrieve our data

  execute(query: FindUserDto): Promise<User[]> {
    const userInclude: Prisma.UserInclude = { credential: false };
    const whereUnique: Prisma.UserWhereInput = {
      id: { in: query.ids },
      is_deleted: false,
    };

    if (query.name) {
      whereUnique.name = { contains: query.name };
    }

    if (query.updatedSince) {
      whereUnique.updatedAt = { gt: query.updatedSince };
    }

    if (query.email) {
      whereUnique.email = { contains: query.email };
    }
    if (query.credentials) {
      userInclude['credential'] = true;
    }

    return this.prisma.user.findMany({
      skip: query.offset,
      take: query.limit,
      where: whereUnique,
      include: userInclude,
    });
  }
}
