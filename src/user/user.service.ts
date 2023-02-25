import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DuplicateEmailAddressException } from '../common/exceptions/DuplicateEmailAddressException';
import { EmailNotActivatedException } from '../common/exceptions/EmailNotActivatedException';
import { JwtTokenUser } from '../common/types/jwtTokenUser';
import { hashPasswordSync, matchHashedPassword } from '../common/utils/password';
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
    const userInclude: Prisma.UserInclude = { credential: false };
    const whereUnique: Prisma.UserWhereInput = {
      id: { in: findUserDto.ids },
      is_deleted: false,
    };

    if (findUserDto.name) {
      whereUnique.name = { contains: findUserDto.name };
    }

    if (findUserDto.updatedSince) {
      whereUnique.updatedAt = { gt: findUserDto.updatedSince };
    }

    if (findUserDto.email) {
      whereUnique.email = { contains: findUserDto.email };
    }
    if (findUserDto.credentials) {
      userInclude['credential'] = true;
    }

    return this.prisma.user.findMany({
      skip: findUserDto.offset,
      take: findUserDto.limit,
      where: whereUnique,
      include: userInclude,
    });
  }

  /**
   * Finds single User by id, name or email
   *
   * @param whereUnique
   * @returns User
   */
  async findUnique(whereUnique: Prisma.UserWhereInput, includeCredentials = false): Promise<User> {
    whereUnique = { ...whereUnique, is_deleted: false };
    return new Promise((resolve, reject) => {
      this.prisma.user
        .findFirst({
          where: whereUnique,
          include: {
            credential: includeCredentials,
          },
        })
        .then((user) => {
          if (user) resolve(user);
          else reject(new NotFoundException(undefined, 'User Not found'));
        })
        .catch(reject);
    });
  }

  /**
   * Creates a new user with credentials
   *
   * @param createUserDto
   * @returns result of create
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    return new Promise(async (resolve, reject) => {
      let rowId = 0;
      this.prisma
        .$transaction(async (tx) => {
          // Insert if does not exists
          const affectedRows = await tx.$executeRaw`insert into users (name, email, email_activation_code)
        select ${createUserDto.name},${createUserDto.email},${randomUUID()}
        where not exists (select * from users where email=${createUserDto.email} and is_deleted=0);`;

          if (affectedRows === 0) return reject(new DuplicateEmailAddressException());
          // Select id
          const [row] = (await tx.$queryRaw`SELECT last_insert_rowid() AS id`) as any[];
          rowId = Number(row.id);

          // Insert credentials
          const credentials = await tx.credentials.create({
            data: {
              hash: hashPasswordSync(createUserDto.password),
            },
          });
          // update user
          await tx.user.update({
            where: {
              id: rowId,
            },
            data: {
              credentialId: credentials.id,
            },
          });
        })
        .then(() => {
          // return user
          this.prisma.user
            .findUnique({
              where: { id: rowId },
            })
            .then((user) => {
              resolve(user);
            });
        })
        .catch(reject);
    });
  }

  /**
   * Updates a user unless it does not exist or has been marked as deleted before
   *
   * @param updateUserDto
   * @returns result of update
   */
  async update(updateUserDto: UpdateUserDto): Promise<User> {
    const data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput> = {
      updatedAt: new Date(),
    };

    if (updateUserDto.email) {
      data['email'] = updateUserDto.email;
    }

    if (updateUserDto.name) {
      data['name'] = updateUserDto.name;
    }

    if (updateUserDto.password) {
      data['credential'] = {
        create: {
          hash: hashPasswordSync(updateUserDto.password),
        },
      };
    }

    return new Promise((resolve, reject) => {
      this.prisma.user
        .update({
          where: { id: updateUserDto.id },
          data,
        })
        .then((user) => {
          resolve(user);
        })
        .catch(reject);
    });
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
    return new Promise((resolve, reject) => {
      this.prisma.user
        .update({
          where: { id: deleteUserDto.id },
          data: { is_deleted: true, name: '(deleted)' },
        })
        .then((user) => {
          if (user) {
            resolve({ users: user });
          } else {
            reject(new NotFoundException('User not found.'));
          }
        })
        .catch(reject);
    });
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
            email: { contains: authenticateUserDto.email },
          },
          include: { credential: true },
        })
        .then((user) => {
          if (user) {
            if (!matchHashedPassword(authenticateUserDto.password, user.credential.hash)) {
              return reject(new EmailNotActivatedException());
            }
            if (!user.email_confirmed) {
              return reject(new EmailNotActivatedException());
            }
            const payload: JwtTokenUser = {
              id: user.id,
              username: user.email,
            };
            return resolve(this.jwtService.sign(payload, {}));
          } else {
            return resolve(new NotFoundException('', 'Email/Password is invalid.'));
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
          },
          include: { credential: true },
        })
        .then((user) => {
          if (!matchHashedPassword(authenticateUserDto.password, user.credential.hash)) {
            return reject(new EmailNotActivatedException());
          }
          if (user && !user.email_confirmed) return reject(new EmailNotActivatedException());

          if (user) return resolve((user && user.email_confirmed) ?? false);
          else return reject(new NotFoundException('', 'Email/Password is invalid.'));
        })
        .catch(reject);
    });
  }

  /**
   * Validates a JWT token
   *
   * @param token a JWT token
   * @returns the decoded token if valid
   */
  async validateToken(token: string): Promise<JwtTokenUser> {
    return new Promise((resolve, reject) => {
      this.jwtService
        .verifyAsync<JwtTokenUser>(token, {})
        .then((it) => {
          resolve(it);
        })
        .catch(reject);
    });
  }
}
