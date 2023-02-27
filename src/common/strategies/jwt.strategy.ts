import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { isJwtTokenUser } from '../types/jwtTokenUser';
import { EmailNotActivatedException } from '../exceptions/EmailNotActivatedException';
import { QueryBus } from '@nestjs/cqrs';
import { FindUniqueDto } from 'src/user/dto/find-unique';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly queryBus: QueryBus,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload) {
    if (isJwtTokenUser(payload)) {
      const user = await this.queryBus.execute(new FindUniqueDto(payload.id, false));
      // check user activation
      if (user && !user.email_confirmed) throw new EmailNotActivatedException();
      if (user) {
        return user;
      }
    }
    throw new UnauthorizedException();
  }
}
