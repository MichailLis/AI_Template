import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto/auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AtGuard, RtGuard } from './guards';
import { GetCurrentUserId, GetCurrentUser } from './decorators';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
} from './auth-cookie';

@ApiTags('auth')
@ApiErrorResponses()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponseDto })
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response) {
    const authResult = await this.authService.signup(dto);
    setRefreshTokenCookie(response, authResult.refreshToken);

    return {
      accessToken: authResult.accessToken,
      user: authResult.user,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto })
  async signin(@Body() dto: SigninDto, @Res({ passthrough: true }) response: Response) {
    const authResult = await this.authService.signin(dto);
    setRefreshTokenCookie(response, authResult.refreshToken);

    return {
      accessToken: authResult.accessToken,
      user: authResult.user,
    };
  }

  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  async logout(@GetCurrentUserId() userId: number, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(userId);
    clearRefreshTokenCookie(response);
  }

  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, type: RefreshResponseDto })
  async refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    setRefreshTokenCookie(response, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }
}
