import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a campaign',
    description:
      'Creates a campaign label that discount codes can be grouped under.',
  })
  @ApiBody({
    type: CreateCampaignDto,
    description: 'Campaign creation payload',
    examples: {
      blackFriday: {
        summary: 'Black Friday campaign',
        value: { name: 'Black Friday' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Campaign created',
    examples: {
      created: {
        summary: 'Created campaign',
        value: {
          id: 'cm_campaign_black_friday',
          name: 'Black Friday',
          createdAt: '2026-05-20T12:00:00.000Z',
          updatedAt: '2026-05-20T12:00:00.000Z',
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'Campaign name already exists' })
  create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(createCampaignDto);
  }

  @Get('usage-summary')
  @ApiOperation({
    summary: 'Get campaign usage summary',
    description:
      'Returns discount-code and redemption totals grouped by campaign.',
  })
  @ApiOkResponse({
    description: 'Campaign usage summary',
    examples: {
      summary: {
        summary: 'Usage grouped by campaign',
        value: [
          {
            campaign: {
              id: 'cm_campaign_black_friday',
              name: 'Black Friday',
            },
            totalDiscountCodes: 2,
            totalRedemptions: 17,
            discountCodes: [
              { id: 'dc_summer20', code: 'SUMMER20', redemptionCount: 12 },
            ],
          },
        ],
      },
    },
  })
  usageSummary() {
    return this.campaignsService.usageSummary();
  }

  @Get()
  @ApiOperation({
    summary: 'List campaigns',
    description: 'Returns all campaign labels available for discount codes.',
  })
  @ApiOkResponse({
    description: 'Campaign list',
    examples: {
      campaigns: {
        summary: 'Campaigns',
        value: [
          {
            id: 'cm_campaign_black_friday',
            name: 'Black Friday',
            createdAt: '2026-05-20T12:00:00.000Z',
            updatedAt: '2026-05-20T12:00:00.000Z',
          },
        ],
      },
    },
  })
  findAll() {
    return this.campaignsService.findAll();
  }
}
