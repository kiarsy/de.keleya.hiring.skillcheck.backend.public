import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DuplicateEmailAddressException } from 'src/common/exceptions/DuplicateEmailAddressException';
import { HashPassword } from 'src/common/utils/password';
import { PrismaService } from 'src/prisma.services';
import { UpdateUserDto } from '../dto/update-user.dto';

@CommandHandler(UpdateUserDto)
export class UpdateUserHandler implements ICommandHandler<UpdateUserDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserDto): Promise<void> {
    const data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput> = {
      updatedAt: new Date(),
    };

    if (command.email) {
      data['email'] = command.email;
    }

    if (command.name) {
      data['name'] = command.name;
    }

    if (command.password) {
      data['credential'] = {
        create: {
          hash: HashPassword.hashPasswordSync(command.password),
        },
      };
    }

    return new Promise((resolve, reject) => {
      this.prisma.user
        .update({
          where: { id: command.id },
          data,
        })
        .then(() => {
          resolve();
        })
        .catch(reject);
    });
  }
}
