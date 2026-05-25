import { PrismaClient, BookingStatus, NotificationType } from '@prisma/client';
import type { User, TutorProfile, Booking } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date;
}

function atHour(date: Date, hour: number, minute = 0): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);

  return result;
}

interface SeededUsers {
  admin: User;
  ivan: User;
  maria: User;
  alex: User;
  elena: User;
  georgi: User;
  sofia: User;
  petar: User;
}

interface SeededTutorProfiles {
  elena: TutorProfile;
  georgi: TutorProfile;
  sofia: TutorProfile;
  petar: TutorProfile;
}

interface SeededBookings {
  booking1: Booking;
  booking2: Booking;
  booking3: Booking;
  booking4: Booking;
  booking5: Booking;
  booking6: Booking;
  booking7: Booking;
  booking8: Booking;
}

async function seedUsers(hashedPassword: string): Promise<SeededUsers> {
  console.log('Seeding users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@learniteasy.com' },
    update: {},
    create: {
      email: 'admin@learniteasy.com',
      password: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: { firstName: 'Admin', lastName: 'User' },
      },
    },
  });

  const ivan = await prisma.user.upsert({
    where: { email: 'ivan.petrov@student.com' },
    update: {},
    create: {
      email: 'ivan.petrov@student.com',
      password: hashedPassword,
      role: 'STUDENT',
      profile: {
        create: {
          firstName: 'Иван',
          lastName: 'Петров',
          bio: 'Студент по компютърни науки. Търся помощ по математика и програмиране.',
        },
      },
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: 'maria.georgieva@student.com' },
    update: {},
    create: {
      email: 'maria.georgieva@student.com',
      password: hashedPassword,
      role: 'STUDENT',
      profile: {
        create: {
          firstName: 'Мария',
          lastName: 'Георгиева',
          bio: 'Ученичка в 11 клас. Подготвям се за матура по математика.',
        },
      },
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: 'alex.dimitrov@student.com' },
    update: {},
    create: {
      email: 'alex.dimitrov@student.com',
      password: hashedPassword,
      role: 'STUDENT',
      profile: {
        create: {
          firstName: 'Александър',
          lastName: 'Димитров',
          bio: 'Самоук програмист. Искам да подобря уменията си по алгоритми.',
        },
      },
    },
  });

  const elena = await prisma.user.upsert({
    where: { email: 'elena.todorova@tutor.com' },
    update: {},
    create: {
      email: 'elena.todorova@tutor.com',
      password: hashedPassword,
      role: 'TUTOR',
      profile: {
        create: {
          firstName: 'Елена',
          lastName: 'Тодорова',
          bio: 'Математик с 10 години опит. Специализирам в подготовка за матура и кандидат-студентски изпити.',
        },
      },
    },
  });

  const georgi = await prisma.user.upsert({
    where: { email: 'georgi.ivanov@tutor.com' },
    update: {},
    create: {
      email: 'georgi.ivanov@tutor.com',
      password: hashedPassword,
      role: 'TUTOR',
      profile: {
        create: {
          firstName: 'Георги',
          lastName: 'Иванов',
          bio: 'Старши софтуерен инженер с опит в React, Node.js и Python. Обичам да обяснявам сложни концепции просто.',
        },
      },
    },
  });

  const sofia = await prisma.user.upsert({
    where: { email: 'sofiya.nikolova@tutor.com' },
    update: {},
    create: {
      email: 'sofiya.nikolova@tutor.com',
      password: hashedPassword,
      role: 'TUTOR',
      profile: {
        create: {
          firstName: 'София',
          lastName: 'Николова',
          bio: 'Физик и преподавател. Помагам на ученици да разберат физиката от основи до олимпийско ниво.',
        },
      },
    },
  });

  const petar = await prisma.user.upsert({
    where: { email: 'petar.stoyanov@tutor.com' },
    update: {},
    create: {
      email: 'petar.stoyanov@tutor.com',
      password: hashedPassword,
      role: 'TUTOR',
      profile: {
        create: {
          firstName: 'Петър',
          lastName: 'Стоянов',
          bio: 'Английски филолог и преводач. Преподавам английски за всички нива — от начинаещи до бизнес английски.',
        },
      },
    },
  });

  console.log('Users seeded.');

  return { admin, ivan, maria, alex, elena, georgi, sofia, petar };
}

async function seedAvailabilitySlot(
  tutorProfileId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): Promise<void> {
  const existing = await prisma.availability.findFirst({
    where: { tutorId: tutorProfileId, dayOfWeek },
  });

  if (!existing) {
    await prisma.availability.create({
      data: { tutorId: tutorProfileId, dayOfWeek, startTime, endTime },
    });
  }
}

async function seedTutorProfiles(
  users: SeededUsers,
): Promise<SeededTutorProfiles> {
  console.log('Seeding tutor profiles...');

  const elena = await prisma.tutorProfile.upsert({
    where: { userId: users.elena.id },
    update: {},
    create: {
      userId: users.elena.id,
      subjects: ['Математика', 'Статистика', 'Линейна алгебра'],
      hourlyRate: 35,
      bio: 'Математик с 10 години опит. Специализирам в подготовка за матура и кандидат-студентски изпити.',
      isApproved: true,
    },
  });

  await seedAvailabilitySlot(elena.id, 1, '09:00', '17:00');
  await seedAvailabilitySlot(elena.id, 3, '09:00', '17:00');
  await seedAvailabilitySlot(elena.id, 5, '09:00', '17:00');
  await seedAvailabilitySlot(elena.id, 6, '10:00', '14:00');

  const georgi = await prisma.tutorProfile.upsert({
    where: { userId: users.georgi.id },
    update: {},
    create: {
      userId: users.georgi.id,
      subjects: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
      hourlyRate: 50,
      bio: 'Старши софтуерен инженер с опит в React, Node.js и Python. Обичам да обяснявам сложни концепции просто.',
      isApproved: true,
    },
  });

  await seedAvailabilitySlot(georgi.id, 2, '18:00', '21:00');
  await seedAvailabilitySlot(georgi.id, 4, '18:00', '21:00');
  await seedAvailabilitySlot(georgi.id, 6, '10:00', '18:00');
  await seedAvailabilitySlot(georgi.id, 0, '10:00', '16:00');

  const sofia = await prisma.tutorProfile.upsert({
    where: { userId: users.sofia.id },
    update: {},
    create: {
      userId: users.sofia.id,
      subjects: ['Физика', 'Астрономия', 'Математика'],
      hourlyRate: 30,
      bio: 'Физик и преподавател. Помагам на ученици да разберат физиката от основи до олимпийско ниво.',
      isApproved: true,
    },
  });

  await seedAvailabilitySlot(sofia.id, 1, '14:00', '18:00');
  await seedAvailabilitySlot(sofia.id, 3, '14:00', '18:00');
  await seedAvailabilitySlot(sofia.id, 6, '09:00', '13:00');

  const petar = await prisma.tutorProfile.upsert({
    where: { userId: users.petar.id },
    update: {},
    create: {
      userId: users.petar.id,
      subjects: ['Английски език', 'Бизнес английски', 'IELTS подготовка'],
      hourlyRate: 25,
      bio: 'Английски филолог и преводач. Преподавам английски за всички нива — от начинаещи до бизнес английски.',
      isApproved: true,
    },
  });

  await seedAvailabilitySlot(petar.id, 1, '10:00', '14:00');
  await seedAvailabilitySlot(petar.id, 2, '10:00', '14:00');
  await seedAvailabilitySlot(petar.id, 4, '10:00', '14:00');
  await seedAvailabilitySlot(petar.id, 5, '10:00', '14:00');

  console.log('Tutor profiles seeded.');

  return { elena, georgi, sofia, petar };
}

async function findOrCreateBooking(
  studentId: string,
  tutorId: string,
  startTime: Date,
  endTime: Date,
  status: BookingStatus,
  subject: string,
  notes: string,
): Promise<Booking> {
  const existing = await prisma.booking.findFirst({
    where: { studentId, tutorId, startTime },
  });
  if (existing) {
    return existing;
  }

  return prisma.booking.create({
    data: { studentId, tutorId, startTime, endTime, status, subject, notes },
  });
}

async function seedBookings(
  users: SeededUsers,
  tutorProfiles: SeededTutorProfiles,
): Promise<SeededBookings> {
  console.log('Seeding bookings...');

  const booking1 = await findOrCreateBooking(
    users.ivan.id,
    tutorProfiles.elena.id,
    atHour(daysAgo(7), 10),
    atHour(daysAgo(7), 11),
    BookingStatus.COMPLETED,
    'Математика',
    'Диференциално смятане — производни и интеграли',
  );

  const booking2 = await findOrCreateBooking(
    users.ivan.id,
    tutorProfiles.georgi.id,
    atHour(daysAgo(3), 18),
    atHour(daysAgo(3), 19, 30),
    BookingStatus.COMPLETED,
    'React',
    'React hooks и управление на state',
  );

  const booking3 = await findOrCreateBooking(
    users.maria.id,
    tutorProfiles.elena.id,
    atHour(daysAgo(5), 9),
    atHour(daysAgo(5), 10),
    BookingStatus.COMPLETED,
    'Математика',
    'Подготовка за матура — геометрия',
  );

  const booking4 = await findOrCreateBooking(
    users.maria.id,
    tutorProfiles.sofia.id,
    atHour(daysAgo(2), 14),
    atHour(daysAgo(2), 15),
    BookingStatus.CONFIRMED,
    'Физика',
    'Механика — закони на Нютон',
  );

  const booking5 = await findOrCreateBooking(
    users.alex.id,
    tutorProfiles.georgi.id,
    atHour(daysFromNow(1), 18),
    atHour(daysFromNow(1), 19, 30),
    BookingStatus.CONFIRMED,
    'TypeScript',
    'Generics и advanced типове',
  );

  const booking6 = await findOrCreateBooking(
    users.ivan.id,
    tutorProfiles.petar.id,
    atHour(daysFromNow(3), 10),
    atHour(daysFromNow(3), 11),
    BookingStatus.PENDING,
    'Английски език',
    'Подготовка за интервю на английски',
  );

  const booking7 = await findOrCreateBooking(
    users.alex.id,
    tutorProfiles.elena.id,
    atHour(daysAgo(10), 10),
    atHour(daysAgo(10), 11, 30),
    BookingStatus.CANCELLED,
    'Линейна алгебра',
    'Матрици и вектори',
  );

  const booking8 = await findOrCreateBooking(
    users.maria.id,
    tutorProfiles.petar.id,
    atHour(daysFromNow(5), 10),
    atHour(daysFromNow(5), 12),
    BookingStatus.PENDING,
    'IELTS подготовка',
    'Writing section практика',
  );

  console.log('Bookings seeded.');
  return {
    booking1,
    booking2,
    booking3,
    booking4,
    booking5,
    booking6,
    booking7,
    booking8,
  };
}

async function seedReviews(bookings: SeededBookings): Promise<void> {
  console.log('Seeding reviews...');

  await prisma.review.upsert({
    where: { bookingId: bookings.booking1.id },
    update: {},
    create: {
      bookingId: bookings.booking1.id,
      rating: 5,
      comment:
        'Елена е невероятна учителка! Обяснява много ясно и търпеливо. Препоръчвам я на всеки.',
    },
  });

  await prisma.review.upsert({
    where: { bookingId: bookings.booking2.id },
    update: {},
    create: {
      bookingId: bookings.booking2.id,
      rating: 5,
      comment:
        'Георги има дълбоки познания и умее да ги предаде. Много практичен подход.',
    },
  });

  await prisma.review.upsert({
    where: { bookingId: bookings.booking3.id },
    update: {},
    create: {
      bookingId: bookings.booking3.id,
      rating: 4,
      comment:
        'Много добър урок. Разбрах геометрията много по-добре след него.',
    },
  });

  console.log('Reviews seeded.');
}

async function seedConversationMessages(
  conversationId: string,
  messages: Array<{ senderId: string; content: string; minutesOffset: number }>,
  baseTime: Date,
): Promise<void> {
  const existingCount = await prisma.message.count({
    where: { conversationId },
  });
  if (existingCount > 0) {
    return;
  }

  for (const message of messages) {
    const createdAt = new Date(
      baseTime.getTime() + message.minutesOffset * 60 * 1_000,
    );

    await prisma.message.create({
      data: {
        conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt,
      },
    });
  }
}

async function seedMessages(users: SeededUsers): Promise<void> {
  console.log('Seeding messages...');

  const conversation1 = await prisma.conversation.upsert({
    where: {
      studentId_tutorId: { studentId: users.ivan.id, tutorId: users.georgi.id },
    },
    update: {},
    create: { studentId: users.ivan.id, tutorId: users.georgi.id },
  });

  await seedConversationMessages(
    conversation1.id,
    [
      {
        senderId: users.ivan.id,
        content:
          'Здравейте! Интересувам се от уроци по React. Имате ли свободно място за следващата седмица?',
        minutesOffset: 0,
      },
      {
        senderId: users.georgi.id,
        content:
          'Здравейте, Иван! Да, имам свободно в събота от 10 до 12. Подхожда ли ви?',
        minutesOffset: 5,
      },
      {
        senderId: users.ivan.id,
        content:
          'Перфектно! Ще резервирам. Аз съм начинаещ — ще ни отнеме ли повече уроци за основите?',
        minutesOffset: 12,
      },
      {
        senderId: users.georgi.id,
        content:
          'Не се притеснявайте. Ще направим оценка на нивото ви в първия урок и ще планираме заедно. До събота!',
        minutesOffset: 20,
      },
      {
        senderId: users.ivan.id,
        content: 'Страхотно, благодаря! До събота!',
        minutesOffset: 22,
      },
    ],
    daysAgo(2),
  );

  const conversation2 = await prisma.conversation.upsert({
    where: {
      studentId_tutorId: { studentId: users.maria.id, tutorId: users.elena.id },
    },
    update: {},
    create: { studentId: users.maria.id, tutorId: users.elena.id },
  });

  await seedConversationMessages(
    conversation2.id,
    [
      {
        senderId: users.maria.id,
        content:
          'Здравейте! Подготвям се за матура по математика. Можете ли да ми помогнете?',
        minutesOffset: 0,
      },
      {
        senderId: users.elena.id,
        content:
          'Здравейте, Мария! Разбира се. Кои теми ви затрудняват най-много?',
        minutesOffset: 3,
      },
      {
        senderId: users.maria.id,
        content:
          'Основно геометрията и тригонометрията. Алгебрата ми е по-добре.',
        minutesOffset: 8,
      },
      {
        senderId: users.elena.id,
        content:
          'Добре. Предлагам да започнем с геометрията и да преминем систематично. Имам специална програма за подготовка за матура.',
        minutesOffset: 15,
      },
      {
        senderId: users.maria.id,
        content: 'Звучи чудесно! Резервирах час за следващата седмица.',
        minutesOffset: 20,
      },
      {
        senderId: users.elena.id,
        content: 'Видях го. Ще се подготвя специално за вас. До скоро!',
        minutesOffset: 25,
      },
    ],
    daysAgo(1),
  );

  console.log('Messages seeded.');
}

async function seedUserNotifications(
  userId: string,
  notifications: Array<{
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
  }>,
): Promise<void> {
  const existingCount = await prisma.notification.count({ where: { userId } });
  if (existingCount > 0) {
    return;
  }

  for (const notification of notifications) {
    await prisma.notification.create({ data: { userId, ...notification } });
  }
}

async function seedNotifications(users: SeededUsers): Promise<void> {
  console.log('Seeding notifications...');

  await seedUserNotifications(users.ivan.id, [
    {
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Резервацията е потвърдена',
      body: 'Вашият урок по React с Георги Иванов е потвърден.',
      isRead: true,
    },
    {
      type: NotificationType.NEW_MESSAGE,
      title: 'Ново съобщение',
      body: 'Георги Иванов ви изпрати съобщение.',
      isRead: true,
    },
    {
      type: NotificationType.BOOKING_CREATED,
      title: 'Нова резервация',
      body: 'Резервирахте урок по Английски език с Петър Стоянов.',
      isRead: false,
    },
  ]);

  await seedUserNotifications(users.maria.id, [
    {
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Резервацията е потвърдена',
      body: 'Вашият урок по Физика с София Николова е потвърден.',
      isRead: false,
    },
    {
      type: NotificationType.NEW_MESSAGE,
      title: 'Ново съобщение',
      body: 'Елена Тодорова ви изпрати съобщение.',
      isRead: false,
    },
    {
      type: NotificationType.REVIEW_RECEIVED,
      title: 'Нов отзив',
      body: 'Получихте нов отзив за урок по Математика.',
      isRead: true,
    },
  ]);

  await seedUserNotifications(users.georgi.id, [
    {
      type: NotificationType.BOOKING_CREATED,
      title: 'Нова заявка',
      body: 'Иван Петров резервира урок по TypeScript.',
      isRead: false,
    },
    {
      type: NotificationType.BOOKING_CREATED,
      title: 'Нова заявка',
      body: 'Александър Димитров резервира урок по TypeScript.',
      isRead: true,
    },
  ]);

  await seedUserNotifications(users.elena.id, [
    {
      type: NotificationType.BOOKING_CREATED,
      title: 'Нова заявка',
      body: 'Мария Георгиева резервира урок по Математика.',
      isRead: false,
    },
    {
      type: NotificationType.REVIEW_RECEIVED,
      title: 'Нов отзив',
      body: 'Иван Петров остави 5-звезден отзив.',
      isRead: false,
    },
    {
      type: NotificationType.REVIEW_RECEIVED,
      title: 'Нов отзив',
      body: 'Мария Георгиева остави 4-звезден отзив.',
      isRead: true,
    },
  ]);

  await seedUserNotifications(users.alex.id, [
    {
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Резервацията е потвърдена',
      body: 'Вашият урок по TypeScript с Георги Иванов е потвърден.',
      isRead: false,
    },
  ]);

  console.log('Notifications seeded.');
}

async function main(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    console.log('Skipping seed in production environment.');
    process.exit(0);
  }

  console.log('Starting database seed...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const users = await seedUsers(hashedPassword);
  const tutorProfiles = await seedTutorProfiles(users);
  const bookings = await seedBookings(users, tutorProfiles);

  await seedReviews(bookings);
  await seedMessages(users);
  await seedNotifications(users);

  console.log('Database seed completed successfully!');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
