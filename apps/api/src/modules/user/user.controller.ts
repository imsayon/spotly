import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@spotly/types';

class RegisterDto {
  @IsEnum(['CONSUMER', 'MERCHANT'])
  @IsOptional()
  role?: UserRole;
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
}
