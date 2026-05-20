import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCampaignDto: CreateCampaignDto) {
    try {
      return await this.prisma.campaign.create({
        data: createCampaignDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Campaign name already exists');
      }

      throw error;
    }
  }

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }
}
