import { AxiosError, type AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';

import api from './api';
import { getAdminControllerCreateUserMutationOptions } from './generated/admin/admin';
import {
  authControllerSignin,
  getAuthControllerSigninMutationOptions,
} from './generated/auth/auth';
import { getTestsPublicControllerStartSessionMutationOptions } from './generated/tests-public/tests-public';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('generated API runtime contract', () => {
  it('preserves default mutation keys and caller overrides across auth, admin and public hooks', () => {
    expect(getAuthControllerSigninMutationOptions().mutationKey).toEqual(['authControllerSignin']);
    expect(getAdminControllerCreateUserMutationOptions().mutationKey).toEqual([
      'adminControllerCreateUser',
    ]);
    expect(getTestsPublicControllerStartSessionMutationOptions().mutationKey).toEqual([
      'testsPublicControllerStartSession',
    ]);
    expect(
      getAuthControllerSigninMutationOptions({ mutation: { mutationKey: ['custom', 'signin'] } })
        .mutationKey,
    ).toEqual(['custom', 'signin']);
    expect(getAuthControllerSigninMutationOptions({ mutation: {} }).mutationKey).toEqual([
      'authControllerSignin',
    ]);
  });

  it('sends generated requests through the configured Axios mutator with request overrides', async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.url).toBe('/auth/signin');
      expect(config.method).toBe('post');
      expect(config.baseURL).toBe('https://override.test');
      expect(config.withCredentials).toBe(true);
      expect(JSON.parse(config.data as string)).toEqual({
        email: 'user@test.dev',
        password: 'secret',
      });
      return { data: { accessToken: 'token' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    api.defaults.adapter = adapter;
    const response = await authControllerSignin(
      { email: 'user@test.dev', password: 'secret' },
      { baseURL: 'https://override.test' },
    );
    expect(response).toMatchObject({ data: { accessToken: 'token' } });
  });

  it('preserves Axios errors and the unified server error payload', async () => {
    const payload = {
      success: false,
      error: { code: 'AUTH_INVALID', message: 'Invalid credentials' },
    };
    api.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        data: payload,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };
    await expect(
      authControllerSignin({ email: 'user@test.dev', password: 'secret' }),
    ).rejects.toMatchObject({ isAxiosError: true, response: { status: 401, data: payload } });
  });
});
