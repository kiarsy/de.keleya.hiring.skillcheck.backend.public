import { mockPrisma } from '../../common/test/test-helpers';
import { DeleteUserHandler } from './delete.command';
import { NotFoundException } from '@nestjs/common';

describe('DeleteUser CommandHandler', () => {
  let handler: DeleteUserHandler;

  const prisma = mockPrisma;
  beforeAll(async () => {
    handler = new DeleteUserHandler(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  test('should delete user successfully', async () => {
    const deleteUserDto = {
      id: 1,
    };
    // Mock the PrismaClient user update method
    prisma.user.update = jest.fn().mockResolvedValueOnce({ id: 1 });

    await handler.execute(deleteUserDto);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: deleteUserDto.id },
      data: { is_deleted: true, name: '(deleted)' },
    });
  });

  test('should throw NotFoundException when user is not found', async () => {
    const deleteUserDto = {
      id: 1,
    };

    // Mock the PrismaClient user update method to return null
    prisma.user.update.mockResolvedValueOnce(null);

    await expect(handler.execute(deleteUserDto)).rejects.toThrowError(NotFoundException);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: deleteUserDto.id },
      data: { is_deleted: true, name: '(deleted)' },
    });
  });
});
