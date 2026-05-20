import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Nuzzle Promotions API')
    .setDescription('Internal API for campaign discount codes and redemptions')
    .setVersion('1.0.0')
    .addTag('campaigns')
    .addTag('discount-codes')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory);
}
