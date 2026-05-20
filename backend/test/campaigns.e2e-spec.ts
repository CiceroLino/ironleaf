import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type CampaignResponse = {
  id: string;
  name: string;
};

type CampaignUsageResponse = Array<{
  campaign: {
    id: string;
    name: string;
  };
  totalDiscountCodes: number;
  totalRedemptions: number;
  discountCodes: Array<{
    code: string;
    redemptionCount: number;
    usageLimit: number;
  }>;
}>;

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
    const createdCampaign = createResponse.body as unknown as CampaignResponse;

    expect(typeof createdCampaign.id).toBe('string');
    expect(createdCampaign.name).toBe('Paid Social May');

    const listResponse = await request(app.getHttpServer())
      .get('/campaigns')
      .expect(200);
    const campaigns = listResponse.body as unknown as CampaignResponse[];

    expect(campaigns).toEqual([
      expect.objectContaining({
        id: createdCampaign.id,
        name: 'Paid Social May',
      }),
    ]);
  });

  it('returns discount-code usage summary across campaigns', async () => {
    const paidSocial = await prisma.campaign.create({
      data: { name: 'Paid Social June' },
    });
    const email = await prisma.campaign.create({
      data: { name: 'Email Retention June' },
    });
    const socialCode = await prisma.discountCode.create({
      data: {
        code: 'SOCIAL30',
        campaignId: paidSocial.id,
        discountType: 'PERCENT',
        discountValue: 30,
        usageLimit: 10,
        redemptionCount: 2,
      },
    });
    await prisma.discountCode.create({
      data: {
        code: 'EMAIL15',
        campaignId: email.id,
        discountType: 'FIXED',
        discountValue: 15,
        currency: 'USD',
        usageLimit: 5,
      },
    });
    await prisma.redemption.createMany({
      data: [
        { campaignId: paidSocial.id, discountCodeId: socialCode.id },
        { campaignId: paidSocial.id, discountCodeId: socialCode.id },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/campaigns/usage-summary')
      .expect(200);
    const usageSummary = response.body as unknown as CampaignUsageResponse;

    expect(usageSummary[0]).toMatchObject({
      campaign: { name: 'Paid Social June' },
      totalDiscountCodes: 1,
      totalRedemptions: 2,
      discountCodes: [
        {
          code: 'SOCIAL30',
          redemptionCount: 2,
          usageLimit: 10,
        },
      ],
    });
    expect(usageSummary[1]).toMatchObject({
      campaign: { name: 'Email Retention June' },
      totalDiscountCodes: 1,
      totalRedemptions: 0,
      discountCodes: [
        {
          code: 'EMAIL15',
          redemptionCount: 0,
          usageLimit: 5,
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
