import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { faker } from '@faker-js/faker';
import { Role } from '@prisma/client';
import { response } from 'express';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('/api/v1/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((response) => {
          expect(response.body.status).toBe('ok');
        });
    });
  });

  describe('Auth', () => {
    const user = {
      email: faker.internet.email(),
      password: 'Password123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: Role.STUDENT,
    };

    let accessToken: string;
    let refreshToken: string;

    it('/api/v1/auth/register (POST) - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(user)
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
          accessToken = response.body.accessToken;
          refreshToken = response.body.refreshToken;
        });
    });

    it('/api/v1/auth/register (POST) - should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(user)
        .expect(409);
    });

    it('/api/v1/auth/login (POST) - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
        });
    });

    it('/api/v1/auth/login (POST) - should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('/api/v1/auth/refresh (POST) - should return new tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');

          refreshToken = response.body.refreshToken;
        });
    });

    it('/api/v1/users/me (GET) - should return current user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveProperty('email', user.email);
          expect(response.body).toHaveProperty('profile');
        });
    });

    it('/api/v1/users/me (GET) - should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('/api/v1/auth/logout (POST) - should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(201);
    });
  });

  describe('Bookings', () => {
    it('/api/v1/bookings (POST) - should fail without auth', () => {
      return request(app.getHttpServer()).post('/api/v1/bookings').expect(401);
    });

    it('/api/v1/bookings (GET) - should fail without auth', () => {
      return request(app.getHttpServer()).get('/api/v1/bookings').expect(401);
    });

    it('/api/v1/bookings (POST) - should fail with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: Role.STUDENT,
        });

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('Tutors & Bookings', () => {
    const student = {
      email: faker.internet.email(),
      password: 'Password123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: Role.STUDENT,
    };

    const tutor = {
      email: faker.internet.email(),
      password: 'Password123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: Role.TUTOR,
    };

    let studentToken: string;
    let tutorToken: string;
    let tutorProfileId: string;

    beforeAll(async () => {
      const studentResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(student);
      studentToken = studentResponse.body.accessToken;

      const tutorResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(tutor);
      tutorToken = tutorResponse.body.accessToken;
    });

    it('/api/v1/tutors (GET) - should return empty list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tutors')
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/api/v1/tutors/profile (POST) - should create tutor profile', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tutors/profile')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          subjects: ['Mathematics'],
          hourlyRate: 50,
          bio: 'Experienced tutor',
        })
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.isApproved).toBe(false);
          tutorProfileId = response.body.id;
        });
    });

    it('/api/v1/tutors/profile (POST) - should fail with duplicate profile', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tutors/profile')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ subjects: ['Mathematics'], hourlyRate: 50 })
        .expect(409);
    });

    it('/api/v1/tutors/:id/approve (POST) - should fail for non-admin', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tutors/${tutorProfileId}/approve`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(403);
    });

    it('/api/v1/tutors/availability (POST) - should set availability', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tutors/availability')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.dayOfWeek).toBe(1);
        });
    });

    it('/api/v1/tutors/:id/availability (GET) - should get availability', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tutors/${tutorProfileId}/availability`)
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/api/v1/bookings (POST) - should fail without auth', () => {
      return request(app.getHttpServer()).post('/api/v1/bookings').expect(401);
    });

    it('/api/v1/bookings (POST) - should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({})
        .expect(400);
    });

    it('/api/v1/bookings (POST) - should fail booking unapproved tutor', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          tutorId: tutorProfileId,
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
          subject: 'Mathematics',
        })
        .expect(404);
    });

    it('/api/v1/bookings (GET) - should return empty list for student', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
  });

  describe('Reviews', () => {
    it('/api/v1/reviews (POST) - should fail without auth', () => {
      return request(app.getHttpServer()).post('/api/v1/reviews').expect(401);
    });

    it('/api/v1/reviews (POST) - should fail with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: Role.STUDENT,
        });

      return request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .send({})
        .expect(400);
    });

    it('/api/v1/reviews/tutor/:tutorId (GET) - should return empty array for unknown tutor', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/reviews/tutor/${faker.string.uuid()}`)
        .expect(404);
    });
  });

  describe('Messaging', () => {
    it('/api/v1/messages/conversations (GET) - should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/messages/conversations')
        .expect(401);
    });

    it('/api/v1/messages/conversation (POST) - should fail without auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/messages/conversation')
        .expect(401);
    });

    it('/api/v1/messages/conversations (GET) - should return empty list', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: Role.STUDENT,
        });

      return request(app.getHttpServer())
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    it('/api/v1/messages/conversation (POST) - should fail with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: Role.STUDENT,
        });

      return request(app.getHttpServer())
        .post('/api/v1/messages/conversation')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('Notifications', () => {
    it('/api/v1/notifications (GET) - should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/notifications')
        .expect(401);
    });

    it('/api/v1/notifications (GET) - should return empty list', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: Role.STUDENT,
        });

      return request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/api/v1/notifications/unread-count (GET) - should return 0', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: Role.STUDENT,
        });

      return request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveProperty('count', 0);
        });
    });
  });
});
