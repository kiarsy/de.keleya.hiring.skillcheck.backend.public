import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { EmailNotActivatedException } from '../../common/exceptions/EmailNotActivatedException';
import { WrongCredentialException } from '../../common/exceptions/WrongCredentialException';
import { JwtTokenUser } from '../../common/types/jwtTokenUser';
import { HashPassword } from '../../common/utils/password';
import { PrismaService } from '../../prisma.services';
import { GetUserTokenDto } from '../dto/get-token-user.dto';

@QueryHandler(GetUserTokenDto)
export class GetUserTokenHandler implements IQueryHandler<GetUserTokenDto> {
  constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService) {}

  execute(query: GetUserTokenDto): Promise<string> {
    return new Promise((resolve, reject) => {
      this.prisma.user
        .findFirst({
          where: {
            email: { contains: query.email },
          },
          include: { credential: true },
        })
        .then((user) => {
          if (user) {
            if (!user.email_confirmed) {
              return reject(new EmailNotActivatedException());
            }
            if (!HashPassword.matchHashedPassword(query.password, user.credential.hash)) {
              return reject(new WrongCredentialException());
            }
            const payload: JwtTokenUser = {
              id: user.id,
              username: user.email,
            };
            return resolve(this.jwtService.sign(payload, {}));
          } else {
            return reject(new WrongCredentialException());
          }
        })
        .catch(reject);
    });
  }
}
