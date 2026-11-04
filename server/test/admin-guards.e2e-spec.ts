import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
type AdminRoute = { method: HttpMethod; path: string; url: string };
type ExpressRouteLayer = {
  route?: { path: unknown; methods: Record<string, boolean | undefined> };
};

const ADMIN_PREFIX = '/admin';
const HTTP_METHODS: readonly HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];
// Discovery must find at least this many routes; fewer means the walk over the router broke.
const MIN_ADMIN_ROUTES = 20;
// Replaces `:param` segments. Guards run before pipes, so the value only has to keep the path
// well-formed: a 401 or 403 shows the guard answered before the parameter was parsed.
const PARAM_PLACEHOLDER = '1';
const OPERATION_ROUTE: AdminRoute = {
  method: 'get',
  path: '/admin/backups/operation',
  url: '/admin/backups/operation',
};
// The only /admin route without a guard by design: the one-time link in the URL is the credential.
// Anything else that answers neither 401 nor 403 without a token fails the loops below.
const DOWNLOAD_ROUTE_PATH = '/admin/backups/download/:token';
const DUMP_CONTENT_TYPE = 'application/octet-stream';

/**
 * Walks the Express router that Nest registered, so the list is what the server really serves
 * and a new admin route is covered without editing this file.
 */
const listAdminRoutes = (app: INestApplication): AdminRoute[] => {
  const { router } = app.getHttpAdapter().getInstance() as {
    router: { stack: ExpressRouteLayer[] };
  };

  return router.stack.flatMap(({ route }) => {
    const path = route?.path;

    if (!route || typeof path !== 'string') {
      return [];
    }
    if (path !== ADMIN_PREFIX && !path.startsWith(`${ADMIN_PREFIX}/`)) {
      return [];
    }

    return Object.entries(route.methods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => {
        if (!HTTP_METHODS.includes(method as HttpMethod)) {
          throw new Error(`Unexpected HTTP method on ${path}: ${method}`);
        }

        return {
          method: method as HttpMethod,
          path,
          url: path.replace(/:[A-Za-z_]\w*/g, PARAM_PLACEHOLDER),
        };
      });
  });
};

describe('Admin guards (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let routes: AdminRoute[];
  let userToken = '';

  const email = `admin-guards-e2e-${Date.now()}@example.com`;
  const password = 'Password123';

  const send = (route: AdminRoute, token?: string) => {
    const call = request(app.getHttpServer())[route.method](route.url);

    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };

  const describeRoute = (route: AdminRoute) => `${route.method.toUpperCase()} ${route.path}`;

  const guardedRoutes = () => routes.filter((route) => route.path !== DOWNLOAD_ROUTE_PATH);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    routes = listAdminRoutes(app);

    await prisma.user.deleteMany({ where: { email } });
    await createE2eUser(prisma, { email, password, name: 'Guards E2E' });

    const signinResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(200);

    userToken = signinResponse.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('finds every /admin route registered by the application', () => {
    expect(routes.length).toBeGreaterThan(MIN_ADMIN_ROUTES);
    expect(routes).toContainEqual(expect.objectContaining(OPERATION_ROUTE));
  });

  it('answers 401 to every guarded /admin route without a token', async () => {
    const failures: string[] = [];

    for (const route of guardedRoutes()) {
      const response = await send(route);

      if (response.status !== 401) {
        failures.push(`${describeRoute(route)} -> ${response.status}`);
      }
    }

    expect(failures).toEqual([]);
  }, 60_000);

  it('answers 403 to every guarded /admin route with a USER token', async () => {
    const failures: string[] = [];

    for (const route of guardedRoutes()) {
      const response = await send(route, userToken);

      if (response.status !== 403) {
        failures.push(`${describeRoute(route)} -> ${response.status}`);
      }
    }

    expect(failures).toEqual([]);
  }, 60_000);

  it('serves the one-time download route without a token only as an expired-link 404', async () => {
    const route = routes.find((candidate) => candidate.path === DOWNLOAD_ROUTE_PATH);

    expect(route).toBeDefined();

    const response = await send(route!).expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'BACKUP_DOWNLOAD_LINK_EXPIRED' },
    });
    expect(response.headers['content-type']).not.toContain(DUMP_CONTENT_TYPE);
    expect(response.headers['content-disposition']).toBeUndefined();
  });

  it('GET /admin/backups/operation requires a token and refuses a USER outside maintenance', async () => {
    // Only AtGuard on the route: getStatus checks the role itself outside maintenance.
    await send(OPERATION_ROUTE).expect(401);

    const response = await send(OPERATION_ROUTE, userToken).expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
  });
});
