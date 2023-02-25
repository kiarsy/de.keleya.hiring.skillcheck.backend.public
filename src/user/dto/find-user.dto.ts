import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class FindUserDto {
  @Transform(({ value }) => value.toString().split(',').map(Number))
  @IsOptional()
  ids: number[];

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  updatedSince?: Date;

  @IsString()
  @IsOptional()
  @Type(() => String)
  name: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  credentials: boolean;

  @IsString()
  @IsOptional()
  @Type(() => String)
  email: string;
}
