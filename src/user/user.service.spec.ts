import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.services';
import { UserService } from './user.service';
jest.mock('../prisma.services');

describe('UserService', () => {
  let userService: UserService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    credentials: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    userService = new UserService(mockPrismaService as any, new JwtService({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('userService;', userService);
    expect(userService).toBeDefined();
  });

  describe('findUnique', () => {
    it('should return a user when it exists and is not deleted', async () => {
      const mockWhereUnique = { id: 1 };
      const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await userService.findUnique(mockWhereUnique, true);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockWhereUnique.id,
          is_deleted: false,
        },
        include: {
          credential: true,
        },
      });
    });

    it('should reject with NotFoundException when the user does not exist', async () => {
      const mockWhereUnique = { id: 1 };
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(userService.findUnique(mockWhereUnique)).rejects.toEqual(
        new NotFoundException(undefined, 'User Not found'),
      );
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockWhereUnique.id,
          is_deleted: false,
        },
        include: {
          credential: false,
        },
      });
    });
  });
});
