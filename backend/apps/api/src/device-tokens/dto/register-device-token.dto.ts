import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from 'app/domain';
import { IsEnum, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty()
  @IsString()
  fcmToken: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}
