import { EmailNotActivatedException } from '../../common/exceptions/EmailNotActivatedException';
import { WrongCredentialException } from '../../common/exceptions/WrongCredentialException';
import { HashPassword } from '../../common/utils/password';
import { mockPrisma } from '../../common/test/test-helpers';
import { GetUserTokenHandler } from './get-token.query';

describe('GetUserToken QueryHandler', () => {
  let handler: GetUserTokenHandler;

  const prisma = mockPrisma;
  const jwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeAll(async () => {
    handler = new GetUserTokenHandler(jwtService as any, prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

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
    jest.spyOn(HashPassword, 'matchHashedPassword').mockReturnValueOnce(true);

    const result = await handler.execute(authenticateUserDto);

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

    await expect(handler.execute(authenticateUserDto)).rejects.toThrow(EmailNotActivatedException);
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
    jest.spyOn(HashPassword, 'matchHashedPassword').mockReturnValueOnce(false);

    await expect(handler.execute({ ...authenticateUserDto })).rejects.toThrow(WrongCredentialException);
  });

  it('should reject with WrongCredentialException when user not found', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(handler.execute(authenticateUserDto)).rejects.toThrow(WrongCredentialException);
  });
});
