import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { DiscountCodesService } from './discount-codes.service';

@Controller('discount-codes')
export class DiscountCodesController {
  constructor(private readonly discountCodesService: DiscountCodesService) {}

  @Post()
  create(@Body() createDiscountCodeDto: CreateDiscountCodeDto) {
    return this.discountCodesService.create(createDiscountCodeDto);
  }

  @Get()
  findAll() {
    return this.discountCodesService.findAll();
  }

  @Post(':code/redeem')
  redeem(@Param('code') code: string) {
    return this.discountCodesService.redeem(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discountCodesService.findOne(id);
  }
}
