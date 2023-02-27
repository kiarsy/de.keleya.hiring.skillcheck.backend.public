import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { DuplicateEmailAddressException } from 'src/common/exceptions/DuplicateEmailAddressException';
import { HashPassword } from 'src/common/utils/password';
import { PrismaService } from 'src/prisma.services';
import { CreateUserDto } from '../dto/create-user.dto';

@CommandHandler(CreateUserDto)
export class CreateUserHandler implements ICommandHandler<CreateUserDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateUserDto): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let rowId = 0;
      this.prisma
        .$transaction(async (tx) => {
          // Insert if does not exists
          const affectedRows = await tx.$executeRaw`insert into users (name, email, email_activation_code)
          select ${command.name},${command.email},${randomUUID()}
          where not exists (select * from users where email=${command.email} and is_deleted=0);`;

          if (affectedRows === 0) return reject(new DuplicateEmailAddressException());
          // Select id
          const [row] = (await tx.$queryRaw`SELECT last_insert_rowid() AS id`) as any[];
          rowId = Number(row.id);

          // Insert credentials
          const credentials = await tx.credentials.create({
            data: {
              hash: HashPassword.hashPasswordSync(command.password),
            },
          });
          // update user
          await tx.user.update({
            where: {
              id: rowId,
            },
            data: {
              credentialId: credentials.id,
            },
          });
        })
        .then(() => {
          resolve(true);
        })
        .catch(reject);
    });
  }
}
