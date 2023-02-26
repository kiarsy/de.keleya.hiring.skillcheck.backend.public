import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailNotActivatedException } from '../common/exceptions/EmailNotActivatedException';
import { WrongCredentialException } from '../common/exceptions/WrongCredentialException';
import { DuplicateEmailAddressException } from '../common/exceptions/DuplicateEmailAddressException';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { HashPassword } from '../common/utils/password';

jest.mock('../common/utils/password');
describe('UserService', () => {
  let userService: UserService;

  const prisma = {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    credentials: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const jwtService = {
    sign: jest.fn(),
  };
  beforeAll(async () => {
    userService = new UserService(prisma as any, jwtService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('find', () => {
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

      const result = await userService.find(mockFindUserDto);

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

  describe('findUnique', () => {
    it('should return a user when it exists and is not deleted', async () => {
      const mockWhereUnique = { id: 1 };
      const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await userService.findUnique(mockWhereUnique, true);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
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
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(userService.findUnique(mockWhereUnique)).rejects.toEqual(
        new NotFoundException(undefined, 'User Not found'),
      );
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
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

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
    };

    it('should create a new user', async () => {
      const mockTransaction = jest.fn();
      const mockExecuteRaw = jest.fn().mockReturnValue(1);
      const mockQueryRaw = jest.fn().mockReturnValue([{ id: 1 }]);
      const mockCreate = jest.fn().mockReturnValue({ id: 1 });
      const mockUpdate = jest.fn();

      prisma.$transaction = mockTransaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.$executeRaw = mockExecuteRaw;
      prisma.$queryRaw = mockQueryRaw;
      prisma.credentials = { ...prisma.credentials, create: mockCreate };
      prisma.user = {
        ...prisma.user,
        update: mockUpdate,
        findUnique: jest
          .fn()
          .mockReturnValue(Promise.resolve({ id: 1, name: createUserDto.name, email: createUserDto.email })),
      };

      const result = await userService.create(createUserDto);

      // Assertions
      expect(result).toEqual({ id: 1, name: createUserDto.name, email: createUserDto.email });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          hash: expect.any(String),
        },
      });
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          credentialId: 1,
        },
      });
    });

    it('should throw a DuplicateEmailAddressException when email already exists', async () => {
      // Mock Prisma methods

      const mockTransaction = jest.fn();
      const mockExecuteRaw = jest.fn().mockReturnValue(0);

      prisma.$transaction = mockTransaction.mockImplementation((callback) => {
        return callback(prisma);
      });
      prisma.$executeRaw = mockExecuteRaw;

      // Assertions
      await expect(userService.create(createUserDto)).rejects.toThrowError(DuplicateEmailAddressException);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    const updateUserDto = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    it('should update a user', async () => {
      const user = {
        id: updateUserDto.id,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the PrismaClient instance to return the user when updating
      prisma.user.update = jest.fn().mockResolvedValueOnce(user);

      // Call the update method
      const result = await userService.update(updateUserDto);

      // Expect PrismaClient to have been called with the correct arguments
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: updateUserDto.id },
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          credential: {
            create: {
              hash: expect.any(String),
            },
          },
          updatedAt: expect.any(Date),
        },
      });

      // Expect the result to match the returned user
      expect(result).toEqual(user);
    });

    it('should reject with an error if updating fails', async () => {
      const error = new Error('Failed to update user');

      // Mock the PrismaClient instance to reject with an error when updating
      prisma.user.update = jest.fn().mockRejectedValueOnce(error);

      // Call the update method and expect it to reject with the error
      await expect(userService.update(updateUserDto)).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    test('should delete user successfully', async () => {
      const deleteUserDto = {
        id: 1,
      };
      // Mock the PrismaClient user update method
      prisma.user.update = jest.fn().mockResolvedValueOnce({ id: 1 });

      const result = await userService.delete(deleteUserDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: deleteUserDto.id },
        data: { is_deleted: true, name: '(deleted)' },
      });

      expect(result).toEqual({ users: { id: 1 } });
    });

    test('should throw NotFoundException when user is not found', async () => {
      const deleteUserDto = {
        id: 1,
      };

      // Mock the PrismaClient user update method to return null
      prisma.user.update.mockResolvedValueOnce(null);

      await expect(userService.delete(deleteUserDto)).rejects.toThrowError(NotFoundException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: deleteUserDto.id },
        data: { is_deleted: true, name: '(deleted)' },
      });
    });
  });

  describe('authenticateAndGetJwtToken', () => {
    const authenticateUserDto = {
      email: 'test@example.com',
      password: 'password',
    };

    it('should return a JWT token when given valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        email_confirmed: true,
        credential: {
          hash: 'hashedPassword',
        },
      };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      const token = 'mockToken';
      jwtService.sign.mockReturnValue(token);

      const result = await userService.authenticateAndGetJwtToken(authenticateUserDto);

      expect(result).toEqual(token);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: { contains: authenticateUserDto.email } },
        include: { credential: true },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ id: mockUser.id, username: mockUser.email }, {});
    });

    it('should reject with EmailNotActivatedException when email is not confirmed', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        email_confirmed: false,
        credential: {
          hash: 'hashedPassword',
        },
      };
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(userService.authenticateAndGetJwtToken(authenticateUserDto)).rejects.toThrow(
        EmailNotActivatedException,
      );
    });

    it('should reject with WrongCredentialException when given invalid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        email_confirmed: true,
        credential: {
          hash: 'hashedPassword',
        },
      };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (HashPassword as any).matchHashedPassword = jest.fn().mockReturnValue(false);

      await expect(userService.authenticateAndGetJwtToken({ ...authenticateUserDto })).rejects.toThrow(
        WrongCredentialException,
      );
    });

    it('should reject with WrongCredentialException when user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(userService.authenticateAndGetJwtToken(authenticateUserDto)).rejects.toThrow(
        WrongCredentialException,
      );
    });
  });
});
