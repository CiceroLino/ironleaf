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

  afterEach(async () => {
    await app.close();
  });
});
