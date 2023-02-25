import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  @IsOptional()
  @Type(() => String)
  name: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  email: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  password: string;
}
