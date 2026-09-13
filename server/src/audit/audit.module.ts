import { Module } from '@nestjs/common';

import { AuditService } from './audit.service';

/**
 * Журнал изменений. Интеграционный модуль, а не фича: события пишут admin, analysis-prompts и tests,
 * а историю своих сущностей каждая фича отдает в своем маршруте.
 */
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
