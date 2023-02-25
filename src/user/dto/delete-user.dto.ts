import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class DeleteUserDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
