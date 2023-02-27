import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserController } from './user.controller';
// import { UserService } from './user.service';
import { User } from '@prisma/client';
import { JwtTokenUser } from '../common/types/jwtTokenUser';
import { WrongCredentialException } from '../common/exceptions/WrongCredentialException';
import { FindUniqueDto } from './dto/find-unique';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import { object } from 'joi';

describe('UserController', () => {
  let userController: UserController;
  // let userService: UserService;
  let jwtService: JwtService;
  let app: INestApplication;

  const mockUser: User = {
    id: 1,
    name: 'testuser',
    email: 'password',
    email_confirmed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    credentialId: 0,
    email_activation_code: '',
    is_admin: false,
    is_deleted: false,
  };
  const mockAdmin: User = {
    id: 2,
    name: 'testuser',
    email: 'password',
    email_confirmed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    credentialId: 0,
    email_activation_code: '',
    is_admin: true,
    is_deleted: false,
  };

  const mockCommandBus = {
    execute: jest.fn(() => {
      return Promise.resolve();
    }),
  };

  const mockQueryBus = {
    execute: jest.fn((dto) => {
      if (dto instanceof FindUniqueDto)
        if (dto.data.id == 1) return Promise.resolve(mockUser);
        else return Promise.resolve(mockAdmin);
      return Promise.resolve(dto);
    }),
  };

  //   const mockUserService = {
  //     find: jest.fn((it) => {
  //       return Promise.resolve(it);
  //     }),
  //     findUnique: jest.fn((id) => {
  //       if (id.id == 1) return Promise.resolve(mockUser);
  //       else return Promise.resolve(mockAdmin);
  //     }),
  //     create: jest.fn((createUserDto) => Promise.resolve({ ...createUserDto, ...mockUser })),
  //     update: jest.fn((updateUserDto) => Promise.resolve({ ...updateUserDto, ...mockUser })),
  //     delete: jest.fn((deleteUserDto) => Promise.resolve({ ...deleteUserDto, ...mockUser })),
  //     validateToken: jest.fn(() => Promise.resolve()),
  //     authenticate: jest.fn(() => Promise.resolve(mockUser)),
  //     authenticateAndGetJwtToken: jest.fn(() => Promise.resolve('token')),
  //   };

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      imports: [
        PassportModule,
        CqrsModule,
        JwtModule.register({
          secret: 'JWT_SECRET',
          signOptions: {
            expiresIn: '1year',
            algorithm: 'HS256',
          },
        }),
      ],
      providers: [
        PrismaService,
        JwtStrategy,
        ConfigService,
        {
          provide: CommandBus,
          useFactory: () => mockCommandBus,
        },
        {
          provide: QueryBus,
          useFactory: () => mockQueryBus,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('authenticate', () => {
    it('should return token on valid user', async () => {
      jest.spyOn(mockQueryBus, 'execute').mockResolvedValueOnce({ a: 1 });
      const result = await userController.userAuthenticate({} as any);
      expect(result).toHaveProperty('credentials');
      expect(result.credentials).toEqual(expect.objectContaining({ a: 1 }));
    });

    it('should return WrongCredentialException on', async () => {
      const error = new WrongCredentialException();
      jest.spyOn(mockQueryBus, 'execute').mockRejectedValueOnce(error);
      await expect(userController.userAuthenticate({} as any)).rejects.toBe(error);
    });
  });

  describe('userGetToken', () => {
    it('should return token on valid user', async () => {
      const token: JwtTokenUser = {
        id: 1,
        username: 'email',
      };
      jest.spyOn(mockQueryBus, 'execute').mockResolvedValueOnce(token);
      const result = await userController.userGetToken({} as any);
      expect(result).toEqual({ token });
    });

    it('should return WrongCredentialException on', async () => {
      const error = new WrongCredentialException();
      jest.spyOn(mockQueryBus, 'execute').mockRejectedValueOnce(error);
      await expect(userController.userGetToken({} as any)).rejects.toBe(error);
    });
  });
});
