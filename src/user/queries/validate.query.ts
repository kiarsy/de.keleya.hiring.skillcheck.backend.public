import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenUser } from 'src/common/types/jwtTokenUser';
import { ValidateDto } from '../dto/validate.dto';

@QueryHandler(ValidateDto)
export class ValidateUserHandler implements IQueryHandler<ValidateDto> {
  constructor(private readonly jwtService: JwtService) {} // Here we would inject what is necessary to retrieve our data

  execute(query: ValidateDto): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.jwtService
        .verifyAsync<JwtTokenUser>(query.token, {})
        .then(() => {
          resolve(true);
        })
        .catch(reject);
    });
  }
}
