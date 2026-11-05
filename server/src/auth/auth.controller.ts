import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/auth.dto';
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
  /** Cookie с refresh-токеном уходит только по HTTPS в production. */
  private readonly secureCookies: boolean;

  constructor(
    private authService: AuthService,
    config: ConfigService,
  ) {
    this.secureCookies = config.get<string>('NODE_ENV') === 'production';
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto })
  async signin(@Body() dto: SigninDto, @Res({ passthrough: true }) response: Response) {
    const authResult = await this.authService.signin(dto);
    setRefreshTokenCookie(
      response,
      authResult.refreshToken,
      authResult.refreshCookieMaxAgeMs,
      this.secureCookies,
    );

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
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged out' })
  async logout(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('sid') sessionId: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(userId, sessionId);
    clearRefreshTokenCookie(response, this.secureCookies);
  }

  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, type: RefreshResponseDto })
  async refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('sid') sessionId: unknown,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshTokens(userId, sessionId, refreshToken);
    setRefreshTokenCookie(
      response,
      tokens.refreshToken,
      tokens.refreshCookieMaxAgeMs,
      this.secureCookies,
    );

    return {
      accessToken: tokens.accessToken,
    };
  }
}
