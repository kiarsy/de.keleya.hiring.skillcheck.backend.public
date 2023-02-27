import { mockPrisma } from '../../common/test/test-helpers';
import { FindUserDto } from '../dto/find-user.dto';
import { FindUserHandler } from './find.query';

describe('FindUser QueryHandler', () => {
  let handler: FindUserHandler;

  const prisma = mockPrisma;
  beforeAll(async () => {
    handler = new FindUserHandler(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return an array of users when the query is valid', async () => {
    const mockFindUserDto = {
      ids: [1],
      limit: 10,
      offset: 0,
      name: 'John',
      updatedSince: new Date(),
      email: 'john@example.com',
      credentials: true,
    };
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
    prisma.user.findMany.mockResolvedValue([mockUser]);

    const result = await handler.execute(mockFindUserDto as FindUserDto);

    expect(result).toEqual([mockUser]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      skip: mockFindUserDto.offset,
      take: mockFindUserDto.limit,
      where: {
        id: { in: mockFindUserDto.ids },
        is_deleted: false,
        name: { contains: mockFindUserDto.name },
        email: { contains: mockFindUserDto.email },
        updatedAt: { gt: mockFindUserDto.updatedSince },
      },
      include: {
        credential: true,
      },
    });
  });
});
