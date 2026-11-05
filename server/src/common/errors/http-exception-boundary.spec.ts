import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_DIR = join(__dirname, '..', '..');

/** Транспортный слой: здесь HTTP-исключения на своем месте. */
const TRANSPORT_FILE = /\.(controller|service|guard|strategy|client|filter)\.ts$/;
/** Читает чужие HTTP-исключения (клиент ИИ заворачивает ошибку SDK в `BadGatewayException`), сам их не бросает. */
const ALLOWED_UTILITIES = new Set(['ai-provider/ai-provider.failure.ts']);

const HTTP_EXCEPTION_IMPORT =
  /import\s*(?:type\s*)?\{[^}]*\b(?:\w+Exception|HttpException)\b[^}]*\}\s*from\s*'@nestjs\/common'/;

const listSources = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSources(path);
    }

    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });

describe('HTTP exception boundary', () => {
  it('keeps HTTP exceptions out of utilities and domain functions (#167)', () => {
    const offenders = listSources(SRC_DIR)
      .map((path) => relative(SRC_DIR, path).replace(/\\/g, '/'))
      .filter((path) => !TRANSPORT_FILE.test(path) && !ALLOWED_UTILITIES.has(path))
      .filter((path) => HTTP_EXCEPTION_IMPORT.test(readFileSync(join(SRC_DIR, path), 'utf8')));

    // Rule functions throw a DomainError from common/errors; AllExceptionsFilter turns it into HTTP.
    expect(offenders).toEqual([]);
  });
});
