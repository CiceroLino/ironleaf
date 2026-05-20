import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupSwagger } from './../src/swagger';

type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, unknown>;
  components: {
    schemas: Record<
      string,
      {
        required?: string[];
        properties?: Record<
          string,
          {
            description?: string;
            example?: unknown;
            enum?: string[];
            minimum?: number;
          }
        >;
      }
    >;
  };
};

describe('Swagger docs (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    setupSwagger(app);
    await app.init();
  });

  it('serves the OpenAPI JSON document', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);
    const document = response.body as unknown as OpenApiDocument;

    expect(document.openapi).toMatch(/^3\./);
    expect(document.info).toMatchObject({
      title: 'Nuzzle Promotions API',
      version: '1.0.0',
    });
    expect(document.paths).toHaveProperty('/campaigns');
    expect(document.paths).toHaveProperty('/discount-codes');
  });

  it('documents request DTO fields with examples and constraints', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);
    const document = response.body as unknown as OpenApiDocument;

    const campaignSchema = document.components.schemas.CreateCampaignDto;
    const discountCodeSchema =
      document.components.schemas.CreateDiscountCodeDto;

    expect(campaignSchema.required).toContain('name');
    expect(campaignSchema.properties?.name).toMatchObject({
      description: 'Campaign label used to group discount codes',
      example: 'Black Friday',
    });
    expect(discountCodeSchema.properties?.code).toMatchObject({
      description: 'Alphanumeric discount code customers redeem',
      example: 'SUMMER20',
    });
    expect(discountCodeSchema.properties?.discountType).toMatchObject({
      description: 'Whether the discount is percentage based or fixed amount',
      enum: ['PERCENT', 'FIXED'],
      example: 'PERCENT',
    });
    expect(discountCodeSchema.properties?.discountValue).toMatchObject({
      example: 20,
      minimum: 0,
    });
    expect(discountCodeSchema.properties?.currency).toMatchObject({
      example: 'USD',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
