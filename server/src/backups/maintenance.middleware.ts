import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { MaintenanceState } from './maintenance-state';

/** Маршруты, которые работают и во время восстановления: статус операции и проверка здоровья. */
const ALLOWED_PATHS = ['/admin/backups/operation', '/health'];

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private readonly maintenance: MaintenanceState) {}

  use(request: Request, response: Response, next: NextFunction) {
    const path = request.originalUrl.split('?')[0];

    if (!this.maintenance.isActive || ALLOWED_PATHS.includes(path)) {
      next();
      return;
    }

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'MAINTENANCE',
        message: this.maintenance.message ?? 'Идут технические работы, попробуйте через минуту',
        details: [],
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
