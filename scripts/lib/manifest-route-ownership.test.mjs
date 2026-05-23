import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getRouteManifestErrors, isAllowedManifestRoute } from './manifest-route-ownership.mjs';

const adminFeature = {
  name: 'admin',
  route: '/admin',
  ownership: { kind: 'admin-shell' },
  additionalRoutes: ['/admin/users', '/admin/settings'],
};

const testsFeature = {
  name: 'tests',
  route: '/admin/tests',
  ownership: { kind: 'product-feature', adminRoutesAreUiHost: true },
  additionalRoutes: ['/admin/public-links'],
};

describe('isAllowedManifestRoute', () => {
  it('does not let the admin shell route own arbitrary nested admin routes', () => {
    assert.equal(
      isAllowedManifestRoute('/admin/hidden-feature', {
        features: [adminFeature],
      }),
      false,
    );
  });

  it('allows explicitly declared admin-owned routes', () => {
    assert.equal(
      isAllowedManifestRoute('/admin/users', {
        features: [adminFeature],
      }),
      true,
    );
  });

  it('allows product features to own nested admin-hosted route roots', () => {
    assert.equal(
      isAllowedManifestRoute('/admin/public-links/stats', {
        features: [adminFeature, testsFeature],
      }),
      true,
    );
  });
});

describe('getRouteManifestErrors', () => {
  it('rejects malformed additionalRoutes', () => {
    assert.deepEqual(
      getRouteManifestErrors([{ name: 'bad', route: '/bad', additionalRoutes: ['bad-route'] }]),
      ['feature:bad: additionalRoutes[0] must start with "/"'],
    );
  });
});
