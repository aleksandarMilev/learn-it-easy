import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker';
import { Role } from '@prisma/client';

const FUTURE_DAY = '2027-06-15';

function buildSlot(startHour: number, endHour: number): { startTime: string; endTime: string } {
  return {
    startTime: `${FUTURE_DAY}T${String(startHour).padStart(2, '0')}:00:00.000Z`,
    endTime: `${FUTURE_DAY}T${String(endHour).padStart(2, '0')}:00:00.000Z`,
  };
}

describe('Bookings — double-booking prevention (e2e)', () => {
  let app: INestApplication;

  let studentToken: string;
  let tutorProfileId: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: faker.internet.email(),
        password: 'Password123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: Role.ADMIN,
      });
    adminToken = adminRes.body.accessToken;

    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: faker.internet.email(),
        password: 'Password123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: Role.STUDENT,
      });
    studentToken = studentRes.body.accessToken;

    const tutorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: faker.internet.email(),
        password: 'Password123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: Role.TUTOR,
      });
    const tutorToken: string = tutorRes.body.accessToken;

    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/tutors/profile')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ subjects: ['Mathematics'], hourlyRate: 60 });
    tutorProfileId = profileRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/tutors/${tutorProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('tutor double-booking prevention', () => {
    it('should create the first booking successfully', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ tutorId: tutorProfileId, subject: 'Mathematics', ...buildSlot(10, 11) })
        .expect(201);
    });

    it('should reject an overlapping booking for the same tutor with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ tutorId: tutorProfileId, subject: 'Mathematics', ...buildSlot(10, 11, ) })
        .expect(400);
    });

    it('should allow a booking that starts exactly when the previous one ends (adjacent slot)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ tutorId: tutorProfileId, subject: 'Mathematics', ...buildSlot(11, 12) })
        .expect(201);
    });
  });
});
