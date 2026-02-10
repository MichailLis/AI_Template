import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any[] = [];

    // 1. Обработка стандартных HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : res.message || message;
      code = res.error || 'HTTP_ERROR';
    }

    // 2. Обработка Zod Validation ошибок
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

    // 3. Обработка Prisma ошибок (например, Unique constraint)
    if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaException = exception as { code: string; meta?: { target?: string[] } };
      if (prismaException.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = prismaException.meta?.target;
        message = `Unique constraint failed on field: ${target}`;
        code = 'DB_UNIQUE_CONSTRAINT';
      }
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
