import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type DiscountCodeResponse = {
  id: string;
  code: string;
  campaignId: string;
  discountType: string;
  discountValue: number;
  currency: string | null;
  expiresAt: string | null;
  usageLimit: number;
  redemptionCount: number;
  campaign?: {
    name: string;
  };
};

type RedemptionResponse = {
  id: string;
  redeemedAt: string;
  discountCode: DiscountCodeResponse;
};

type ErrorResponse = {
  message: string;
};

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
    const percentCode = percentResponse.body as unknown as DiscountCodeResponse;

    expect(typeof percentCode.id).toBe('string');
    expect(percentCode).toMatchObject({
      code: 'SOCIAL25',
      campaignId,
      discountType: 'PERCENT',
      discountValue: 25,
      currency: null,
      expiresAt,
      usageLimit: 2,
      redemptionCount: 0,
    });

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
    const fixedCode = fixedResponse.body as unknown as DiscountCodeResponse;

    expect(fixedCode).toMatchObject({
      code: 'EMAIL10',
      discountType: 'FIXED',
      discountValue: 10,
      currency: 'USD',
    });

    const listResponse = await request(app.getHttpServer())
      .get('/discount-codes')
      .expect(200);
    const discountCodes =
      listResponse.body as unknown as DiscountCodeResponse[];

    expect(discountCodes.map((discountCode) => discountCode.code)).toEqual([
      'SOCIAL25',
      'EMAIL10',
    ]);

    const detailResponse = await request(app.getHttpServer())
      .get(`/discount-codes/${percentCode.id}`)
      .expect(200);
    const discountCodeDetail =
      detailResponse.body as unknown as DiscountCodeResponse;

    expect(discountCodeDetail).toMatchObject({
      id: percentCode.id,
      code: 'SOCIAL25',
      campaign: { name: 'Paid Social May' },
    });
  });

  it('redeems a valid discount code and records usage', async () => {
    await prisma.discountCode.create({
      data: {
        code: 'WELCOME20',
        campaignId,
        discountType: 'PERCENT',
        discountValue: 20,
        usageLimit: 2,
      },
    });

    const redeemResponse = await request(app.getHttpServer())
      .post('/discount-codes/WELCOME20/redeem')
      .expect(201);
    const redemption = redeemResponse.body as unknown as RedemptionResponse;

    expect(typeof redemption.id).toBe('string');
    expect(typeof redemption.redeemedAt).toBe('string');
    expect(redemption.discountCode).toMatchObject({
      code: 'WELCOME20',
      redemptionCount: 1,
    });

    await expect(prisma.redemption.count()).resolves.toBe(1);
  });

  it('rejects expired discount codes without recording usage', async () => {
    await prisma.discountCode.create({
      data: {
        code: 'OLD10',
        campaignId,
        discountType: 'PERCENT',
        discountValue: 10,
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
        usageLimit: 2,
      },
    });

    const expiredResponse = await request(app.getHttpServer())
      .post('/discount-codes/OLD10/redeem')
      .expect(400);
    const expiredError = expiredResponse.body as unknown as ErrorResponse;
    expect(expiredError.message).toBe('Discount code has expired');

    await expect(prisma.redemption.count()).resolves.toBe(0);
  });

  it('rejects discount codes that reached their usage limit', async () => {
    await prisma.discountCode.create({
      data: {
        code: 'LIMITED',
        campaignId,
        discountType: 'FIXED',
        discountValue: 5,
        currency: 'USD',
        usageLimit: 1,
        redemptionCount: 1,
      },
    });

    const limitedResponse = await request(app.getHttpServer())
      .post('/discount-codes/LIMITED/redeem')
      .expect(400);
    const limitedError = limitedResponse.body as unknown as ErrorResponse;
    expect(limitedError.message).toBe('Discount code usage limit reached');

    await expect(prisma.redemption.count()).resolves.toBe(0);
  });

  afterEach(async () => {
    await app.close();
  });
});
