import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@spotly/types';

class RegisterDto {
  @IsEnum(['CONSUMER', 'MERCHANT'])
  @IsOptional()
  role?: UserRole;
}

class AddFavoriteDto {
  @IsString()
  merchantId!: string;
}

class UpdateProfileDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() location?: string;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /api/user/register
   * Called after Firebase sign-in. Creates user doc in Firestore if not exists.
   */
  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async register(
    @CurrentUser() user: DecodedUser,
    @Body() body: RegisterDto,
  ) {
    const result = await this.userService.upsertUser(
      user.uid,
      user.email ?? '',
      user.name ?? 'Anonymous',
      body.role ?? 'CONSUMER',
    );
    return { success: true, data: result };
  }

  /**
   * GET /api/user/me
   * Returns the current authenticated user's profile.
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@CurrentUser() user: DecodedUser) {
    const profile = await this.userService.findById(user.uid);
    return { success: true, data: profile };
  }

  /**
   * PATCH /api/user/me
   * Update current authenticated user's profile.
   */
  @Patch('me')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(
    @CurrentUser() user: DecodedUser,
    @Body() body: UpdateProfileDto,
  ) {
    const profile = await this.userService.updateProfile(user.uid, body);
    return { success: true, data: profile };
  }
  @Get('favorites')
@UseGuards(FirebaseAuthGuard)
async getFavorites(@CurrentUser() user: DecodedUser) {
  const data = await this.userService.getFavorites(user.uid);
  return { success: true, data };
}

@Post('favorites/:merchantId')
@UseGuards(FirebaseAuthGuard)
async addFavorite(
  @CurrentUser() user: DecodedUser,
  @Param('merchantId') merchantId: string,
) {
  await this.userService.addFavorite(user.uid, merchantId);
  return { success: true };
}

@Delete('favorites/:merchantId')
@UseGuards(FirebaseAuthGuard)
async removeFavorite(
  @CurrentUser() user: DecodedUser,
  @Param('merchantId') merchantId: string,
) {
  await this.userService.removeFavorite(user.uid, merchantId);
  return { success: true };
}
}
