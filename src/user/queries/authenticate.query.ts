import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { EmailNotActivatedException } from '../../common/exceptions/EmailNotActivatedException';
import { WrongCredentialException } from '../../common/exceptions/WrongCredentialException';
import { HashPassword } from '../../common/utils/password';
import { PrismaService } from '../../prisma.services';
import { AuthenticateUserDto } from '../dto/authenticate-user.dto';

@QueryHandler(AuthenticateUserDto)
export class AuthenticateUserHandler implements IQueryHandler<AuthenticateUserDto> {
  constructor(private readonly prisma: PrismaService) {} // Here we would inject what is necessary to retrieve our data

  execute(query: AuthenticateUserDto): Promise<User> {
    return new Promise((resolve, reject) => {
      this.prisma.user
        .findFirst({
          where: {
            email: query.email,
          },
          include: { credential: true },
        })
        .then((user) => {
          if (user) {
            if (!HashPassword.matchHashedPassword(query.password, user.credential.hash)) {
              return reject(new WrongCredentialException());
            }
            if (!user.email_confirmed) return reject(new EmailNotActivatedException());

            return resolve(user);
          } else return reject(new WrongCredentialException());
        })
        .catch(reject);
    });
  }
}
