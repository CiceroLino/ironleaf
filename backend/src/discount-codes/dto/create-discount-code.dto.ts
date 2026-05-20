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
import { DiscountType } from '../../../generated/prisma/client';

export class CreateDiscountCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @IsPositive()
  discountValue: number;

  @ValidateIf((dto: CreateDiscountCodeDto) => dto.discountType === 'FIXED')
  @IsString()
  @IsNotEmpty()
  currency?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsInt()
  @Min(1)
  usageLimit: number;
}
