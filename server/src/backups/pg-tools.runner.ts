import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';

const OUTPUT_LIMIT = 64 * 1024;
const KILL_GRACE_MS = 5_000;

export class PgToolMissingError extends Error {
  constructor(command: string) {
    super(`${command} is not installed`);
  }
}

export class PgToolFailedError extends Error {}

export interface PgToolRunOptions {
  env: Record<string, string>;
  timeoutMs: number;
}

const appendLimited = (current: string, chunk: Buffer) =>
  current.length >= OUTPUT_LIMIT ? current : (current + chunk.toString()).slice(0, OUTPUT_LIMIT);

/**
 * Запуск клиентских утилит PostgreSQL без shell: аргументы не интерпретируются, а зависший процесс
 * снимается по таймауту. Вынесен отдельно, чтобы сервис тестировался без настоящего `pg_dump`.
 */
@Injectable()
export class PgToolsRunner {
  run(command: string, args: string[], { env, timeoutMs }: PgToolRunOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        env: { ...process.env, ...env },
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS).unref();
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        stdout = appendLimited(stdout, chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = appendLimited(stderr, chunk);
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        reject(error.code === 'ENOENT' ? new PgToolMissingError(command) : error);
      });

      child.on('close', (code) => {
        clearTimeout(timer);

        if (timedOut) {
          reject(new PgToolFailedError(`${command} did not finish in ${timeoutMs} ms`));
          return;
        }

        if (code !== 0) {
          reject(new PgToolFailedError(stderr.trim() || `${command} exited with code ${code}`));
          return;
        }

        resolve(stdout);
      });
    });
  }
}
