import { planExistingUserUpdates } from './bootstrap-admin';

describe('planExistingUserUpdates', () => {
  it('never restores the ADMIN role of an existing user', () => {
    expect(
      planExistingUserUpdates({ name: 'Admin' }, { name: 'Admin', hashedPassword: null }),
    ).toEqual({});
  });

  it('revokes refresh sessions together with a password reset', () => {
    expect(
      planExistingUserUpdates({ name: 'Admin' }, { name: 'Admin', hashedPassword: 'hash' }),
    ).toEqual({ password: 'hash', hashedRefreshToken: null });
  });

  it('fills a missing name only', () => {
    expect(
      planExistingUserUpdates({ name: null }, { name: 'Admin', hashedPassword: null }),
    ).toEqual({
      name: 'Admin',
    });
  });
});
