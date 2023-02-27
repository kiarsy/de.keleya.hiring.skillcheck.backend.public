import { EmailNotActivatedException } from '../../common/exceptions/EmailNotActivatedException';
import { WrongCredentialException } from '../../common/exceptions/WrongCredentialException';
import { HashPassword } from '../../common/utils/password';
import { mockPrisma } from '../../common/test/test-helpers';
import { AuthenticateUserHandler } from './authenticate.query';

describe('AuthenticateUser QueryHandler', () => {
  let handler: AuthenticateUserHandler;

  const prisma = mockPrisma;
  beforeAll(async () => {
    handler = new AuthenticateUserHandler(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should authenticate user with correct email and password', async () => {
    // Create a user with a hashed password
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      email_confirmed: true,
      credential: {
        hash: 'hashedPassword',
      },
    };
    jest.spyOn(HashPassword, 'matchHashedPassword').mockReturnValueOnce(true);

    prisma.user.findFirst.mockResolvedValue(mockUser);

    // Call the authenticate method with correct email and password
    const result = await handler.execute({
      email: 'test@example.com',
      password: 'password',
    });

    // Expect the result to be mockUser
    expect(result).toBe(mockUser);
  });

  it('should reject authentication with incorrect password', async () => {
    // Create a user with a hashed password
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      email_confirmed: true,
      credential: {
        hash: 'hashedPassword',
      },
    };
    jest.spyOn(HashPassword, 'matchHashedPassword').mockReturnValueOnce(false);

    prisma.user.findFirst.mockResolvedValue(mockUser);

    // Call the authenticate method with incorrect password
    await expect(
      handler.execute({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(WrongCredentialException);
  });

  it('should reject authentication with non-existent email', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      handler.execute({
        email: 'nonexistent@example.com',
        password: 'password',
      }),
    ).rejects.toThrow(WrongCredentialException);
  });

  it('should reject authentication with unconfirmed email', async () => {
    // Create a user with an unconfirmed email and a hashed password
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      email_confirmed: false,
      credential: {
        hash: 'hashedPassword',
      },
    };
    jest.spyOn(HashPassword, 'matchHashedPassword').mockReturnValueOnce(true);

    prisma.user.findFirst.mockResolvedValue(mockUser);

    // Call the authenticate method with correct email and password
    await expect(
      handler.execute({
        email: 'test@example.com',
        password: 'password',
      }),
    ).rejects.toThrow(EmailNotActivatedException);
  });
});
