import type { Response, CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const REFRESH_TOKEN_COOKIE_PATH = '/auth/refresh';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getRefreshTokenCookieBaseOptions = (): CookieOptions => ({
  httpOnly: true,
  path: REFRESH_TOKEN_COOKIE_PATH,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});

export const setRefreshTokenCookie = (response: Response, refreshToken: string) => {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...getRefreshTokenCookieBaseOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

export const clearRefreshTokenCookie = (response: Response) => {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieBaseOptions());
};
