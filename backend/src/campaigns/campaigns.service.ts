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

  async usageSummary() {
    const campaigns = await this.prisma.campaign.findMany({
      include: {
        discountCodes: {
          select: {
            id: true,
            code: true,
            redemptionCount: true,
            usageLimit: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            discountCodes: true,
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return campaigns.map((campaign) => ({
      campaign: {
        id: campaign.id,
        name: campaign.name,
      },
      totalDiscountCodes: campaign._count.discountCodes,
      totalRedemptions: campaign._count.redemptions,
      discountCodes: campaign.discountCodes,
    }));
  }
}
