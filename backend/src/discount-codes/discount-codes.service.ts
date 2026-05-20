import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountCode, DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';

type DiscountCodeWithCampaign = DiscountCode & {
  campaign?: {
    id: string;
    name: string;
  };
};

@Injectable()
export class DiscountCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDiscountCodeDto: CreateDiscountCodeDto) {
    await this.ensureCampaignExists(createDiscountCodeDto.campaignId);
    this.validateDiscountCode(createDiscountCodeDto);

    try {
      const discountCode = await this.prisma.discountCode.create({
        data: {
          code: createDiscountCodeDto.code,
          campaignId: createDiscountCodeDto.campaignId,
          discountType: createDiscountCodeDto.discountType,
          discountValue: createDiscountCodeDto.discountValue,
          currency: createDiscountCodeDto.currency ?? null,
          expiresAt: createDiscountCodeDto.expiresAt
            ? new Date(createDiscountCodeDto.expiresAt)
            : null,
          usageLimit: createDiscountCodeDto.usageLimit,
        },
      });

      return this.serializeDiscountCode(discountCode);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Discount code already exists');
      }

      throw error;
    }
  }

  async findAll() {
    const discountCodes = await this.prisma.discountCode.findMany({
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return discountCodes.map((discountCode) =>
      this.serializeDiscountCode(discountCode),
    );
  }

  async findOne(id: string) {
    const discountCode = await this.prisma.discountCode.findUnique({
      where: { id },
      include: { campaign: { select: { id: true, name: true } } },
    });

    if (!discountCode) {
      throw new NotFoundException('Discount code not found');
    }

    return this.serializeDiscountCode(discountCode);
  }

  redeem(code: string) {
    return this.prisma.$transaction(async (tx) => {
      const discountCode = await tx.discountCode.findUnique({
        where: { code },
        include: { campaign: { select: { id: true, name: true } } },
      });

      if (!discountCode) {
        throw new NotFoundException('Discount code not found');
      }

      if (
        discountCode.expiresAt &&
        discountCode.expiresAt.getTime() <= Date.now()
      ) {
        throw new BadRequestException('Discount code has expired');
      }

      if (discountCode.redemptionCount >= discountCode.usageLimit) {
        throw new BadRequestException('Discount code usage limit reached');
      }

      const updatedDiscountCode = await tx.discountCode.update({
        where: { id: discountCode.id },
        data: { redemptionCount: { increment: 1 } },
        include: { campaign: { select: { id: true, name: true } } },
      });

      const redemption = await tx.redemption.create({
        data: {
          discountCodeId: discountCode.id,
          campaignId: discountCode.campaignId,
        },
      });

      return {
        id: redemption.id,
        redeemedAt: redemption.redeemedAt.toISOString(),
        discountCode: this.serializeDiscountCode(updatedDiscountCode),
      };
    });
  }

  private async ensureCampaignExists(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
  }

  private validateDiscountCode(createDiscountCodeDto: CreateDiscountCodeDto) {
    if (
      createDiscountCodeDto.discountType === DiscountType.FIXED &&
      !createDiscountCodeDto.currency
    ) {
      throw new BadRequestException('Fixed discounts require a currency');
    }

    if (
      createDiscountCodeDto.expiresAt &&
      new Date(createDiscountCodeDto.expiresAt).getTime() <= Date.now()
    ) {
      throw new BadRequestException('Expiration date must be in the future');
    }
  }

  private serializeDiscountCode(discountCode: DiscountCodeWithCampaign) {
    return {
      ...discountCode,
      discountValue: Number(discountCode.discountValue),
      expiresAt: discountCode.expiresAt?.toISOString() ?? null,
      createdAt: discountCode.createdAt.toISOString(),
      updatedAt: discountCode.updatedAt.toISOString(),
    };
  }
}
