import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Campaigns API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.redemption.deleteMany();
    await prisma.discountCode.deleteMany();
    await prisma.campaign.deleteMany();
  });

  it('creates and lists campaigns', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/campaigns')
      .send({ name: 'Paid Social May' })
      .expect(201);

    expect(createResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Paid Social May',
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/campaigns')
      .expect(200);

    expect(listResponse.body).toEqual([
      expect.objectContaining({
        id: createResponse.body.id,
        name: 'Paid Social May',
      }),
    ]);
  });

  afterEach(async () => {
    await app.close();
  });
});
