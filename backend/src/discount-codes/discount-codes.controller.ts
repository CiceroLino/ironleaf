import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { DiscountCodesService } from './discount-codes.service';

@ApiTags('discount-codes')
@Controller('discount-codes')
export class DiscountCodesController {
  constructor(private readonly discountCodesService: DiscountCodesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a discount code',
    description:
      'Creates a promotional discount code attached to an existing campaign.',
  })
  @ApiBody({
    type: CreateDiscountCodeDto,
    description: 'Discount code creation payload',
    examples: {
      percentage: {
        summary: 'Percentage discount',
        value: {
          code: 'SUMMER20',
          campaignId: 'cm_campaign_summer',
          discountType: 'PERCENT',
          discountValue: 20,
          expiresAt: '2026-12-31',
          usageLimit: 100,
        },
      },
      fixed: {
        summary: 'Fixed amount discount',
        value: {
          code: 'WELCOME15',
          campaignId: 'cm_campaign_welcome',
          discountType: 'FIXED',
          discountValue: 15,
          currency: 'USD',
          expiresAt: '2026-12-31',
          usageLimit: 50,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Discount code created',
    examples: {
      created: {
        summary: 'Created discount code',
        value: {
          id: 'dc_summer20',
          code: 'SUMMER20',
          campaignId: 'cm_campaign_summer',
          discountType: 'PERCENT',
          discountValue: 20,
          currency: null,
          expiresAt: '2026-12-31T00:00:00.000Z',
          usageLimit: 100,
          redemptionCount: 0,
          createdAt: '2026-05-20T12:00:00.000Z',
          updatedAt: '2026-05-20T12:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid discount code payload' })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  @ApiConflictResponse({ description: 'Discount code already exists' })
  create(@Body() createDiscountCodeDto: CreateDiscountCodeDto) {
    return this.discountCodesService.create(createDiscountCodeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List discount codes',
    description:
      'Returns all discount codes with campaign labels and redemption counts.',
  })
  @ApiOkResponse({
    description: 'Discount code list',
    examples: {
      discountCodes: {
        summary: 'Discount codes',
        value: [
          {
            id: 'dc_summer20',
            code: 'SUMMER20',
            campaignId: 'cm_campaign_summer',
            campaign: { id: 'cm_campaign_summer', name: 'Summer Campaign' },
            discountType: 'PERCENT',
            discountValue: 20,
            currency: null,
            expiresAt: '2026-12-31T00:00:00.000Z',
            usageLimit: 100,
            redemptionCount: 0,
          },
        ],
      },
    },
  })
  findAll() {
    return this.discountCodesService.findAll();
  }

  @Post(':code/redeem')
  @ApiOperation({
    summary: 'Redeem a discount code',
    description:
      'Applies a discount code if it is active and has remaining usage.',
  })
  @ApiParam({
    name: 'code',
    description: 'Alphanumeric code string to redeem',
    example: 'SUMMER20',
  })
  @ApiOkResponse({
    description: 'Discount code redeemed',
    examples: {
      redeemed: {
        summary: 'Successful redemption',
        value: {
          id: 'rdm_summer20_1',
          redeemedAt: '2026-05-20T12:00:00.000Z',
          discountCode: {
            id: 'dc_summer20',
            code: 'SUMMER20',
            redemptionCount: 1,
            usageLimit: 100,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Discount code expired or usage limit reached',
  })
  @ApiNotFoundResponse({ description: 'Discount code not found' })
  redeem(@Param('code') code: string) {
    return this.discountCodesService.redeem(code);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get discount code details',
    description:
      'Returns one discount code by ID with campaign and redemption metadata.',
  })
  @ApiParam({
    name: 'id',
    description: 'Discount code ID',
    example: 'dc_summer20',
  })
  @ApiOkResponse({
    description: 'Discount code detail',
    examples: {
      discountCode: {
        summary: 'Discount code detail',
        value: {
          id: 'dc_summer20',
          code: 'SUMMER20',
          campaignId: 'cm_campaign_summer',
          campaign: { id: 'cm_campaign_summer', name: 'Summer Campaign' },
          discountType: 'PERCENT',
          discountValue: 20,
          currency: null,
          expiresAt: '2026-12-31T00:00:00.000Z',
          usageLimit: 100,
          redemptionCount: 0,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Discount code not found' })
  findOne(@Param('id') id: string) {
    return this.discountCodesService.findOne(id);
  }
}
