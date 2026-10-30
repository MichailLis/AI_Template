import type { Response, CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const REFRESH_TOKEN_COOKIE_PATH = '/auth/refresh';

const getRefreshTokenCookieBaseOptions = (): CookieOptions => ({
  httpOnly: true,
  path: REFRESH_TOKEN_COOKIE_PATH,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});

/** Without maxAge the cookie is a session cookie: it dies when the browser closes (#176). */
export const setRefreshTokenCookie = (
  response: Response,
  refreshToken: string,
  maxAgeMs: number | undefined,
) => {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...getRefreshTokenCookieBaseOptions(),
    ...(maxAgeMs === undefined ? {} : { maxAge: maxAgeMs }),
  });
};

export const clearRefreshTokenCookie = (response: Response) => {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieBaseOptions());
};
