import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Discount codes API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let campaignId: string;

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

    const campaign = await prisma.campaign.create({
      data: { name: 'Paid Social May' },
    });
    campaignId = campaign.id;
  });

  it('creates, lists, and retrieves discount codes', async () => {
    const expiresAt = '2099-01-01T00:00:00.000Z';

    const percentResponse = await request(app.getHttpServer())
      .post('/discount-codes')
      .send({
        code: 'SOCIAL25',
        campaignId,
        discountType: 'PERCENT',
        discountValue: 25,
        expiresAt,
        usageLimit: 2,
      })
      .expect(201);

    expect(percentResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        code: 'SOCIAL25',
        campaignId,
        discountType: 'PERCENT',
        discountValue: 25,
        currency: null,
        expiresAt,
        usageLimit: 2,
        redemptionCount: 0,
      }),
    );

    const fixedResponse = await request(app.getHttpServer())
      .post('/discount-codes')
      .send({
        code: 'EMAIL10',
        campaignId,
        discountType: 'FIXED',
        discountValue: 10,
        currency: 'USD',
        usageLimit: 5,
      })
      .expect(201);

    expect(fixedResponse.body).toEqual(
      expect.objectContaining({
        code: 'EMAIL10',
        discountType: 'FIXED',
        discountValue: 10,
        currency: 'USD',
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/discount-codes')
      .expect(200);

    expect(listResponse.body).toEqual([
      expect.objectContaining({ code: 'SOCIAL25' }),
      expect.objectContaining({ code: 'EMAIL10' }),
    ]);

    const detailResponse = await request(app.getHttpServer())
      .get(`/discount-codes/${percentResponse.body.id}`)
      .expect(200);

    expect(detailResponse.body).toEqual(
      expect.objectContaining({
        id: percentResponse.body.id,
        code: 'SOCIAL25',
        campaign: expect.objectContaining({ name: 'Paid Social May' }),
      }),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
