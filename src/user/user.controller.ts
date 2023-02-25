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
import { EndpointIsPublic } from 'src/common/decorators/publicEndpoint.decorator';
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
  async find(@Query() findUserDto: FindUserDto, @Req() req: Request) {
    throw new NotImplementedException();
  }

  @Get(':id')
  async findUnique(@Param('id', ParseIntPipe) id, @Req() req: Request) {
    throw new NotImplementedException();
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
  async update(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    throw new NotImplementedException();
  }

  @Delete()
  @UsePipes(new ValidationPipe({ transform: true }))
  async delete(@Body() deleteUserDto: DeleteUserDto, @Req() req: Request) {
    throw new NotImplementedException();
  }

  @Post('validate')
  async userValidateToken(@Req() req: Request) {
    throw new NotImplementedException();
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
