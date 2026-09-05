import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkClientStorageDiscipline,
  checkControllerSwagger,
  checkDtoNoZodDate,
  checkErrorResponseDto,
  checkErrorResponseShape,
  checkPublicDtoSafety,
  checkReactQueryStateMirroring,
  checkSetupAppErrorFilter,
  parseControllerHandlers,
} from './invariant-rules.mjs';

describe('checkControllerSwagger', () => {
  it('accepts valid controller handler with @ApiOperation and typed @ApiResponse', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, type: UserListDto })
  getUsers() {}
}
`;
    assert.deepEqual(checkControllerSwagger({ relativePath: 'users.controller.ts', source }), []);
  });

  it('accepts @ApiResponse with description and no type (logout case)', () => {
    const source = `
@Controller('auth')
export class AuthController {
  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  logout() {}
}
`;
    assert.deepEqual(checkControllerSwagger({ relativePath: 'auth.controller.ts', source }), []);
  });

  it('accepts known response helper function call apiBinaryResponse', () => {
    const source = `
@Controller('export')
export class ExportController {
  @Get('report')
  @ApiOperation({ summary: 'Export report' })
  @ApiResponse(apiBinaryResponse(XLSX_TYPE, 'Excel report'))
  exportReport() {}
}
`;
    assert.deepEqual(checkControllerSwagger({ relativePath: 'export.controller.ts', source }), []);
  });

  it('reports error when @ApiOperation is missing', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Get()
  @ApiResponse({ status: 200, type: UserListDto })
  getUsers() {}
}
`;
    const errors = checkControllerSwagger({ relativePath: 'users.controller.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must have an @ApiOperation decorator/);
  });

  it('reports error when @ApiResponse is missing', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List users' })
  getUsers() {}
}
`;
    const errors = checkControllerSwagger({ relativePath: 'users.controller.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must have at least one @ApiResponse decorator/);
  });

  it('reports error when @ApiResponse lacks both type and description', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200 })
  getUsers() {}
}
`;
    const errors = checkControllerSwagger({ relativePath: 'users.controller.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must specify status and type or description/);
  });

  it('reports error when @ApiResponse lacks status', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ type: UserListDto })
  getUsers() {}
}
`;
    const errors = checkControllerSwagger({ relativePath: 'users.controller.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must specify status and type or description/);
  });

  it('does not attribute class-level decorators to the first method', () => {
    const source = `
@ApiTags('items')
@ApiPublicErrorResponses()
@Controller('items')
export class ItemsController {
  @Get()
  getItems() {}
}
`;
    const handlers = parseControllerHandlers(source, 'items.controller.ts');
    assert.equal(handlers.length, 1);
    const names = handlers[0].decorators.map((d) => d.name);
    assert.deepEqual(names, ['Get']);
  });
});

describe('checkDtoNoZodDate', () => {
  it('accepts DTO without z.date()', () => {
    const source = `
export const UserSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
});
`;
    assert.deepEqual(checkDtoNoZodDate({ relativePath: 'user.dto.ts', source }), []);
  });

  it('reports error when z.date() is used', () => {
    const source = `
export const UserSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
});
`;
    const errors = checkDtoNoZodDate({ relativePath: 'user.dto.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /z\.date\(\) is forbidden in DTOs/);
  });

  it('ignores z.date() inside comments', () => {
    const source = `
// Prisma produces Date, do not use z.date() here
/* z.date() is disallowed */
export const UserSchema = z.object({
  createdAt: z.string(),
});
`;
    assert.deepEqual(checkDtoNoZodDate({ relativePath: 'user.dto.ts', source }), []);
  });
});

describe('checkClientStorageDiscipline', () => {
  it('accepts safeStorage usage', () => {
    const source = `
import { safeStorage } from '@/shared/lib/storage';
const token = safeStorage.getItem('token');
`;
    assert.deepEqual(
      checkClientStorageDiscipline({ relativePath: 'client/src/features/auth.ts', source }),
      [],
    );
  });

  it('ignores localStorage mentioned in comments', () => {
    const source = `
// This mutator avoids localStorage because it runs in Node for Orval
/* Do not use localStorage directly */
export const api = axios.create();
`;
    assert.deepEqual(
      checkClientStorageDiscipline({ relativePath: 'client/src/shared/api/api.ts', source }),
      [],
    );
  });

  it('reports error for direct localStorage access', () => {
    const source = `
const token = localStorage.getItem('token');
`;
    const errors = checkClientStorageDiscipline({
      relativePath: 'client/src/features/auth.ts',
      source,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /direct use of "localStorage" is forbidden/);
  });

  it('reports error for direct sessionStorage access', () => {
    const source = `
const temp = sessionStorage.getItem('temp');
`;
    const errors = checkClientStorageDiscipline({
      relativePath: 'client/src/features/auth.ts',
      source,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /direct use of "sessionStorage" is forbidden/);
  });

  it('allows storage exceptions (storage.ts, storage.test.ts, generated api)', () => {
    const source = `
export const rawStorage = window.localStorage;
`;
    assert.deepEqual(
      checkClientStorageDiscipline({
        relativePath: 'client/src/shared/lib/storage.ts',
        source,
      }),
      [],
    );
    assert.deepEqual(
      checkClientStorageDiscipline({
        relativePath: 'client/src/shared/api/generated/auth.ts',
        source,
      }),
      [],
    );
  });
});

describe('checkErrorResponseShape', () => {
  it('accepts valid setup-app.ts', () => {
    const source = `
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
export const setupApp = (app: INestApplication) => {
  app.useGlobalFilters(new AllExceptionsFilter());
};
`;
    assert.deepEqual(
      checkSetupAppErrorFilter({ relativePath: 'server/src/setup-app.ts', source }),
      [],
    );
    assert.deepEqual(
      checkErrorResponseShape({ relativePath: 'server/src/setup-app.ts', source }),
      [],
    );
  });

  it('reports error when setup-app.ts misses AllExceptionsFilter registration', () => {
    const source = `
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
export const setupApp = (app: INestApplication) => {};
`;
    const errors = checkSetupAppErrorFilter({ relativePath: 'server/src/setup-app.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must register AllExceptionsFilter/);
  });

  it('reports error when setup-app.ts misses AllExceptionsFilter import', () => {
    const source = `
export const setupApp = (app: INestApplication) => {
  app.useGlobalFilters(new AllExceptionsFilter());
};
`;
    const errors = checkSetupAppErrorFilter({ relativePath: 'server/src/setup-app.ts', source });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must import AllExceptionsFilter/);
  });

  it('accepts valid error-response.dto.ts', () => {
    const source = `
export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.object({
    statusCode: z.number().int(),
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()),
  }),
  timestamp: z.string(),
  path: z.string(),
});
export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
`;
    assert.deepEqual(
      checkErrorResponseDto({
        relativePath: 'server/src/common/dto/error-response.dto.ts',
        source,
      }),
      [],
    );
  });

  it('reports error when error-response.dto.ts misses success field', () => {
    const source = `
export const ErrorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
`;
    const errors = checkErrorResponseDto({
      relativePath: 'server/src/common/dto/error-response.dto.ts',
      source,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must define success: z\.boolean\(\)/);
  });
});

describe('checkPublicDtoSafety', () => {
  it('accepts clean public DTO', () => {
    const source = `
export const PublicQuestionOptionSchema = z.object({
  id: z.number(),
  label: z.string(),
  value: z.string(),
});
`;
    assert.deepEqual(
      checkPublicDtoSafety({ relativePath: 'server/src/tests/dto/tests-public.dto.ts', source }),
      [],
    );
  });

  it('reports error for sensitive forbidden field', () => {
    const source = `
export const PublicQuestionOptionSchema = z.object({
  id: z.number(),
  prompt: z.string(),
  correctAnswer: z.string(),
});
`;
    const errors = checkPublicDtoSafety({
      relativePath: 'server/src/tests/dto/tests-public.dto.ts',
      source,
    });
    assert.equal(errors.length, 2);
    assert.match(errors[0], /forbidden sensitive field "prompt"/);
    assert.match(errors[1], /forbidden sensitive field "correctAnswer"/);
  });

  it('ignores forbidden field in comments', () => {
    const source = `
// System prompt is handled in backend only
/* rawResponse is stripped */
export const PublicQuestionOptionSchema = z.object({
  id: z.number(),
});
`;
    assert.deepEqual(
      checkPublicDtoSafety({ relativePath: 'server/src/tests/dto/tests-public.dto.ts', source }),
      [],
    );
  });
});

describe('checkReactQueryStateMirroring', () => {
  it('accepts rendering derived query data without state mirroring', () => {
    const source = `
const { data: topic } = useTopicQuery(id);
const title = topic?.title ?? '';
`;
    assert.deepEqual(
      checkReactQueryStateMirroring({ relativePath: 'client/src/widget.tsx', source }),
      [],
    );
  });

  it('reports error when useEffect mirrors query data into state via setState', () => {
    const source = `
const { data: topic } = useTopicQuery(id);
useEffect(() => {
  if (topic) {
    setTitle(topic.title);
  }
}, [topic]);
`;
    const errors = checkReactQueryStateMirroring({
      relativePath: 'client/src/widget.tsx',
      source,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /useEffect mirrors React Query data "topic" into state via "setTitle"/);
  });

  it('accepts useEffect calling setState when dependency is not from a query', () => {
    const source = `
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(1);
}, [isReady]);
`;
    assert.deepEqual(
      checkReactQueryStateMirroring({ relativePath: 'client/src/widget.tsx', source }),
      [],
    );
  });
  it('reports error when useEffect mirrors Orval generated query hook data into state', () => {
    const source = `
import { usePrivacyPolicyControllerGetPrivacyPolicy } from '@/shared/api/generated/privacy-policy/privacy-policy';

const { data } = usePrivacyPolicyControllerGetPrivacyPolicy();
useEffect(() => {
  if (data) {
    setTitle(data.title);
  }
}, [data]);
`;
    const errors = checkReactQueryStateMirroring({
      relativePath: 'client/src/pages/privacy/privacy-page.tsx',
      source,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /useEffect mirrors React Query data "data" into state via "setTitle"/);
  });

  it('accepts rendering derived data from Orval generated query hook without state mirroring', () => {
    const source = `
import { usePrivacyPolicyControllerGetPrivacyPolicy } from '@/shared/api/generated/privacy-policy/privacy-policy';

const { data } = usePrivacyPolicyControllerGetPrivacyPolicy();
const title = data?.title ?? '';
`;
    assert.deepEqual(
      checkReactQueryStateMirroring({
        relativePath: 'client/src/pages/privacy/privacy-page.tsx',
        source,
      }),
      [],
    );
  });

  it('accepts Orval mutation hook in useEffect with timer without false positive', () => {
    const source = `
import { useTestsControllerUpdateTopicDraft } from '@/shared/api/generated/tests/tests';

const updateDraftMutation = useTestsControllerUpdateTopicDraft();
useEffect(() => {
  if (updateDraftMutation.isPending) {
    return;
  }
  const timer = window.setTimeout(() => {
    saveDraft();
  }, 1000);
  return () => window.clearTimeout(timer);
}, [updateDraftMutation.isPending]);
`;
    assert.deepEqual(
      checkReactQueryStateMirroring({
        relativePath: 'client/src/features/tests/model/use-draft-autosave.ts',
        source,
      }),
      [],
    );
  });

  it('reports error when useEffect mirrors Orval mutation hook data into state', () => {
    const source = `
import { useTestsControllerUpdateTopicDraft } from '@/shared/api/generated/tests/tests';

const { data } = useTestsControllerUpdateTopicDraft();
useEffect(() => {
  if (data) {
    setTitle(data.title);
  }
}, [data]);
`;
    const errors = checkReactQueryStateMirroring({
      relativePath: 'client/src/features/tests/model/use-draft-autosave.ts',
      source,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /useEffect mirrors React Query data "data" into state via "setTitle"/);
  });
});
