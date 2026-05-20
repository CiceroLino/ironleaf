import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign label used to group discount codes',
    example: 'Black Friday',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
