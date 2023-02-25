import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class AuthenticateUserDto {
  @IsString()
  @IsOptional()
  @Type(() => String)
  email: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  password: string;
}
