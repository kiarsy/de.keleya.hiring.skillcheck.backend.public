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
  NotImplementedException,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';
import {
  EndpointIsPublic,
  EndpointRestrictedAccess,
  RestrictedAccessMethod,
} from 'src/common/decorators/publicEndpoint.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointRestrictedAccess('ids', RestrictedAccessMethod.query)
  async find(@Query() findUserDto: FindUserDto) {
    return this.usersService.find(findUserDto);
  }

  @Get(':id')
  @EndpointRestrictedAccess('id', RestrictedAccessMethod.params, false)
  async findUnique(@Param('id', ParseIntPipe) id) {
    return this.usersService.findUnique({ id: id });
  }

  @Post()
  @EndpointIsPublic()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch()
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointRestrictedAccess('id', RestrictedAccessMethod.body, false)
  async update(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    return this.usersService.update(updateUserDto);
  }

  @Delete()
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointRestrictedAccess('id', RestrictedAccessMethod.body, false)
  async delete(@Body() deleteUserDto: DeleteUserDto, @Req() req: Request) {
    return this.usersService.delete(deleteUserDto);
  }

  @Post('validate')
  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  async userValidateToken(@Req() req: Request) {
    return new Promise((resolve) => {
      this.usersService
        .validateToken(ExtractJwt.fromAuthHeaderAsBearerToken()(req))
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }
  @Post('authenticate')
  @EndpointIsPublic()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async userAuthenticate(@Body() authenticateUserDto: AuthenticateUserDto) {
    return new Promise((resolve, reject) => {
      this.usersService
        .authenticate(authenticateUserDto)
        .then((it) =>
          resolve({
            credentials: it,
          }),
        )
        .catch((e) => reject(e));
    });
  }

  @Post('token')
  @UsePipes(new ValidationPipe({ transform: true }))
  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  async userGetToken(@Body() authenticateUserDto: AuthenticateUserDto) {
    return new Promise((resolve, reject) => {
      this.usersService
        .authenticateAndGetJwtToken(authenticateUserDto)
        .then((it) =>
          resolve({
            token: it,
          }),
        )
        .catch(reject);
    });
  }
}
