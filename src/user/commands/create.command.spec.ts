import { HashPassword } from '../../common/utils/password';
import { mockPrisma } from '../../common/test/test-helpers';
import { CreateUserHandler } from './create.command';
import { CreateUserDto } from '../dto/create-user.dto';
import { DuplicateEmailAddressException } from '../../common/exceptions/DuplicateEmailAddressException';

describe('CreateUser CommandHandler', () => {
  let handler: CreateUserHandler;

  const prisma = mockPrisma;
  beforeAll(async () => {
    handler = new CreateUserHandler(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
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

    jest.spyOn(HashPassword, 'hashPasswordSync').mockReturnValueOnce('');
    await handler.execute(createUserDto);

    // Assertions
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
    await expect(handler.execute(createUserDto)).rejects.toThrowError(DuplicateEmailAddressException);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });
});
