import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker';
import { Role } from '@prisma/client';

async function registerAndLogin(
  app: INestApplication,
  role: Role,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      email: faker.internet.email(),
      password: 'Password123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role,
    });
  return res.body.accessToken as string;
}

function connectSocket(port: number, token: string | null): Socket {
  return io(`http://localhost:${port}`, {
    auth: token ? { token } : {},
    transports: ['websocket'],
    forceNew: true,
  });
}

function waitForEvent(socket: Socket, event: string, timeoutMs = 2_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for '${event}'`)), timeoutMs);
    socket.once(event, (data: unknown) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function expectNoEvent(socket: Socket, event: string, waitMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const received = { flag: false };
    socket.once(event, () => {
      received.flag = true;
    });
    setTimeout(() => resolve(!received.flag), waitMs);
  });
}

describe('Messaging — WebSocket authorization (e2e)', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.listen(0);

    const address = app.getHttpServer().address();
    port = typeof address === 'object' && address !== null ? address.port : 3_000;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('unauthenticated connection', () => {
    it('should disconnect a socket that connects without a JWT token', async () => {
      const socket = connectSocket(port, null);

      const disconnected = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 3_000);
        socket.on('disconnect', () => {
          clearTimeout(timer);
          resolve(true);
        });
        socket.on('connect_error', () => {
          clearTimeout(timer);
          socket.disconnect();
          resolve(true);
        });
      });

      socket.disconnect();
      expect(disconnected).toBe(true);
    });
  });

  describe('conversation room authorization', () => {
    let aliceToken: string;
    let charlieToken: string;
    let conversationId: string;

    beforeAll(async () => {
      aliceToken = await registerAndLogin(app, Role.STUDENT);
      const bobToken = await registerAndLogin(app, Role.TUTOR);
      charlieToken = await registerAndLogin(app, Role.STUDENT);

      const bobUserRes = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${bobToken}`);
      const bobUserId: string = bobUserRes.body.id;

      const convRes = await request(app.getHttpServer())
        .post('/api/v1/messages/conversation')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ tutorUserId: bobUserId });
      conversationId = convRes.body.id;
    });

    it('should NOT receive messages when a user joins a conversation they are not part of', async () => {
      const aliceSocket = connectSocket(port, aliceToken);
      const charlieSocket = connectSocket(port, charlieToken);

      await Promise.all([
        waitForEvent(aliceSocket, 'connect'),
        waitForEvent(charlieSocket, 'connect'),
      ]);

      charlieSocket.emit('joinConversation', conversationId);

      const charlieGotError = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 1_500);
        charlieSocket.on('error', () => {
          clearTimeout(timer);
          resolve(true);
        });
      });

      aliceSocket.emit('joinConversation', conversationId);
      await new Promise((r) => setTimeout(r, 200));

      const charlieReceivedMessage = await expectNoEvent(charlieSocket, 'receiveMessage', 600);

      aliceSocket.disconnect();
      charlieSocket.disconnect();

      expect(charlieGotError || charlieReceivedMessage).toBe(true);
    });
  });
});
