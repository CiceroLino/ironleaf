import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { DiscountType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiscountCodeDto {
  @ApiProperty({
    description: 'Alphanumeric discount code customers redeem',
    example: 'SUMMER20',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Existing campaign ID that groups this discount code',
    example: 'cm_campaign_123',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({
    description: 'Whether the discount is percentage based or fixed amount',
    enum: DiscountType,
    example: DiscountType.PERCENT,
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    description: 'Amount off. Use 20 for 20% or 20 currency units.',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  discountValue: number;

  @ApiPropertyOptional({
    description: 'Currency code required for fixed-amount discounts',
    example: 'USD',
  })
  @ValidateIf((dto: CreateDiscountCodeDto) => dto.discountType === 'FIXED')
  @IsString()
  @IsNotEmpty()
  currency?: string;

  @ApiPropertyOptional({
    description:
      'ISO date or date-time when the discount code stops being valid',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({
    description: 'Maximum number of successful redemptions allowed',
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  usageLimit: number;
}
