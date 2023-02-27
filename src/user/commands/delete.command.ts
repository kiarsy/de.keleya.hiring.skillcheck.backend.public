import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/prisma.services';
import { DeleteUserDto } from '../dto/delete-user.dto';

@CommandHandler(DeleteUserDto)
export class DeleteUserHandler implements ICommandHandler<DeleteUserDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteUserDto): Promise<void> {
    return new Promise((resolve, reject) => {
      this.prisma.user
        .update({
          where: { id: command.id },
          data: { is_deleted: true, name: '(deleted)' },
        })
        .then((user) => {
          if (user) {
            resolve();
          } else {
            reject(new NotFoundException('User not found.'));
          }
        })
        .catch(reject);
    });
  }
}
