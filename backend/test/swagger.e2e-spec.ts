import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupSwagger } from './../src/swagger';

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

    expect(response.body).toEqual(
      expect.objectContaining({
        openapi: expect.stringMatching(/^3\./),
        info: expect.objectContaining({
          title: 'Nuzzle Promotions API',
          version: '1.0.0',
        }),
        paths: expect.objectContaining({
          '/campaigns': expect.any(Object),
          '/discount-codes': expect.any(Object),
        }),
      }),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
