const toPosix = (path) => path.replace(/\\/g, '/');

export const stripComments = (source) => {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\r\n]/g, ' '))
    .replace(/\/\/[^\r\n]*/g, (match) => ' '.repeat(match.length));
};

const getLineNumber = (source, offset) => source.slice(0, offset).split(/\r?\n/).length;

const ROUTING_DECORATORS = new Set([
  'Get',
  'Post',
  'Put',
  'Patch',
  'Delete',
  'All',
  'Head',
  'Options',
]);

export const parseControllerHandlers = (source, relativePath = 'controller.ts') => {
  const clean = stripComments(source);

  const classMatch = /class\s+([A-Za-z0-9_$]+)[^{]*\{/.exec(clean);
  if (!classMatch) {
    return [];
  }

  const classBodyStart = classMatch.index + classMatch[0].length;
  let depth = 1;
  let classBodyEnd = classBodyStart;
  while (classBodyEnd < clean.length && depth > 0) {
    if (clean[classBodyEnd] === '{') {
      depth++;
    } else if (clean[classBodyEnd] === '}') {
      depth--;
    }
    classBodyEnd++;
  }
  const classBody = clean.slice(classBodyStart, classBodyEnd - 1);
  const classBodyOffset = classBodyStart;

  const handlers = [];
  let pos = 0;

  while (pos < classBody.length) {
    const nextAt = classBody.indexOf('@', pos);
    if (nextAt === -1) {
      break;
    }

    let p = nextAt;
    const decoratorList = [];
    let methodName = null;
    let methodOffset = null;

    while (p < classBody.length) {
      while (p < classBody.length && /\s/.test(classBody[p])) {
        p++;
      }
      if (classBody[p] === '@') {
        const atStart = p;
        p++;
        const nameMatch = classBody.slice(p).match(/^[A-Za-z0-9_$]+/);
        if (!nameMatch) {
          break;
        }
        const decName = nameMatch[0];
        p += decName.length;
        while (p < classBody.length && /\s/.test(classBody[p])) {
          p++;
        }
        let args = '';
        if (classBody[p] === '(') {
          let parenDepth = 1;
          const argStart = p + 1;
          p++;
          while (p < classBody.length && parenDepth > 0) {
            if (classBody[p] === '(') {
              parenDepth++;
            } else if (classBody[p] === ')') {
              parenDepth--;
            }
            p++;
          }
          args = classBody.slice(argStart, p - 1);
        }
        decoratorList.push({
          name: decName,
          args,
          full: classBody.slice(atStart, p),
          offset: classBodyOffset + atStart,
          line: getLineNumber(source, classBodyOffset + atStart),
        });
      } else {
        const sigMatch = classBody
          .slice(p)
          .match(
            /^(?:(?:public|private|protected|static|readonly|async)\s+)*([A-Za-z0-9_$]+)\s*\(/,
          );
        if (sigMatch) {
          methodName = sigMatch[1];
          methodOffset = classBodyOffset + p;
          const braceIndex = classBody.indexOf('{', p);
          if (braceIndex !== -1) {
            let bDepth = 1;
            let bPos = braceIndex + 1;
            while (bPos < classBody.length && bDepth > 0) {
              if (classBody[bPos] === '{') {
                bDepth++;
              } else if (classBody[bPos] === '}') {
                bDepth--;
              }
              bPos++;
            }
            pos = bPos;
          } else {
            pos = p + 1;
          }
        } else {
          pos = p + 1;
        }
        break;
      }
    }

    const routeDec = decoratorList.find((d) => ROUTING_DECORATORS.has(d.name));
    if (routeDec) {
      handlers.push({
        methodName: methodName || '<anonymous>',
        routeDecorator: routeDec,
        decorators: decoratorList,
        offset: methodOffset || routeDec.offset,
        line: getLineNumber(source, methodOffset || routeDec.offset),
        relativePath,
      });
    }
  }

  return handlers;
};

export const checkControllerSwagger = ({ relativePath, source }) => {
  const handlers = parseControllerHandlers(source, relativePath);
  const errors = [];

  for (const handler of handlers) {
    const apiOperation = handler.decorators.find((d) => d.name === 'ApiOperation');
    if (!apiOperation) {
      errors.push(
        `${relativePath}:${handler.line}: method "${handler.methodName}" must have an @ApiOperation decorator`,
      );
    }

    const apiResponses = handler.decorators.filter((d) => d.name === 'ApiResponse');
    if (apiResponses.length === 0) {
      errors.push(
        `${relativePath}:${handler.line}: method "${handler.methodName}" must have at least one @ApiResponse decorator`,
      );
    }

    for (const resp of apiResponses) {
      const args = resp.args.trim();
      const hasStatus = /\bstatus\b/.test(args);
      const hasType = /\btype\b/.test(args);
      const hasDescription = /\bdescription\b/.test(args);
      const isKnownHelper = /apiBinaryResponse\s*\(/.test(args);

      if (!isKnownHelper && (!hasStatus || (!hasType && !hasDescription))) {
        errors.push(
          `${relativePath}:${resp.line}: method "${handler.methodName}" @ApiResponse must specify status and type or description`,
        );
      }
    }
  }

  return errors;
};

export const checkDtoNoZodDate = ({ relativePath, source }) => {
  const clean = stripComments(source);
  const errors = [];
  const regex = /\bz\.date\s*\(/g;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    const line = getLineNumber(source, match.index);
    errors.push(
      `${relativePath}:${line}: z.date() is forbidden in DTOs; response DTOs must convert dates to z.string()`,
    );
  }
  return errors;
};

export const isClientStorageException = (relativePath) => {
  const normalized = toPosix(relativePath);
  return (
    normalized === 'client/src/shared/lib/storage.ts' ||
    normalized === 'client/src/shared/lib/storage.test.ts' ||
    normalized.startsWith('client/src/shared/api/generated/')
  );
};

export const checkClientStorageDiscipline = ({ relativePath, source }) => {
  if (isClientStorageException(relativePath)) {
    return [];
  }

  const clean = stripComments(source);
  const errors = [];
  const regex = /\b(localStorage|sessionStorage)\b/g;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    const line = getLineNumber(source, match.index);
    errors.push(
      `${relativePath}:${line}: direct use of "${match[1]}" is forbidden; use safeStorage from @/shared/lib/storage instead`,
    );
  }
  return errors;
};

export const checkSetupAppErrorFilter = ({ relativePath, source }) => {
  const clean = stripComments(source);
  const errors = [];
  if (
    !/import\s+[^;]*\bAllExceptionsFilter\b[^;]*from\s+['"][^'"]*all-exceptions\.filter['"]/.test(
      clean,
    )
  ) {
    errors.push(`${relativePath}: must import AllExceptionsFilter from all-exceptions.filter`);
  }
  if (!/app\.useGlobalFilters\s*\(\s*new\s+AllExceptionsFilter\s*\(\s*\)\s*\)/.test(clean)) {
    errors.push(
      `${relativePath}: must register AllExceptionsFilter via app.useGlobalFilters(new AllExceptionsFilter())`,
    );
  }
  return errors;
};

export const checkErrorResponseDto = ({ relativePath, source }) => {
  const clean = stripComments(source);
  const errors = [];
  if (!/export\s+const\s+ErrorResponseSchema\s*=\s*z\.object\s*\(/.test(clean)) {
    errors.push(`${relativePath}: must export ErrorResponseSchema using z.object(...)`);
  }
  if (!/success:\s*z\.boolean\s*\(\s*\)/.test(clean)) {
    errors.push(`${relativePath}: ErrorResponseSchema must define success: z.boolean()`);
  }
  if (
    !/error:\s*z\.object\s*\(\{[\s\S]*?\bcode:\s*z\.string\s*\(\s*\)[\s\S]*?\bmessage:\s*z\.string\s*\(\s*\)[\s\S]*?\}\)/.test(
      clean,
    )
  ) {
    errors.push(
      `${relativePath}: ErrorResponseSchema must define error: z.object({ ... }) with code and message strings`,
    );
  }
  if (
    !/export\s+class\s+ErrorResponseDto\s+extends\s+createZodDto\s*\(\s*ErrorResponseSchema\s*\)/.test(
      clean,
    )
  ) {
    errors.push(
      `${relativePath}: must export ErrorResponseDto extending createZodDto(ErrorResponseSchema)`,
    );
  }
  return errors;
};

export const checkErrorResponseShape = ({ relativePath, source }) => {
  const normPath = toPosix(relativePath);
  if (normPath.endsWith('server/src/setup-app.ts') || normPath === 'server/src/setup-app.ts') {
    return checkSetupAppErrorFilter({ relativePath, source });
  }
  if (
    normPath.endsWith('server/src/common/dto/error-response.dto.ts') ||
    normPath === 'server/src/common/dto/error-response.dto.ts'
  ) {
    return checkErrorResponseDto({ relativePath, source });
  }
  return [];
};

export const FORBIDDEN_PUBLIC_FIELDS = [
  'prompt',
  'systemPrompt',
  'rawResponse',
  'providerResponse',
  'providerRaw',
  'scoring',
  'scoringRules',
  'weights',
  'correctAnswer',
  'apiKey',
  'temperature',
];

export const isPublicDtoFile = (relativePath) => {
  const normalized = toPosix(relativePath);
  const filename = normalized.split('/').pop() ?? '';
  return /public/i.test(filename) && normalized.endsWith('.dto.ts');
};

export const checkPublicDtoSafety = ({ relativePath, source }) => {
  const clean = stripComments(source);
  const errors = [];
  for (const field of FORBIDDEN_PUBLIC_FIELDS) {
    const regex = new RegExp(`\\b${field}\\b`, 'g');
    let match;
    while ((match = regex.exec(clean)) !== null) {
      const line = getLineNumber(source, match.index);
      errors.push(`${relativePath}:${line}: forbidden sensitive field "${field}" in public DTO`);
    }
  }
  return errors;
};

const NON_STATE_SETTERS = new Set(['setTimeout', 'setInterval', 'setImmediate']);

const isGeneratedMutationHook = (name) => {
  return /Controller(?:Create|Update|Delete|Patch|Post|Put|Remove|Restore|Archive|Publish|Reorder|Import|Generate|Simulate|Signin|Signup|Logout|RefreshTokens|Save|Finish|Start)/.test(
    name,
  );
};

export const checkReactQueryStateMirroring = ({ relativePath, source }) => {
  const clean = stripComments(source);

  const generatedHooks = new Set();
  const importRegex =
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@\/shared\/api\/generated\/[^'"]*['"]/g;
  for (const match of clean.matchAll(importRegex)) {
    const specifiers = match[1].split(',');
    for (const spec of specifiers) {
      const trimmed = spec.trim();
      if (!trimmed || trimmed.startsWith('type ')) {
        continue;
      }
      const matchAs = trimmed.match(/\bas\s+([A-Za-z0-9_$]+)/);
      const importedIdent = matchAs ? matchAs[1] : trimmed.split(/\s+/)[0];
      if (/^use[A-Z]/.test(importedIdent) && !isGeneratedMutationHook(importedIdent)) {
        generatedHooks.add(importedIdent);
      }
    }
  }

  const hookPatterns = ['use[A-Za-z0-9_$]*Query'];
  for (const hook of generatedHooks) {
    hookPatterns.push(hook.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  const hookRegexPart = `(?:${hookPatterns.join('|')})`;

  const queryIds = new Set();
  const directRegex = new RegExp(
    `(?:const|let|var)\\s+([A-Za-z0-9_$]+)\\s*=\\s*${hookRegexPart}\\s*\\(`,
    'g',
  );
  for (const match of clean.matchAll(directRegex)) {
    queryIds.add(match[1]);
  }
  const destructRegex = new RegExp(
    `(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${hookRegexPart}\\s*\\(`,
    'g',
  );
  for (const match of clean.matchAll(destructRegex)) {
    const parts = match[1].split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }
      if (trimmed.includes(':')) {
        const bound = trimmed.split(':')[1].trim().split(/\s+/)[0];
        if (bound) {
          queryIds.add(bound);
        }
      } else {
        const bound = trimmed.split('=')[0].trim();
        if (bound) {
          queryIds.add(bound);
        }
      }
    }
  }

  if (queryIds.size === 0) {
    return [];
  }

  const errors = [];
  let idx = 0;
  while ((idx = clean.indexOf('useEffect(', idx)) !== -1) {
    let parenDepth = 1;
    let p = idx + 'useEffect('.length;
    while (p < clean.length && parenDepth > 0) {
      if (clean[p] === '(') {
        parenDepth++;
      } else if (clean[p] === ')') {
        parenDepth--;
      }
      p++;
    }
    const effectCall = clean.slice(idx, p);
    idx = p;

    const lastBracketOpen = effectCall.lastIndexOf('[');
    const lastBracketClose = effectCall.lastIndexOf(']');
    if (lastBracketOpen === -1 || lastBracketClose === -1 || lastBracketOpen > lastBracketClose) {
      continue;
    }
    const depsString = effectCall.slice(lastBracketOpen + 1, lastBracketClose);
    const deps = depsString
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const matchingDep = deps.find((dep) => {
      const baseIdent = dep.split(/[.?[\]]/)[0].trim();
      return queryIds.has(baseIdent);
    });

    if (!matchingDep) {
      continue;
    }

    const firstBrace = effectCall.indexOf('{');
    const lastBrace = effectCall.lastIndexOf('}', lastBracketOpen);
    const body =
      firstBrace !== -1 && lastBrace !== -1 ? effectCall.slice(firstBrace, lastBrace) : effectCall;

    const setterMatches = body.matchAll(/(?<![.\w])(set[A-Z][a-zA-Z0-9_$]*)\s*\(/g);
    for (const sm of setterMatches) {
      if (!NON_STATE_SETTERS.has(sm[1])) {
        const line = getLineNumber(source, idx);
        errors.push(
          `${relativePath}:${line}: useEffect mirrors React Query data "${matchingDep}" into state via "${sm[1]}". Derive state at render/submit boundary instead.`,
        );
        break;
      }
    }
  }

  return errors;
};
