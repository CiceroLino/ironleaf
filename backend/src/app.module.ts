import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampaignsModule } from './campaigns/campaigns.module';
import { DiscountCodesModule } from './discount-codes/discount-codes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, CampaignsModule, DiscountCodesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
