// import { INestApplication } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { JwtModule, JwtService } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { Test, TestingModule } from '@nestjs/testing';
// import { JwtStrategy } from '../common/strategies/jwt.strategy';
// import { PrismaService } from '../prisma.services';
// import { UserController } from './user.controller';
// // import { UserService } from './user.service';
// import { User } from '@prisma/client';
// import { JwtTokenUser } from '../common/types/jwtTokenUser';
// import { WrongCredentialException } from '../common/exceptions/WrongCredentialException';

// describe('UserController', () => {
//   let userController: UserController;
//   // let userService: UserService;
//   let jwtService: JwtService;
//   let app: INestApplication;

//   const mockUser: User = {
//     id: 1,
//     name: 'testuser',
//     email: 'password',
//     email_confirmed: true,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     credentialId: 0,
//     email_activation_code: '',
//     is_admin: false,
//     is_deleted: false,
//   };
//   const mockAdmin: User = {
//     id: 2,
//     name: 'testuser',
//     email: 'password',
//     email_confirmed: true,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     credentialId: 0,
//     email_activation_code: '',
//     is_admin: true,
//     is_deleted: false,
//   };

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

//   afterAll(async () => {
//     await app.close();
//   });

//   beforeAll(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [UserController],
//       imports: [
//         PassportModule,
//         JwtModule.register({
//           secret: 'JWT_SECRET',
//           signOptions: {
//             expiresIn: '1year',
//             algorithm: 'HS256',
//           },
//         }),
//       ],
//       providers: [UserService, PrismaService, JwtStrategy, ConfigService],
//     })
//       .overrideProvider(UserService)
//       .useValue(mockUserService)

//       .compile();

//     app = module.createNestApplication();
//     await app.init();

//     userService = module.get<UserService>(UserService);
//     userController = module.get<UserController>(UserController);
//     jwtService = module.get<JwtService>(JwtService);
//   });

//   it('should be defined', () => {
//     expect(userController).toBeDefined();
//     expect(userService).toBeDefined();
//   });

//   describe('validate', () => {
//     it('should return true on valid user', async () => {
//       jest.spyOn(userService, 'validateToken').mockResolvedValueOnce({ a: 2 } as any);
//       const result = await userController.userValidateToken({ headers: { authorization: 'Bearer TOKEN' } } as any);
//       expect(result).toBe(true);
//     });

//     it('should return false on not valid user', async () => {
//       jest.spyOn(userService, 'validateToken').mockRejectedValueOnce(null);
//       const result = await userController.userValidateToken({ headers: { authorization: 'Bearer TOKEN' } } as any);

//       expect(result).toBe(false);
//     });
//   });

//   describe('authenticate', () => {
//     it('should return token on valid user', async () => {
//       jest.spyOn(userService, 'authenticate').mockResolvedValueOnce(true);
//       const result = await userController.userAuthenticate({} as any);
//       expect(result).toEqual({ credentials: true });
//     });

//     it('should return WrongCredentialException on', async () => {
//       const error = new WrongCredentialException();
//       jest.spyOn(userService, 'authenticate').mockRejectedValueOnce(error);
//       await expect(userController.userAuthenticate({} as any)).rejects.toBe(error);
//     });
//   });

//   describe('userGetToken', () => {
//     it('should return token on valid user', async () => {
//       const token: JwtTokenUser = {
//         id: 1,
//         username: 'email',
//       };
//       jest.spyOn(userService, 'authenticateAndGetJwtToken').mockResolvedValueOnce(token);
//       const result = await userController.userGetToken({} as any);
//       expect(result).toEqual({ token });
//     });

//     it('should return WrongCredentialException on', async () => {
//       const error = new WrongCredentialException();
//       jest.spyOn(userService, 'authenticateAndGetJwtToken').mockRejectedValueOnce(error);
//       await expect(userController.userGetToken({} as any)).rejects.toBe(error);
//     });
//   });
// });
