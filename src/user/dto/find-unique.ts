import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FindUniqueDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  includeCredentials = false;

  constructor(id: number, includeCredentials: boolean) {
    this.id = id;
    this.includeCredentials = includeCredentials;
  }
}
