import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { SigninDto } from './dto/auth.dto';
import * as argon2 from 'argon2';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Lets an unknown email spend the same argon2 time as a known one (see signin).
let dummyHashPromise: Promise<string> | undefined;
// A failed hash is dropped so the next call retries instead of failing every unknown email.
const getDummyHash = () =>
  (dummyHashPromise ??= argon2.hash(randomUUID()).catch((error: unknown) => {
    dummyHashPromise = undefined;
    throw error;
  }));

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signin(dto: SigninDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await argon2.verify(await getDummyHash(), dto.password).catch(() => false);
      throw new ForbiddenException('Access Denied');
    }

    const passwordMatches = await argon2.verify(user.password, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    // Checked after the password so the message does not reveal which emails have accounts.
    if (user.deactivatedAt) throw new ForbiddenException('Account is deactivated');

    const tokens = await this.getTokens(user.id, user.email);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedRefreshToken: await argon2.hash(tokens.refreshToken),
        lastLoginAt: new Date(),
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRefreshToken || user.deactivatedAt) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await argon2.verify(user.hashedRefreshToken, refreshToken);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    const updateResult = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        hashedRefreshToken: user.hashedRefreshToken,
      },
      data: { hashedRefreshToken },
    });

    if (updateResult.count !== 1) {
      throw new ForbiddenException('Access Denied');
    }

    return tokens;
  }

  // Helpers
  async getTokens(userId: number, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, refreshNonce: randomUUID() },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }
}
