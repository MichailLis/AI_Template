const normalizeRoutePath = (route) => {
  if (typeof route !== 'string') {
    return null;
  }

  const trimmedRoute = route.trim().replace(/\/+$/, '');
  return trimmedRoute || '/';
};

const routeMatchesRoot = (route, routeRoot) =>
  route === routeRoot || route.startsWith(`${routeRoot}/`);

const getFeatureRouteRoots = (feature) => {
  const routeRoots = [
    feature.route,
    ...(Array.isArray(feature.additionalRoutes) ? feature.additionalRoutes : []),
  ];

  return routeRoots.map(normalizeRoutePath).filter(Boolean);
};

export const isAdminShellFeature = (feature) => feature?.ownership?.kind === 'admin-shell';

export const getRouteManifestErrors = (features) => {
  const errors = [];

  for (const feature of features) {
    const featurePrefix = `feature:${feature.name ?? '<unknown>'}`;

    if (feature.additionalRoutes !== undefined && !Array.isArray(feature.additionalRoutes)) {
      errors.push(`${featurePrefix}: additionalRoutes must be an array`);
      continue;
    }

    for (const [index, route] of (feature.additionalRoutes ?? []).entries()) {
      const normalizedRoute = normalizeRoutePath(route);

      if (!normalizedRoute || normalizedRoute === '/') {
        errors.push(`${featurePrefix}: additionalRoutes[${index}] must be a non-root route`);
        continue;
      }

      if (!normalizedRoute.startsWith('/')) {
        errors.push(`${featurePrefix}: additionalRoutes[${index}] must start with "/"`);
      }
    }
  }

  return errors;
};

export const isAllowedManifestRoute = (
  route,
  { authRoutes = [], publicRoutes = [], features = [] },
) => {
  const normalizedRoute = normalizeRoutePath(route);

  if (!normalizedRoute) {
    return false;
  }

  if (normalizedRoute === '/' || normalizedRoute === '*') {
    return true;
  }

  if (authRoutes.includes(normalizedRoute) || publicRoutes.includes(normalizedRoute)) {
    return true;
  }

  for (const feature of features) {
    const primaryRoute = normalizeRoutePath(feature.route);
    const additionalRoutes = Array.isArray(feature.additionalRoutes)
      ? feature.additionalRoutes.map(normalizeRoutePath).filter(Boolean)
      : [];

    if (normalizedRoute === primaryRoute || additionalRoutes.includes(normalizedRoute)) {
      return true;
    }
  }

  for (const feature of features) {
    const primaryRoute = normalizeRoutePath(feature.route);
    const routeRoots = getFeatureRouteRoots(feature);

    for (const routeRoot of routeRoots) {
      if (isAdminShellFeature(feature) && routeRoot === primaryRoute) {
        continue;
      }

      if (routeMatchesRoot(normalizedRoute, routeRoot)) {
        return true;
      }
    }
  }

  return false;
};
