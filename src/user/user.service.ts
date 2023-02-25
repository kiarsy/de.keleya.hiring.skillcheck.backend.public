import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DuplicateEmailAddressException } from 'src/common/exceptions/DuplicateEmailAddressException';
import { EmailNotActivatedException } from 'src/common/exceptions/EmailNotActivatedException';
import { JwtTokenUser } from 'src/common/types/jwtTokenUser';
import { PrismaService } from '../prisma.services';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  /**
   * Finds users with matching fields
   *
   * @param findUserDto
   * @returns User[]
   */
  async find(findUserDto: FindUserDto): Promise<User[]> {
    throw new NotImplementedException();
  }

  /**
   * Finds single User by id, name or email
   *
   * @param whereUnique
   * @returns User
   */
  async findUnique(whereUnique: Prisma.UserWhereUniqueInput, includeCredentials = false): Promise<User> {
    throw new NotImplementedException();
  }

  /**
   * Creates a new user with credentials
   *
   * @param createUserDto
   * @returns result of create
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log(createUserDto);
    return new Promise(async (resolve, reject) => {
      const user = await this.prisma.user.findFirst({
        where: {
          email: { equals: createUserDto.email },
          is_deleted: false,
        },
      });
      if (user) {
        return reject(new DuplicateEmailAddressException());
      }
      this.prisma.user
        .create({
          data: {
            email: createUserDto.email,
            name: createUserDto.name,
            email_activation_code: randomUUID(),
            credential: {
              create: {
                hash: createUserDto.password,
              },
            },
          },
        })
        .then((user) => {
          resolve(user);
        })
        .catch((e) => reject(e));
    });
  }

  /**
   * Updates a user unless it does not exist or has been marked as deleted before
   *
   * @param updateUserDto
   * @returns result of update
   */
  async update(updateUserDto: UpdateUserDto) {
    throw new NotImplementedException();
  }

  /**
   * Deletes a user
   * Function does not actually remove the user from database but instead marks them as deleted by:
   * - removing the corresponding `credentials` row from your db
   * - changing the name to DELETED_USER_NAME constant (default: `(deleted)`)
   * - setting email to NULL
   *
   * @param deleteUserDto
   * @returns results of users and credentials table modification
   */
  async delete(deleteUserDto: DeleteUserDto) {
    throw new NotImplementedException();
  }

  /**
   * Authenticates a user and returns a JWT token
   *
   * @param authenticateUserDto email and password for authentication
   * @returns a JWT token
   */
  async authenticateAndGetJwtToken(authenticateUserDto: AuthenticateUserDto) {
    return new Promise((resolve, reject) => {
      this.prisma.user
        .findFirst({
          where: {
            email: authenticateUserDto.email,
            credential: {
              hash: authenticateUserDto.password,
            },
          },
        })
        .then((user) => {
          if (user) {
            if (!user.email_confirmed) {
              reject(new EmailNotActivatedException());
            }
            const payload: JwtTokenUser = {
              id: user.id,
              username: user.email,
            };
            resolve(this.jwtService.sign(payload, {}));
          } else {
            reject(new NotFoundException('', 'Email/Password is invalid.'));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Authenticates a user
   *
   * @param authenticateUserDto email and password for authentication
   * @returns true or false
   */
  async authenticate(authenticateUserDto: AuthenticateUserDto) {
    return new Promise((resolve, reject) => {
      this.prisma.user
        .findFirst({
          where: {
            email: authenticateUserDto.email,
            credential: {
              hash: authenticateUserDto.password,
            },
          },
        })
        .then((user) => {
          if (user && !user.email_confirmed) reject(new EmailNotActivatedException());
          resolve(user && user.email_confirmed);
        })
        .catch((e) => reject(e));
    });
  }

  /**
   * Validates a JWT token
   *
   * @param token a JWT token
   * @returns the decoded token if valid
   */
  async validateToken(token: string) {
    throw new NotImplementedException();
  }
}
