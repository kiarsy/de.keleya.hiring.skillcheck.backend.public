import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { EndpointRestrictedAccess, RestrictedAccessMethod } from '../common/decorators/RestrictedAccess.decorator';
import { EndpointIsPublic } from '../common/decorators/publicEndpoint.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FindUniqueDto } from './dto/find-unique';
import { ValidateDto } from './dto/validate.dto';
import { GetUserTokenDto } from './dto/get-token-user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointRestrictedAccess('ids', RestrictedAccessMethod.query)
  @HttpCode(HttpStatus.OK)
  async find(@Query() findUserDto: FindUserDto) {
    return this.queryBus.execute(findUserDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @EndpointRestrictedAccess('id', RestrictedAccessMethod.params, true)
  async findUnique(@Param('id', ParseIntPipe) id) {
    return this.queryBus.execute(new FindUniqueDto({ id: id, is_deleted: false }));
  }

  @Post()
  @EndpointIsPublic()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async create(@Body() createUserDto: CreateUserDto) {
    await this.commandBus.execute(createUserDto);
    return this.queryBus.execute(new FindUniqueDto({ email: createUserDto.email, is_deleted: false }));
  }

  @Patch()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  @EndpointRestrictedAccess('id', RestrictedAccessMethod.body, true)
  async update(@Body() updateUserDto: UpdateUserDto) {
    await this.commandBus.execute(updateUserDto);
    return this.queryBus.execute(new FindUniqueDto({ id: updateUserDto.id }));
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointRestrictedAccess('id', RestrictedAccessMethod.body, true)
  async delete(@Body() deleteUserDto: DeleteUserDto) {
    await this.commandBus.execute(deleteUserDto);
    return this.queryBus.execute(new FindUniqueDto({ id: deleteUserDto.id })).then((users) => {
      return { users };
    });
  }

  @Post('validate')
  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  async userValidateToken(@Req() req: Request) {
    return this.queryBus.execute(new ValidateDto(ExtractJwt.fromAuthHeaderAsBearerToken()(req)));
  }

  @Post('authenticate')
  @EndpointIsPublic()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async userAuthenticate(@Body() authenticateUserDto: AuthenticateUserDto) {
    return this.queryBus.execute(authenticateUserDto).then((credentials) => {
      credentials = { ...credentials, credential: undefined };
      return {
        credentials,
      };
    });
  }

  @Post('token')
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  async userGetToken(@Body() authenticateUserDto: GetUserTokenDto) {
    return this.queryBus.execute(authenticateUserDto).then((token) => {
      return { token };
    });
  }
}
