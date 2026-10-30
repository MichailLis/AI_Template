import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { SigninDto } from './dto/auth.dto';
import * as argon2 from 'argon2';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** #176: сессия заканчивается через 8 ч без refresh или через 7 дней после входа. */
export const SESSION_IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const expiredSessionsWhere = (now: number) => ({
  OR: [
    { lastUsedAt: { lt: new Date(now - SESSION_IDLE_TIMEOUT_MS) } },
    { createdAt: { lt: new Date(now - SESSION_MAX_AGE_MS) } },
  ],
});

const refreshDenied = () => new ForbiddenException('Access Denied', 'REFRESH_DENIED');

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
      throw new ForbiddenException('Access Denied', 'INVALID_CREDENTIALS');
    }

    const passwordMatches = await argon2.verify(user.password, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Access Denied', 'INVALID_CREDENTIALS');

    // Checked after the password so the message does not reveal which emails have accounts.
    if (user.deactivatedAt)
      throw new ForbiddenException('Account is deactivated', 'ACCOUNT_DEACTIVATED');

    const rememberDevice = dto.rememberDevice ?? false;
    const tokens = await this.prisma.$transaction(async (tx) => {
      // Истёкшие сессии пользователя убираются при входе, чтобы таблица не росла.
      await tx.authSession.deleteMany({
        where: { userId: user.id, ...expiredSessionsWhere(Date.now()) },
      });
      // Хэш пишется вторым шагом: refresh-токен несёт id сессии, которого до вставки ещё нет.
      const session = await tx.authSession.create({
        data: { userId: user.id, hashedRefreshToken: '', rememberDevice },
      });
      const sessionTokens = await this.getTokens(user.id, user.email, session.id);
      await tx.authSession.update({
        where: { id: session.id },
        data: { hashedRefreshToken: await argon2.hash(sessionTokens.refreshToken) },
      });
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return sessionTokens;
    });

    return {
      ...tokens,
      refreshCookieMaxAgeMs: rememberDevice ? SESSION_MAX_AGE_MS : undefined,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /** Ends only this device's session; access tokens issued before #123 carry no session id. */
  async logout(userId: number, sessionId: unknown) {
    if (typeof sessionId !== 'number') return;
    await this.prisma.authSession.deleteMany({ where: { id: sessionId, userId } });
  }

  async refreshTokens(userId: number, sessionId: unknown, refreshToken: string) {
    if (typeof sessionId !== 'number') throw refreshDenied();

    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId },
      include: { user: { select: { email: true, deactivatedAt: true } } },
    });

    if (!session || session.user.deactivatedAt) throw refreshDenied();

    const now = Date.now();
    if (
      now - session.lastUsedAt.getTime() > SESSION_IDLE_TIMEOUT_MS ||
      now - session.createdAt.getTime() > SESSION_MAX_AGE_MS
    ) {
      await this.prisma.authSession.deleteMany({ where: { id: session.id } });
      throw refreshDenied();
    }

    const refreshTokenMatches = await argon2.verify(session.hashedRefreshToken, refreshToken);
    if (!refreshTokenMatches) throw refreshDenied();

    const tokens = await this.getTokens(userId, session.user.email, session.id);
    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    const updateResult = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        hashedRefreshToken: session.hashedRefreshToken,
      },
      data: { hashedRefreshToken, lastUsedAt: new Date(now) },
    });

    if (updateResult.count !== 1) throw refreshDenied();

    return {
      ...tokens,
      // Запомненное устройство держит cookie до абсолютного срока сессии, не продлевая его.
      refreshCookieMaxAgeMs: session.rememberDevice
        ? session.createdAt.getTime() + SESSION_MAX_AGE_MS - now
        : undefined,
    };
  }

  // Helpers
  async getTokens(userId: number, email: string, sessionId: number) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, sid: sessionId },
        {
          secret: this.config.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, sid: sessionId, refreshNonce: randomUUID() },
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
