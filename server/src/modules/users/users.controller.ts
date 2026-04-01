import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { UsersService } from './users.service';

class UpsertUserDto {
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() name: string;
}

class UpdatePushTokenDto {
  @IsString() @IsNotEmpty() pushToken: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** POST /api/v1/users — Register or update user by phone */
  @Post()
  upsert(@Body() dto: UpsertUserDto) {
    return this.usersService.upsertUser(dto.phone, dto.name);
  }

  /** PATCH /api/v1/users/:id/push-token — Update FCM push token */
  @Patch(':id/push-token')
  updatePushToken(@Param('id') id: string, @Body() dto: UpdatePushTokenDto) {
    return this.usersService.updatePushToken(id, dto.pushToken);
  }
}
