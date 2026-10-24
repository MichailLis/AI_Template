import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

interface HttpErrorResponse {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as HttpErrorResponse;
      message =
        typeof res === 'string'
          ? res
          : (Array.isArray(res.message) ? res.message[0] : res.message) || message;
      code = res.error || 'HTTP_ERROR';
    }

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      const zodError = exception.getZodError() as ZodError;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
      details = zodError.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
    }

    if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaException = exception as {
        code: string;
        meta?: { target?: string[] };
      };
      if (prismaException.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = Array.isArray(prismaException.meta?.target)
          ? prismaException.meta?.target.join(', ')
          : 'unknown';
        message = `Unique constraint failed on field: ${target}`;
        code = 'DB_UNIQUE_CONSTRAINT';
      }
    }

    // body-parser / http-errors: a 4xx with a `type` (entity.too.large, entity.parse.failed, ...)
    const parserError = exception as { status?: unknown; type?: unknown } | null;
    if (
      !(exception instanceof HttpException) &&
      typeof parserError?.type === 'string' &&
      typeof parserError.status === 'number' &&
      parserError.status >= 400 &&
      parserError.status < 500
    ) {
      status = parserError.status;
      code = parserError.type;
      message = status === 413 ? 'Request body is too large' : 'Malformed request body';
    }

    if (status >= 500) {
      // route template, not request.url: the URL carries session and backup tokens
      this.logger.error(
        `${request.method} ${(request.route as { path?: string } | undefined)?.path ?? 'unmatched route'} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
