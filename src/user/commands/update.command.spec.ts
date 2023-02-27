import { HashPassword } from '../../common/utils/password';
import { mockPrisma } from '../../common/test/test-helpers';
import { UpdateUserHandler } from './update.command';

describe('UpdateUser CommandHandler', () => {
  let handler: UpdateUserHandler;

  const prisma = mockPrisma;
  beforeAll(async () => {
    handler = new UpdateUserHandler(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
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
    jest.spyOn(HashPassword, 'hashPasswordSync').mockReturnValueOnce('');

    // Call the update method
    await handler.execute(updateUserDto);

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
  });

  it('should reject with an error if updating fails', async () => {
    const error = new Error('Failed to update user');

    // Mock the PrismaClient instance to reject with an error when updating
    prisma.user.update = jest.fn().mockRejectedValueOnce(error);

    // Call the update method and expect it to reject with the error
    await expect(handler.execute(updateUserDto)).rejects.toThrow(error);
  });
});
