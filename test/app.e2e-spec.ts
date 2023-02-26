import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../src/common/strategies/jwt.strategy';
import { PrismaService } from '../src/prisma.services';
import { UserController } from '../src/user/user.controller';
import { UserService } from '../src/user/user.service';
import { User } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/_health (GET)', () => {
    return request(app.getHttpServer()).get('/api/_health').expect(200).expect('OK');
  });
});

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;
  let jwtService: JwtService;
  let app: INestApplication;
  let userAuthorization = '';
  let adminAuthorization = '';

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

  const mockUserService = {
    find: jest.fn((it) => {
      return Promise.resolve(it);
    }),
    findUnique: jest.fn((id) => {
      if (id.id == 1) return Promise.resolve(mockUser);
      else return Promise.resolve(mockAdmin);
    }),
    create: jest.fn((createUserDto) => Promise.resolve({ ...createUserDto, ...mockUser })),
    update: jest.fn((updateUserDto) => Promise.resolve({ ...updateUserDto, ...mockUser })),
    delete: jest.fn((deleteUserDto) => Promise.resolve({ ...deleteUserDto, ...mockUser })),
    validateToken: jest.fn(() => Promise.resolve()),
    authenticate: jest.fn(() => Promise.resolve(mockUser)),
    authenticateAndGetJwtToken: jest.fn(() => Promise.resolve('token')),
  };

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'JWT_SECRET',
          signOptions: {
            expiresIn: '1year',
            algorithm: 'HS256',
          },
        }),
      ],
      providers: [UserService, PrismaService, JwtStrategy, ConfigService],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)

      .compile();

    app = module.createNestApplication();
    await app.init();

    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
    jwtService = module.get<JwtService>(JwtService);

    userAuthorization =
      'Bearer ' +
      jwtService.sign({
        id: 1,
        username: 'user',
      });
    adminAuthorization =
      'Bearer ' +
      jwtService.sign({
        id: 2,
        username: 'admin',
      });
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('EndpointRestrictedAccess decorator', () => {
    it('should return 200 > query check >  "User" try access to all entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ ids: [1, 2, 3] })
        .set('Authorization', userAuthorization)
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject({ ids: [1] });
    });

    it('should return 200 > query check >  "User" try access without mention ids', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', userAuthorization)
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject({ ids: [1] });
    });

    it('should return 200 > query check > "Admin" access to all entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ ids: [1, 2, 3] })
        .set('Authorization', adminAuthorization)
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject({ ids: [1, 2, 3] });
    });

    it('should return 401 > param check > "User" try access to other entity', async () => {
      await request(app.getHttpServer())
        .get('/user/2')
        .set('Authorization', userAuthorization)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 > param check > "User" try access its own entity', async () => {
      await request(app.getHttpServer()).get('/user/1').set('Authorization', userAuthorization).expect(HttpStatus.OK);
    });

    it('should return 200 > param check > "admin" try access to other entity', async () => {
      await request(app.getHttpServer()).get('/user/1').set('Authorization', adminAuthorization).expect(HttpStatus.OK);
    });

    it('should return 200 > param check > "admin" try access its-own entity', async () => {
      await request(app.getHttpServer()).get('/user/2').set('Authorization', adminAuthorization).expect(HttpStatus.OK);
    });

    it('should return 200 > body check > "user" try access to update entity', async () => {
      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', userAuthorization)
        .send({ id: 1 })
        .expect(HttpStatus.OK);
    });

    it('should return 200 > body check > "user" try access to update other entity', async () => {
      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', userAuthorization)
        .send({ id: 2 })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 200 > body check > "admin" try access to update entity', async () => {
      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', adminAuthorization)
        .send({ id: 2 })
        .expect(HttpStatus.OK);
    });

    it('should return 200 > body check > "admin" try access to update other entity', async () => {
      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', adminAuthorization)
        .send({ id: 1 })
        .expect(HttpStatus.OK);
    });
  });

  describe('EndpointIsPublic decorator', () => {
    it('should return 200 > without authorization', async () => {
      await request(app.getHttpServer())
        .post('/user/authenticate')
        // .set('Authorization', userAuthorization)
        .expect(HttpStatus.OK);
    });

    it('should return 200 > with admin authorization', async () => {
      await request(app.getHttpServer())
        .post('/user/authenticate')
        .set('Authorization', adminAuthorization)
        .expect(HttpStatus.OK);
    });

    it('should return 200 > with user authorization', async () => {
      await request(app.getHttpServer())
        .post('/user/authenticate')
        .set('Authorization', userAuthorization)
        .expect(HttpStatus.OK);
    });
  });
  describe('Authorization check', () => {
    it('should return 401 > Request without token', async () => {
      await request(app.getHttpServer()).get('/user').expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 200 > User authorization', async () => {
      await request(app.getHttpServer()).get('/user').set('Authorization', userAuthorization).expect(HttpStatus.OK);
    });
    it('should return 200> Admin authorization', async () => {
      await request(app.getHttpServer()).get('/user').set('Authorization', adminAuthorization).expect(HttpStatus.OK);
    });
  });
});
